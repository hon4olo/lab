import { expect, test, type Page } from '@playwright/test';
import { getProductionAssets } from '../../src/assets/assetManifest';
import { resolveShiftAssetBundle } from '../../src/assets/AssetBundleResolver';
import { createCampaignSession } from '../../src/app/createCampaignSession';
import { FIRST_CHAPTER } from '../../src/content/chapters/firstChapter';
import { SNACK_LAB_CONTENT_REGISTRIES } from '../../src/content/registries';
import { calculateOrderLayout, finalizeOrderLayout } from '../../src/presentation/order/orderLayout';
import { createDefaultSaveData } from '../../src/save/SaveSchema';

interface BrowserSnapshot {
  readonly orderId: string | null;
  readonly orderPhase: string | null;
  readonly shiftPhase: string | null;
  readonly campaignPhase: string | null;
  readonly shiftRunId: string | null;
  readonly scores: { readonly order: number; readonly cook: number; readonly chaos: number } | null;
  readonly payment: { readonly total: number; readonly transactionId: string } | null;
  readonly transformationResult: { readonly id: string } | null;
  readonly selectedIngredients: readonly string[];
  readonly coins: number;
  readonly appliedPaymentIds: readonly string[];
  readonly discoveredTransformationIds: readonly string[];
  readonly grillState: {
    readonly active: boolean;
    readonly elapsedMs: number;
    readonly state: string;
    readonly result: { readonly state: string; readonly quality: number } | null;
  } | null;
  readonly shiftCompleteLabel: string | null;
  readonly documentLanguage: string | null;
}

interface TestWindow {
  SNACK_LAB?: { getSnapshot(): BrowserSnapshot };
}

interface ViewportCase {
  readonly name: string;
  readonly width: number;
  readonly height: number;
}

const VIEWPORTS: readonly ViewportCase[] = [
  { name: 'small portrait', width: 360, height: 640 },
  { name: 'landscape mobile', width: 844, height: 390 },
  { name: '720p desktop', width: 1280, height: 720 },
  { name: 'large desktop', width: 1440, height: 900 },
];

const BURGER_ORDER_ID = 'order.hot-cheese-burger.extra-spicy';
const HOTDOG_ORDER_ID = 'order.cheesy-street-hot-dog';
const FLAMING_ID = 'transformation.business-cat.flaming';
const NEON_ID = 'transformation.picky-pigeon.neon';
const BURGER_INGREDIENTS = [
  'ingredient.bun-bottom',
  'ingredient.patty',
  'ingredient.cheese',
  'ingredient.sauce',
  'ingredient.bun-top',
] as const;
const HOTDOG_INGREDIENTS = [
  'ingredient.hotdog-bun',
  'ingredient.sausage',
  'ingredient.hotdog-cheese',
  'ingredient.pickle',
  'ingredient.mustard',
] as const;

for (const viewport of VIEWPORTS) {
  test(`${viewport.name} ${viewport.width}×${viewport.height}: complete two orders, reload, replay`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    const badResponses: string[] = [];
    const assetRequests = new Map<string, number>();
    let expectedAssetPaths: Promise<readonly string[]> = Promise.resolve([]);

    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'failed'}`);
    });
    page.on('request', (request) => {
      const pathname = new URL(request.url()).pathname;
      if (!pathname.startsWith('/assets/')) return;
      assetRequests.set(pathname, (assetRequests.get(pathname) ?? 0) + 1);
    });
    page.on('response', (response) => {
      if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
      if (new URL(response.url()).pathname === '/assets/manifest.json') {
        expectedAssetPaths = response.json().then((manifest: {
          readonly assets: readonly { readonly path: string; readonly status: string }[];
        }) => expectedFirstShiftAssetPaths(manifest));
      }
    });

    await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
    await waitForSnapshot(page, { orderId: BURGER_ORDER_ID, orderPhase: 'ingredient-selection' });
    await expect(page.locator('#game-canvas canvas')).toHaveCount(1);
    const firstLoadAssetCounts = new Map(assetRequests);
    const expectedAssetRequests = await expectedAssetPaths;
    expect(firstLoadAssetCounts.size).toBe(expectedAssetRequests.length);
    for (const path of expectedAssetRequests) expect(firstLoadAssetCounts.get(path)).toBe(1);
    expect([...firstLoadAssetCounts.values()].every((count) => count === 1)).toBe(true);

    await completeOrder(page, viewport, BURGER_ORDER_ID, BURGER_INGREDIENTS, true);
    await waitForSnapshot(page, { orderId: HOTDOG_ORDER_ID, orderPhase: 'ingredient-selection' }, 30_000);
    const hotdogStart = await snapshot(page);
    expect(hotdogStart.selectedIngredients).toEqual([]);

    await completeOrder(page, viewport, HOTDOG_ORDER_ID, HOTDOG_INGREDIENTS, true);
    await waitForSnapshot(page, {
      orderId: HOTDOG_ORDER_ID,
      orderPhase: 'next-order-ready',
      shiftPhase: 'completed',
      campaignPhase: 'shift-complete',
    }, 30_000);
    const firstResult = await snapshot(page);
    expect(firstResult.scores).toMatchObject({ order: 100, chaos: 100 });
    expect(firstResult.scores?.cook).toBeGreaterThanOrEqual(60);
    expect(firstResult.grillState?.result).toMatchObject({ state: 'perfect' });
    expect(firstResult.payment?.total).toBeGreaterThan(0);
    expect(firstResult.transformationResult?.id).toBe(NEON_ID);
    expect(firstResult.coins).toBeGreaterThan(firstResult.payment?.total ?? 0);
    expect(firstResult.shiftPhase).toBe('completed');
    expect(firstResult.campaignPhase).toBe('shift-complete');
    expect(firstResult.shiftCompleteLabel).toBe('Shift complete');
    expect(firstResult.documentLanguage).toBe('en');
    expect(firstResult.appliedPaymentIds).toHaveLength(2);
    expect(new Set(firstResult.appliedPaymentIds).size).toBe(2);
    expect(firstResult.discoveredTransformationIds).toEqual([FLAMING_ID, NEON_ID]);
    expect(firstResult.shiftRunId).toBeTruthy();

    const originalRunId = firstResult.shiftRunId;
    const originalPaymentIds = firstResult.appliedPaymentIds;
    const originalPaymentTotal = firstResult.coins;
    const originalDiscoveryIds = firstResult.discoveredTransformationIds;
    await expectNoDocumentOverflow(page, viewport);
    await page.reload({ waitUntil: 'networkidle' });
    await waitForSnapshot(page, {
      orderId: HOTDOG_ORDER_ID,
      shiftPhase: 'completed',
      shiftCompleteLabel: 'Shift complete',
    });

    const restored = await snapshot(page);
    expect(restored.coins).toBe(originalPaymentTotal);
    expect(restored.campaignPhase).toBe('shift-complete');
    expect(restored.shiftCompleteLabel).toBe('Shift complete');
    expect(restored.appliedPaymentIds).toEqual(originalPaymentIds);
    expect(restored.discoveredTransformationIds).toEqual(originalDiscoveryIds);
    expect(restored.shiftRunId).toBe(originalRunId);
    expect([...assetRequests.values()].every((count) => count <= 2)).toBe(true);
    const afterReloadAssetCounts = new Map(assetRequests);

    await clickAction(page, viewport);
    await waitForSnapshot(page, {
      orderId: BURGER_ORDER_ID,
      campaignPhase: 'shift-in-progress',
      orderPhase: 'ingredient-selection',
    }, 30_000);
    const replayStart = await snapshot(page);
    expect(replayStart.shiftRunId).toBeTruthy();
    expect(replayStart.shiftRunId).not.toBe(originalRunId);
    await completeOrder(page, viewport, BURGER_ORDER_ID, BURGER_INGREDIENTS, true);
    await waitForSnapshot(page, { orderId: HOTDOG_ORDER_ID, orderPhase: 'ingredient-selection' }, 30_000);
    await completeOrder(page, viewport, HOTDOG_ORDER_ID, HOTDOG_INGREDIENTS, false);

    const replayResult = await waitForSnapshot(page, {
      orderId: HOTDOG_ORDER_ID,
      orderPhase: 'next-order-ready',
      shiftPhase: 'completed',
      campaignPhase: 'shift-complete',
    }, 30_000);
    expect(replayResult.scores).toMatchObject({ order: 100, chaos: 0 });
    expect(replayResult.scores?.cook).toBeGreaterThanOrEqual(60);
    expect(replayResult.grillState?.result).toMatchObject({ state: 'perfect' });
    expect(replayResult.payment?.total).toBeGreaterThan(0);
    expect(replayResult.transformationResult).toBeNull();
    expect(replayResult.coins).toBeGreaterThan(originalPaymentTotal);
    expect(replayResult.shiftPhase).toBe('completed');
    expect(replayResult.campaignPhase).toBe('shift-complete');
    expect(replayResult.shiftCompleteLabel).toBe('Shift complete');
    expect(replayResult.appliedPaymentIds).toHaveLength(4);
    expect(new Set(replayResult.appliedPaymentIds).size).toBe(4);
    expect(replayResult.discoveredTransformationIds).toEqual(originalDiscoveryIds);
    expect([...assetRequests]).toEqual([...afterReloadAssetCounts]);

    await expectNoDocumentOverflow(page, viewport);
    expect(pageErrors, `uncaught page errors at ${viewport.width}×${viewport.height}`).toEqual([]);
    expect(consoleErrors, `console errors at ${viewport.width}×${viewport.height}`).toEqual([]);
    expect(failedRequests, `failed requests at ${viewport.width}×${viewport.height}`).toEqual([]);
    expect(badResponses, `HTTP errors at ${viewport.width}×${viewport.height}`).toEqual([]);
  });
}

function expectedFirstShiftAssetPaths(manifest: unknown): readonly string[] {
  const campaign = createCampaignSession(createDefaultSaveData(FIRST_CHAPTER.id));
  campaign.startOrRestore();
  const bundle = resolveShiftAssetBundle(getProductionAssets(manifest), {
    getOrderContent: (id) => campaign.getOrderContent(id),
    getCustomerDefinition: (id) => campaign.getCustomerDefinition(id),
    transformations: SNACK_LAB_CONTENT_REGISTRIES.transformations.all,
  }, campaign.getLoadingShiftDefinition());
  return [...bundle.assets.map((asset) => `/${asset.path}`), '/assets/manifest.json'];
}

async function completeOrder(
  page: Page,
  viewport: ViewportCase,
  orderId: string,
  ingredientIds: readonly string[],
  withModifier: boolean,
): Promise<void> {
  await waitForSnapshot(page, { orderId, orderPhase: 'ingredient-selection' }, 30_000);
  for (let index = 0; index < ingredientIds.length; index += 1) {
    await clickIngredient(page, viewport, index, ingredientIds.length);
    await expect.poll(async () => selectedIngredients(page)).toEqual(ingredientIds.slice(0, index + 1));
  }

  await clickAction(page, viewport);
  await waitForSnapshot(page, { orderId, orderPhase: 'prep-board' });
  await clickAction(page, viewport);
  await clickAction(page, viewport);
  await waitForSnapshot(page, { orderId, orderPhase: 'grilling' });
  await clickAction(page, viewport);
  await stopGrillWhilePerfect(page, viewport);
  await waitForSnapshot(page, { orderId, orderPhase: 'assembly' });
  await clickAction(page, viewport);
  await waitForSnapshot(page, { orderId, orderPhase: 'modifier-selection' });
  if (withModifier) {
    await clickModifier(page, viewport);
    await waitForSnapshot(page, { orderId, orderPhase: 'modifier-selection' });
  }
  await clickAction(page, viewport);
  await waitForSnapshot(page, { orderId, orderPhase: 'anticipation' });
}

async function clickIngredient(page: Page, viewport: ViewportCase, index: number, count: number): Promise<void> {
  const point = ingredientPoint(viewport, index, count);
  await clickCanvas(page, point.x, point.y);
}

async function clickModifier(page: Page, viewport: ViewportCase): Promise<void> {
  const layout = getLayout(viewport);
  const point = layout.wide
    ? { x: layout.width * 0.34, y: layout.tileCenters[0]?.y ?? layout.height - 80 }
    : { x: layout.width / 2, y: layout.tileCenters[4]?.y ?? layout.height - 120 };
  await clickCanvas(page, point.x, point.y);
}

async function clickAction(page: Page, viewport: ViewportCase): Promise<void> {
  const layout = getLayout(viewport);
  await clickCanvas(page, layout.actionX, layout.actionY);
}

async function stopGrillWhilePerfect(page: Page, viewport: ViewportCase): Promise<void> {
  const layout = getLayout(viewport);
  await expect.poll(async () => (await readSnapshot(page))?.grillState)
    .toMatchObject({ active: true });
  await expect.poll(
    async () => (await readSnapshot(page))?.grillState?.state ?? 'raw',
    { timeout: 15_000, intervals: [50, 100, 250] },
  ).toBe('perfect');
  await clickCanvas(page, layout.actionX, layout.actionY);
}

function ingredientPoint(
  viewport: ViewportCase,
  index: number,
  count: number,
): { readonly x: number; readonly y: number } {
  const layout = getLayout(viewport);
  if (layout.wide) {
    const spacing = Math.min(layout.width * 0.105, 96);
    return {
      x: layout.width * 0.34 + (index - (count - 1) / 2) * spacing,
      y: layout.tileCenters[0]?.y ?? layout.height - 80,
    };
  }
  const firstRowCount = Math.min(3, count);
  const inFirstRow = index < firstRowCount;
  const rowIndex = inFirstRow ? index : index - firstRowCount;
  const rowCount = inFirstRow ? firstRowCount : count - firstRowCount;
  return {
    x: layout.width / 2 + (rowIndex - (rowCount - 1) / 2) * layout.width * 0.26,
    y: layout.tileCenters[inFirstRow ? 0 : 3]?.y ?? layout.height - 120,
  };
}

function getLayout(viewport: ViewportCase) {
  return finalizeOrderLayout(calculateOrderLayout(viewport.width, viewport.height));
}

async function clickCanvas(page: Page, x: number, y: number): Promise<void> {
  const canvas = page.locator('#game-canvas canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('The game canvas is not visible.');
  await page.mouse.click(bounds.x + x, bounds.y + y);
}

async function waitForSnapshot(
  page: Page,
  expected: Partial<BrowserSnapshot>,
  timeout = 8_000,
): Promise<BrowserSnapshot> {
  let current: BrowserSnapshot | null = null;
  await expect.poll(async () => {
    current = await readSnapshot(page);
    return current;
  }, { timeout }).toMatchObject(expected);
  if (!current) throw new Error('The development diagnostics bridge is not ready.');
  return current;
}

async function snapshot(page: Page): Promise<BrowserSnapshot> {
  const current = await readSnapshot(page);
  if (!current) throw new Error('The development diagnostics bridge is not ready.');
  return current;
}

async function readSnapshot(page: Page): Promise<BrowserSnapshot | null> {
  return page.evaluate(() => (window as unknown as TestWindow).SNACK_LAB?.getSnapshot() ?? null);
}

async function selectedIngredients(page: Page): Promise<readonly string[]> {
  return page.evaluate(() => (window as unknown as TestWindow).SNACK_LAB?.getSnapshot().selectedIngredients ?? []);
}

async function expectNoDocumentOverflow(page: Page, viewport: ViewportCase): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    viewportWidth: document.documentElement.clientWidth,
    viewportHeight: document.documentElement.clientHeight,
    appWidth: document.querySelector('#app')?.clientWidth ?? 0,
    appHeight: document.querySelector('#app')?.clientHeight ?? 0,
  }));
  expect(dimensions.documentWidth, `document width overflow at ${viewport.width}×${viewport.height}`)
    .toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.documentHeight, `document height overflow at ${viewport.width}×${viewport.height}`)
    .toBeLessThanOrEqual(dimensions.viewportHeight);
  expect(dimensions.appWidth).toBe(viewport.width);
  expect(dimensions.appHeight).toBe(viewport.height);
}
