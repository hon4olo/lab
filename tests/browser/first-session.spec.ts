import { expect, test, type Page } from '@playwright/test';
import { getProductionAssets } from '../../src/assets/assetManifest';
import { resolveShiftAssetBundle } from '../../src/assets/AssetBundleResolver';
import { createCampaignSession } from '../../src/app/createCampaignSession';
import { FIRST_CHAPTER } from '../../src/content/chapters/firstChapter';
import { SNACK_LAB_CONTENT_REGISTRIES } from '../../src/content/registries';
import { createDefaultSaveData } from '../../src/save/SaveSchema';
import {
  BURGER_BUILD_INGREDIENTS,
  HOTDOG_BUILD_INGREDIENTS,
  clickAction,
  clickModifier,
  completeHandsOnBaseOrder,
  snapshot,
  waitForSnapshot,
  type ViewportCase,
} from './hands-on-helpers';

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

    await completeOrder(page, viewport, BURGER_ORDER_ID, true);
    await waitForSnapshot(page, { orderId: HOTDOG_ORDER_ID, orderPhase: 'ingredient-selection' }, 30_000);
    const hotdogStart = await snapshot(page);
    expect(hotdogStart.selectedIngredients).toEqual([]);

    await completeOrder(page, viewport, HOTDOG_ORDER_ID, true);
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
    await completeOrder(page, viewport, BURGER_ORDER_ID, true);
    await waitForSnapshot(page, { orderId: HOTDOG_ORDER_ID, orderPhase: 'ingredient-selection' }, 30_000);
    await completeOrder(page, viewport, HOTDOG_ORDER_ID, false);

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
  withModifier: boolean,
): Promise<void> {
  await waitForSnapshot(page, { orderId, orderPhase: 'ingredient-selection' }, 30_000);
  const isBurger = orderId === BURGER_ORDER_ID;
  await completeHandsOnBaseOrder(
    page,
    viewport,
    isBurger ? 'recipe.hot-cheese-burger' : 'recipe.cheesy-street-hot-dog',
    isBurger ? BURGER_BUILD_INGREDIENTS : HOTDOG_BUILD_INGREDIENTS,
  );

  if (withModifier) {
    const modifierId = isBurger ? 'ingredient.extra-spicy' : 'ingredient.glow-sauce';
    await clickModifier(page, viewport);
    await expect.poll(async () => (await snapshot(page)).selectedIngredients.includes(modifierId), {
      timeout: 8_000,
      intervals: [50, 100, 250],
    }).toBe(true);
  }

  await clickAction(page, viewport);
  await waitForSnapshot(page, { orderId, orderPhase: 'anticipation' });
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
