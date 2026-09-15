import { expect, test, type Page } from '@playwright/test';
import {
  BURGER_BUILD_INGREDIENTS,
  clickAction,
  clickModifier,
  completeHandsOnBuild,
  continueToHandsOnGrill,
  openHandsOnPrep,
  placeFlipAndCookPerfect,
  prepareHandsOnIngredient,
  readSnapshot,
  removeHandsOnGrillItem,
  snapshot,
  waitForSnapshot,
  type ViewportCase,
} from './hands-on-helpers';

const VIEWPORTS: readonly ViewportCase[] = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'portrait', width: 360, height: 640 },
];

for (const viewport of VIEWPORTS) {
  test(`visual QA capture: ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/', { waitUntil: 'networkidle' });
    await waitForSnapshot(page, { orderPhase: 'ingredient-selection' });
    await capture(page, viewport, '01-order');

    await openHandsOnPrep(page, viewport);
    await capture(page, viewport, '02-prep');

    await prepareHandsOnIngredient(page, viewport);
    await continueToHandsOnGrill(page, viewport);
    await capture(page, viewport, '03-grill-idle');

    await placeFlipAndCookPerfect(page, viewport);
    await capture(page, viewport, '04-grill-perfect');
    await removeHandsOnGrillItem(page, viewport);

    await capture(page, viewport, '05-build-before-assembly');
    await completeHandsOnBuild(
      page,
      viewport,
      'recipe.hot-cheese-burger',
      BURGER_BUILD_INGREDIENTS,
    );
    await capture(page, viewport, '06-build-modifier');

    await clickModifier(page, viewport);
    await expect.poll(async () => (await snapshot(page)).selectedIngredients.includes('ingredient.extra-spicy'), {
      timeout: 8_000,
      intervals: [50, 100, 250],
    }).toBe(true);
    await clickAction(page, viewport);
    await waitForSnapshot(page, { orderPhase: 'anticipation' });
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
