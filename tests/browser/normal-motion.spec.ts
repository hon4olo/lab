import { expect, test } from '@playwright/test';
import {
  BURGER_BUILD_INGREDIENTS,
  clickAction,
  completeHandsOnBaseOrder,
  snapshot,
  waitForSnapshot,
  type ViewportCase,
} from './hands-on-helpers';

test.use({ contextOptions: { reducedMotion: 'no-preference' } });

const ORDER_ID = 'order.hot-cheese-burger.extra-spicy';

test('normal motion completes Business Cat reaction and customer exit callbacks', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const viewport: ViewportCase = { width: 1280, height: 720 };

  await page.setViewportSize(viewport);
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => failedRequests.push(request.url()));

  await page.goto('/', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
  await waitForSnapshot(page, { orderId: ORDER_ID, orderPhase: 'ingredient-selection' });

  await completeHandsOnBaseOrder(
    page,
    viewport,
    'recipe.hot-cheese-burger',
    BURGER_BUILD_INGREDIENTS,
  );
  await clickAction(page, viewport);
  await waitForSnapshot(page, { orderId: ORDER_ID, orderPhase: 'anticipation' });

  await waitForSnapshot(page, { orderId: ORDER_ID, orderPhase: 'payment' }, 12_000);
  const payment = await snapshot(page);
  expect(payment.transformationResult?.id).toBe('transformation.business-cat.flaming');

  // A second authored order causes the exit callback to create its entering view;
  // a one-order shift settles at next-order-ready instead.
  await expect.poll(async () => {
    const state = await snapshot(page);
    return state.orderPhase === 'next-order-ready' || state.orderId !== ORDER_ID;
  }, { timeout: 8_000 }).toBe(true);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
