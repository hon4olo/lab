import { expect, test } from '@playwright/test';
import { calculateOrderLayout, finalizeOrderLayout } from '../../src/presentation/order/orderLayout';

test.use({ contextOptions: { reducedMotion: 'no-preference' } });

interface Snapshot {
  readonly orderId: string | null;
  readonly orderPhase: string | null;
  readonly transformationResult: { readonly id: string } | null;
  readonly grillState: { readonly active: boolean; readonly state: string } | null;
}

interface TestWindow {
  SNACK_LAB?: { getSnapshot(): Snapshot };
}

const ORDER_ID = 'order.hot-cheese-burger.extra-spicy';
const INGREDIENTS = [
  'ingredient.bun-bottom',
  'ingredient.patty',
  'ingredient.cheese',
  'ingredient.sauce',
  'ingredient.bun-top',
] as const;

test('normal motion completes Business Cat reaction and customer exit callbacks', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const viewport = { width: 1280, height: 720 };

  await page.setViewportSize(viewport);
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => failedRequests.push(request.url()));

  await page.goto('/', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
  await waitFor(page, (state) => state.orderId === ORDER_ID && state.orderPhase === 'ingredient-selection');
  await completeBusinessCat(page, viewport);

  await waitFor(page, (state) => state.orderPhase === 'payment');
  const payment = await readSnapshot(page);
  expect(payment.transformationResult?.id).toBe('transformation.business-cat.flaming');

  // A second authored order causes the exit callback to create its entering view;
  // a one-order shift settles at next-order-ready instead.
  await expect.poll(async () => {
    const state = await readSnapshot(page);
    return state.orderPhase === 'next-order-ready' || state.orderId !== ORDER_ID;
  }, { timeout: 8_000 }).toBe(true);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

async function completeBusinessCat(
  page: import('@playwright/test').Page,
  viewport: { readonly width: number; readonly height: number },
): Promise<void> {
  const layout = finalizeOrderLayout(calculateOrderLayout(viewport.width, viewport.height));
  for (let index = 0; index < INGREDIENTS.length; index += 1) {
    const spacing = Math.min(layout.width * 0.105, 96);
    await clickCanvas(page, layout.width * 0.34 + (index - 2) * spacing, layout.tileCenters[0]?.y ?? layout.height - 82);
    await expect.poll(async () => (await readSnapshot(page)).orderPhase).toBe('ingredient-selection');
  }

  await clickCanvas(page, layout.actionX, layout.actionY);
  await waitFor(page, (state) => state.orderPhase === 'prep-board');
  await clickCanvas(page, layout.actionX, layout.actionY);
  await clickCanvas(page, layout.actionX, layout.actionY);
  await waitFor(page, (state) => state.orderPhase === 'grilling');
  await clickCanvas(page, layout.actionX, layout.actionY);
  await expect.poll(async () => (await readSnapshot(page)).grillState?.state ?? 'raw', {
    timeout: 15_000,
    intervals: [50, 100, 250],
  }).toBe('perfect');
  await clickCanvas(page, layout.actionX, layout.actionY);
  await waitFor(page, (state) => state.orderPhase === 'assembly');
  await clickCanvas(page, layout.actionX, layout.actionY);
  await waitFor(page, (state) => state.orderPhase === 'modifier-selection');
  await clickCanvas(page, layout.width * 0.34, layout.tileCenters[0]?.y ?? layout.height - 82);
  await expect.poll(async () => (await readSnapshot(page)).orderPhase)
    .toMatch(/^(assembly|modifier-selection)$/);
  await clickCanvas(page, layout.actionX, layout.actionY);
  await waitFor(page, (state) => state.orderPhase === 'anticipation');
}

async function clickCanvas(page: import('@playwright/test').Page, x: number, y: number): Promise<void> {
  const canvas = page.locator('#game-canvas canvas');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('The game canvas is not visible.');
  await page.mouse.click(bounds.x + x, bounds.y + y);
}

async function waitFor(page: import('@playwright/test').Page, predicate: (state: Snapshot) => boolean): Promise<void> {
  await expect.poll(async () => predicate(await readSnapshot(page)), {
    timeout: 12_000,
    intervals: [50, 100, 250],
  }).toBe(true);
}

async function readSnapshot(page: import('@playwright/test').Page): Promise<Snapshot> {
  const snapshot = await page.evaluate(() => (window as unknown as TestWindow).SNACK_LAB?.getSnapshot() ?? null);
  if (!snapshot) throw new Error('The development diagnostics bridge is not ready.');
  return snapshot;
}
