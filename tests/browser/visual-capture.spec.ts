import { expect, test, type Page } from '@playwright/test';
import { calculateOrderLayout, finalizeOrderLayout } from '../../src/presentation/order/orderLayout';

interface BrowserSnapshot {
  readonly orderId: string | null;
  readonly orderPhase: string | null;
  readonly grillState: {
    readonly active: boolean;
    readonly state: string;
  } | null;
}

interface TestWindow {
  SNACK_LAB?: { getSnapshot(): BrowserSnapshot };
}

interface ViewportCase {
  readonly name: string;
  readonly width: number;
  readonly height: number;
}

const BURGER_ORDER_ID = 'order.hot-cheese-burger.extra-spicy';
const BURGER_INGREDIENTS = [
  'ingredient.bun-bottom',
  'ingredient.patty',
  'ingredient.cheese',
  'ingredient.sauce',
  'ingredient.bun-top',
] as const;

const VIEWPORTS: readonly ViewportCase[] = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'portrait', width: 360, height: 640 },
];

for (const viewport of VIEWPORTS) {
  test(`visual QA capture: ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForPhase(page, 'ingredient-selection');
    await capture(page, viewport, '01-order');

    for (let index = 0; index < BURGER_INGREDIENTS.length; index += 1) {
      await clickIngredient(page, viewport, index, BURGER_INGREDIENTS.length);
    }
    await clickAction(page, viewport);
    await waitForPhase(page, 'prep-board');
    await capture(page, viewport, '02-prep');

    await clickAction(page, viewport);
    await clickAction(page, viewport);
    await waitForPhase(page, 'grilling');
    await capture(page, viewport, '03-grill-idle');

    await clickAction(page, viewport);
    await expect.poll(async () => (await readSnapshot(page))?.grillState?.state ?? 'raw', {
      timeout: 15_000,
      intervals: [50, 100, 250],
    }).toBe('perfect');
    await capture(page, viewport, '04-grill-perfect');
    await clickAction(page, viewport);

    await waitForPhase(page, 'assembly');
    await capture(page, viewport, '05-build-before-assembly');
    await clickAction(page, viewport);
    await waitForPhase(page, 'modifier-selection');
    await capture(page, viewport, '06-build-modifier');

    await clickModifier(page, viewport);
    await clickAction(page, viewport);
    await waitForPhase(page, 'anticipation');
    await capture(page, viewport, '07-serve');

    await expect.poll(async () => (await readSnapshot(page))?.orderPhase ?? null, {
      timeout: 8_000,
      intervals: [100, 250],
    }).not.toBe('anticipation');
    await capture(page, viewport, '08-reaction');
  });
}

async function capture(page: Page, viewport: ViewportCase, stage: string): Promise<void> {
  await page.screenshot({
    path: `artifacts/visual-qa/${viewport.name}-${viewport.width}x${viewport.height}-${stage}.png`,
    fullPage: true,
  });
}

async function waitForPhase(page: Page, phase: string): Promise<void> {
  await expect.poll(async () => (await readSnapshot(page))?.orderPhase ?? null, {
    timeout: 12_000,
    intervals: [50, 100, 250],
  }).toBe(phase);
}

async function readSnapshot(page: Page): Promise<BrowserSnapshot | null> {
  return page.evaluate(() => (window as unknown as TestWindow).SNACK_LAB?.getSnapshot() ?? null);
}

async function clickIngredient(page: Page, viewport: ViewportCase, index: number, count: number): Promise<void> {
  const layout = getLayout(viewport);
  const point = layout.wide
    ? {
        x: layout.width * 0.34 + (index - (count - 1) / 2) * Math.min(layout.width * 0.105, 96),
        y: layout.tileCenters[0]?.y ?? layout.height - 80,
      }
    : (() => {
        const firstRowCount = Math.min(3, count);
        const inFirstRow = index < firstRowCount;
        const rowIndex = inFirstRow ? index : index - firstRowCount;
        const rowCount = inFirstRow ? firstRowCount : count - firstRowCount;
        return {
          x: layout.width / 2 + (rowIndex - (rowCount - 1) / 2) * layout.width * 0.26,
          y: layout.tileCenters[inFirstRow ? 0 : 3]?.y ?? layout.height - 120,
        };
      })();
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

async function clickCanvas(page: Page, x: number, y: number): Promise<void> {
  const canvas = page.locator('#game-canvas canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('The game canvas is not visible.');
  await page.mouse.click(bounds.x + x, bounds.y + y);
}

function getLayout(viewport: ViewportCase) {
  return finalizeOrderLayout(calculateOrderLayout(viewport.width, viewport.height));
}
