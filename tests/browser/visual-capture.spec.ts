import { expect, test, type Page } from '@playwright/test';
import {
  BURGER_BUILD_INGREDIENTS,
  clickAction,
  completeHandsOnBuild,
  continueToHandsOnGrill,
  openHandsOnPrep,
  placeFlipAndCookPerfect,
  prepareHandsOnIngredient,
  removeHandsOnGrillItem,
  waitForSnapshot,
  type ViewportCase,
} from './hands-on-helpers';

// Leave the authored anticipation/reaction windows open long enough to capture
// the distinct Serve and Reaction compositions. Reduced-motion behavior is
// covered by the browser smoke/interaction suites.
test.use({ contextOptions: { reducedMotion: 'no-preference' } });

const VIEWPORTS: readonly ViewportCase[] = [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'portrait', width: 360, height: 640 },
  { name: 'landscape', width: 844, height: 390 },
  { name: 'large-desktop', width: 1440, height: 900 },
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
    await capture(page, viewport, '03-grill-raw');

    // The normal-motion large desktop capture has a longer browser input
    // round-trip while the 1440px canvas is being encoded. Give only that
    // capture a wider timing lead; production interaction tests keep the
    // tighter authored timing window.
    await placeFlipAndCookPerfect(page, viewport, viewport.width >= 1400 ? 900 : undefined);
    await capture(page, viewport, '04-grill-perfect');
    await removeHandsOnGrillItem(page, viewport);

    // Let the grill-state steam settle before evaluating the empty assembly
    // surface; the station snapshot should show the Build work area itself,
    // not the tail of the preceding feedback tween.
    await page.waitForTimeout(750);
    await capture(page, viewport, '05-build-empty');
    await completeHandsOnBuild(
      page,
      viewport,
      'recipe.hot-cheese-burger',
      BURGER_BUILD_INGREDIENTS,
    );
    await capture(page, viewport, '06-build-complete');

    // Freeze the scene around the Serve click. Phaser's reduced/normal-motion
    // timers can otherwise advance through anticipation while a high-resolution
    // screenshot is being encoded, producing an empty or already-reacted frame.
    await page.clock.install();
    await page.clock.pauseAt(Date.now() + 1_000);
    await clickAction(page, viewport);
    // One render tick commits the synchronous serve transition while the
    // delayed reaction timer remains frozen.
    await page.clock.runFor(16);
    await capture(page, viewport, '07-serve');
    await page.clock.resume();
    await waitForSnapshot(page, { orderPhase: 'anticipation' });

    await waitForSnapshot(page, { orderPhase: 'payment' }, 8_000);
    // Capture the authored hero after the transformation impact FX has
    // cleared enough to inspect character identity and scale.
    await page.waitForTimeout(700);
    await capture(page, viewport, '08-reaction');
  });
}

async function capture(page: Page, viewport: ViewportCase, stage: string): Promise<void> {
  await expectNoDocumentOverflow(page, viewport);
  await expectCanvasFillsViewport(page, viewport);
  // Development screenshots should show the authored game composition rather
  // than the optional Asset QA launcher. Production smoke separately verifies
  // that this control is absent from the built app.
  await page.locator('[data-snack-lab-qa-control]').evaluate((element) => {
    element.setAttribute('hidden', 'true');
  }).catch(() => undefined);
  await page.screenshot({
    path: `artifacts/visual-qa/${viewport.name}-${viewport.width}x${viewport.height}-${stage}.png`,
    fullPage: true,
  });
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

async function expectCanvasFillsViewport(page: Page, viewport: ViewportCase): Promise<void> {
  const bounds = await page.locator('#game-canvas canvas').boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.width).toBe(viewport.width);
  expect(bounds?.height).toBe(viewport.height);
}
