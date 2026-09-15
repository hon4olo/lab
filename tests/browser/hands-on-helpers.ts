import { expect, type Page } from '@playwright/test';
import { calculateOrderLayout, finalizeOrderLayout } from '../../src/presentation/order/orderLayout';
import { createStationPresentation } from '../../src/presentation/order/stationPresentation';

interface AssemblyPlacement {
  readonly ingredientId: string;
}

interface AssemblyStroke {
  readonly ingredientId: string;
}

interface AssemblySnapshot {
  readonly placements: readonly AssemblyPlacement[];
  readonly sauceStrokes: readonly AssemblyStroke[];
}

export interface BrowserSnapshot {
  readonly orderId: string | null;
  readonly orderPhase: string | null;
  readonly shiftPhase: string | null;
  readonly campaignPhase: string | null;
  readonly shiftRunId: string | null;
  readonly scores: { readonly order: number; readonly cook: number; readonly chaos: number } | null;
  readonly payment: { readonly total: number; readonly transactionId: string } | null;
  readonly transformationResult: { readonly id: string } | null;
  readonly selectedIngredients: readonly string[];
  readonly preparedIngredients: readonly string[];
  readonly assembled: boolean;
  readonly assemblyReady: boolean;
  readonly assembly: AssemblySnapshot | null;
  readonly coins: number;
  readonly appliedPaymentIds: readonly string[];
  readonly discoveredTransformationIds: readonly string[];
  readonly grillState: {
    readonly active: boolean;
    readonly elapsedMs: number;
    readonly state: string;
    readonly result: { readonly state: string; readonly quality: number } | null;
    readonly slotId: string | null;
    readonly flipped: boolean;
    readonly idealFlipAtMs: number;
  } | null;
  readonly shiftCompleteLabel: string | null;
  readonly documentLanguage: string | null;
}

interface TestWindow {
  SNACK_LAB?: { getSnapshot(): BrowserSnapshot };
}

export interface ViewportCase {
  readonly name?: string;
  readonly width: number;
  readonly height: number;
}

export const BURGER_BUILD_INGREDIENTS = [
  'ingredient.bun-bottom',
  'ingredient.patty',
  'ingredient.cheese',
  'ingredient.sauce',
  'ingredient.extra-spicy',
  'ingredient.bun-top',
] as const;

export const HOTDOG_BUILD_INGREDIENTS = [
  'ingredient.hotdog-bun',
  'ingredient.sausage',
  'ingredient.hotdog-cheese',
  'ingredient.pickle',
  'ingredient.mustard',
] as const;

export const HOTDOG_GLOW_BUILD_INGREDIENTS = [
  ...HOTDOG_BUILD_INGREDIENTS,
  'ingredient.glow-sauce',
] as const;

const BURGER_TOOLS = [
  { ingredientId: 'ingredient.bun-bottom', mode: 'ingredient' },
  { ingredientId: 'ingredient.patty', mode: 'ingredient' },
  { ingredientId: 'ingredient.cheese', mode: 'ingredient' },
  { ingredientId: 'ingredient.sauce', mode: 'sauce' },
  { ingredientId: 'ingredient.extra-spicy', mode: 'ingredient' },
  { ingredientId: 'ingredient.bun-top', mode: 'ingredient' },
] as const;

const HOTDOG_TOOLS = [
  { ingredientId: 'ingredient.hotdog-bun', mode: 'ingredient' },
  { ingredientId: 'ingredient.sausage', mode: 'ingredient' },
  { ingredientId: 'ingredient.hotdog-cheese', mode: 'ingredient' },
  { ingredientId: 'ingredient.pickle', mode: 'ingredient' },
  { ingredientId: 'ingredient.mustard', mode: 'sauce' },
  { ingredientId: 'ingredient.glow-sauce', mode: 'sauce' },
] as const;

type BuildTool = (typeof BURGER_TOOLS)[number] | (typeof HOTDOG_TOOLS)[number];

export async function readSnapshot(page: Page): Promise<BrowserSnapshot | null> {
  return page.evaluate(() => (window as unknown as TestWindow).SNACK_LAB?.getSnapshot() ?? null);
}

export async function snapshot(page: Page): Promise<BrowserSnapshot> {
  const current = await readSnapshot(page);
  if (!current) throw new Error('The development diagnostics bridge is not ready.');
  return current;
}

export async function waitForSnapshot(
  page: Page,
  expected: Partial<BrowserSnapshot>,
  timeout = 12_000,
): Promise<BrowserSnapshot> {
  let current: BrowserSnapshot | null = null;
  await expect.poll(async () => {
    current = await readSnapshot(page);
    return current;
  }, { timeout, intervals: [50, 100, 250] }).toMatchObject(expected);
  if (!current) throw new Error('The development diagnostics bridge is not ready.');
  return current;
}

export async function clickAction(page: Page, viewport: ViewportCase): Promise<void> {
  const layout = getLayout(viewport);
  await clickCanvas(page, layout.actionX, layout.actionY);
}

export async function openHandsOnPrep(page: Page, viewport: ViewportCase): Promise<void> {
  await clickAction(page, viewport);
  await waitForSnapshot(page, { orderPhase: 'prep-board' });
}

export async function prepareHandsOnIngredient(page: Page, viewport: ViewportCase): Promise<void> {
  const current = await snapshot(page);
  const ingredientId = current.selectedIngredients[0];
  if (!ingredientId) throw new Error('Hands-on Prep did not stage a cookable ingredient.');

  const portrait = viewport.width < viewport.height;
  const source = {
    x: viewport.width * (portrait ? 0.22 : 0.14),
    y: viewport.height * (portrait ? 0.82 : 0.80),
  };
  const target = {
    x: viewport.width * 0.5,
    y: viewport.height * (portrait ? 0.68 : 0.69),
  };
  await dragCanvas(page, source, target);
  await expect.poll(async () => (await snapshot(page)).preparedIngredients.includes(ingredientId), {
    timeout: 8_000,
    intervals: [50, 100, 250],
  }).toBe(true);
}

export async function continueToHandsOnGrill(page: Page, viewport: ViewportCase): Promise<void> {
  await clickAction(page, viewport);
  await waitForSnapshot(page, { orderPhase: 'grilling' });
}

export async function placeFlipAndCookPerfect(page: Page, viewport: ViewportCase): Promise<void> {
  const geometry = grillGeometry(viewport);
  await dragCanvas(page, geometry.source, geometry.slot);
  await expect.poll(async () => (await snapshot(page)).grillState?.active ?? false, {
    timeout: 8_000,
    intervals: [50, 100, 250],
  }).toBe(true);

  await expect.poll(async () => {
    const grill = (await snapshot(page)).grillState;
    return grill ? grill.elapsedMs >= grill.idealFlipAtMs : false;
  }, { timeout: 10_000, intervals: [25, 50, 100] }).toBe(true);

  await clickCanvas(page, geometry.spatula.x, geometry.spatula.y);
  await clickCanvas(page, geometry.slot.x, geometry.slot.y);
  await expect.poll(async () => (await snapshot(page)).grillState?.flipped ?? false, {
    timeout: 4_000,
    intervals: [25, 50, 100],
  }).toBe(true);

  await expect.poll(async () => {
    const grill = (await snapshot(page)).grillState;
    return Boolean(grill && grill.state === 'perfect' && grill.elapsedMs >= grill.idealFlipAtMs * 2);
  }, { timeout: 10_000, intervals: [25, 50, 100] }).toBe(true);
}

export async function removeHandsOnGrillItem(page: Page, viewport: ViewportCase): Promise<void> {
  const geometry = grillGeometry(viewport);
  await clickCanvas(page, geometry.spatula.x, geometry.spatula.y);
  await clickCanvas(page, geometry.slot.x, geometry.slot.y);
  const state = await waitForSnapshot(page, { orderPhase: 'assembly' }, 8_000);
  expect(state.grillState?.result?.state).toBe('perfect');
}

export async function completeHandsOnBuild(
  page: Page,
  viewport: ViewportCase,
  recipeId: 'recipe.hot-cheese-burger' | 'recipe.cheesy-street-hot-dog',
  ingredientIds: readonly string[],
): Promise<void> {
  await waitForSnapshot(page, { orderPhase: 'assembly' });
  const tools = recipeId === 'recipe.hot-cheese-burger' ? BURGER_TOOLS : HOTDOG_TOOLS;
  const workspace = buildWorkspace(viewport);

  for (const ingredientId of ingredientIds) {
    const index = tools.findIndex((tool) => tool.ingredientId === ingredientId);
    if (index < 0) throw new Error(`No Build tool for ${ingredientId}.`);
    const tool = tools[index] as BuildTool;
    const shelfPoint = buildShelfPoint(viewport, workspace, index, tools.length);
    const before = assemblyCount(await snapshot(page), ingredientId, tool.mode);

    if (tool.mode === 'sauce') {
      await clickCanvas(page, shelfPoint.x, shelfPoint.y);
      const span = sauceTargetSpread(ingredientId);
      const from = {
        x: workspace.x + workspace.width * (0.5 - span / 2),
        y: workspace.y + workspace.height * 0.52,
      };
      const to = {
        x: workspace.x + workspace.width * (0.5 + span / 2),
        y: workspace.y + workspace.height * 0.52,
      };
      await dragCanvas(page, from, to, 12);
    } else {
      await dragCanvas(page, shelfPoint, {
        x: workspace.x + workspace.width * 0.5,
        y: workspace.y + workspace.height * 0.52,
      });
    }

    await expect.poll(async () => assemblyCount(await snapshot(page), ingredientId, tool.mode), {
      message: `Build interaction did not register ${ingredientId}`,
      timeout: 3_000,
      intervals: [50, 100, 250],
    }).toBe(before + 1);
  }

  await expect.poll(async () => (await snapshot(page)).assemblyReady, {
    message: 'Build contains every requested interaction but assemblyReady stayed false',
    timeout: 3_000,
    intervals: [50, 100, 250],
  }).toBe(true);
  await clickAction(page, viewport);
  await waitForSnapshot(page, { orderPhase: 'assembly', assembled: true });
}

export async function completeHandsOnBaseOrder(
  page: Page,
  viewport: ViewportCase,
  recipeId: 'recipe.hot-cheese-burger' | 'recipe.cheesy-street-hot-dog',
  ingredientIds: readonly string[],
): Promise<void> {
  await openHandsOnPrep(page, viewport);
  await prepareHandsOnIngredient(page, viewport);
  await continueToHandsOnGrill(page, viewport);
  await placeFlipAndCookPerfect(page, viewport);
  await removeHandsOnGrillItem(page, viewport);
  await completeHandsOnBuild(page, viewport, recipeId, ingredientIds);
}

export async function clickCanvas(page: Page, x: number, y: number): Promise<void> {
  const bounds = await canvasBounds(page);
  await page.mouse.click(bounds.x + x, bounds.y + y);
}

async function dragCanvas(
  page: Page,
  from: { readonly x: number; readonly y: number },
  to: { readonly x: number; readonly y: number },
  steps = 8,
): Promise<void> {
  const bounds = await canvasBounds(page);
  await page.mouse.move(bounds.x + from.x, bounds.y + from.y);
  await page.mouse.down();
  await page.mouse.move(bounds.x + to.x, bounds.y + to.y, { steps });
  await page.mouse.up();
}

async function canvasBounds(page: Page): Promise<{ x: number; y: number }> {
  const canvas = page.locator('#game-canvas canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('The game canvas is not visible.');
  return { x: bounds.x, y: bounds.y };
}

function assemblyCount(snapshotValue: BrowserSnapshot, ingredientId: string, mode: BuildTool['mode']): number {
  const assembly = snapshotValue.assembly;
  if (!assembly) return 0;
  return mode === 'sauce'
    ? assembly.sauceStrokes.filter((stroke) => stroke.ingredientId === ingredientId).length
    : assembly.placements.filter((placement) => placement.ingredientId === ingredientId).length;
}

function getLayout(viewport: ViewportCase) {
  return finalizeOrderLayout(calculateOrderLayout(viewport.width, viewport.height));
}

function grillGeometry(viewport: ViewportCase) {
  const portrait = viewport.width < viewport.height;
  const centerX = viewport.width * 0.5;
  const centerY = viewport.height * 0.66;
  return {
    source: {
      x: viewport.width * (portrait ? 0.20 : 0.14),
      y: viewport.height * 0.85,
    },
    spatula: {
      x: viewport.width * (portrait ? 0.80 : 0.86),
      y: viewport.height * 0.84,
    },
    slot: {
      x: centerX - viewport.width * (portrait ? 0.17 : 0.14),
      y: centerY - viewport.height * (portrait ? 0.075 : 0.085),
    },
  };
}

interface WorkspaceRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

function buildWorkspace(viewport: ViewportCase): WorkspaceRect {
  const layout = getLayout(viewport);
  const presentation = createStationPresentation(layout, 'build');
  const width = presentation.workspaceWidth * (layout.wide ? 0.62 : 0.78);
  const height = presentation.workspaceHeight * (layout.wide ? 0.56 : 0.48);
  const centerY = presentation.workspaceY - presentation.workspaceHeight * (layout.wide ? 0.06 : 0.10);
  return {
    x: presentation.workspaceX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

function buildShelfPoint(
  viewport: ViewportCase,
  workspace: WorkspaceRect,
  index: number,
  count: number,
): { readonly x: number; readonly y: number } {
  const portrait = viewport.height > viewport.width * 1.1;
  const rows = portrait ? 2 : 1;
  const columns = Math.ceil(count / rows);
  const availableWidth = portrait ? viewport.width * 0.92 : Math.min(viewport.width * 0.74, 760);
  const cellWidth = Math.min(104, availableWidth / columns);
  const slotSize = Math.max(58, Math.min(88, cellWidth * 0.84));
  const rowGap = portrait ? slotSize * 0.9 : 0;
  const startX = viewport.width / 2 - ((columns - 1) * cellWidth) / 2;
  const bottomRowOffset = (rows - 1) * rowGap;
  const baseY = portrait
    ? Math.min(
        viewport.height - slotSize * 0.72 - bottomRowOffset,
        workspace.y + workspace.height + slotSize * 0.66,
      )
    : Math.min(viewport.height - slotSize * 0.66, workspace.y + workspace.height + slotSize * 0.62);
  const row = Math.floor(index / columns);
  const column = index % columns;
  return {
    x: startX + column * cellWidth,
    y: baseY + row * rowGap,
  };
}

function sauceTargetSpread(ingredientId: string): number {
  switch (ingredientId) {
    case 'ingredient.sauce': return 0.48;
    case 'ingredient.mustard':
    case 'ingredient.glow-sauce': return 0.56;
    default: throw new Error(`${ingredientId} is not an authored sauce tool.`);
  }
}
