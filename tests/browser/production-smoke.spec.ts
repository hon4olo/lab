import { expect, test } from '@playwright/test';

interface ManifestAsset {
  readonly path: string;
  readonly status: string;
}

interface ProductionManifest {
  readonly assets: readonly ManifestAsset[];
}

const PRODUCTION_VIEWPORTS = [
  { name: 'mobile', width: 360, height: 640 },
  { name: 'desktop', width: 1440, height: 900 },
] as const;

for (const viewport of PRODUCTION_VIEWPORTS) {
  test(`production ${viewport.name} boot and asset smoke ${viewport.width}×${viewport.height}`, async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    const badResponses: string[] = [];
    const assetRequests = new Map<string, number>();
    let manifestPayload: Promise<ProductionManifest> | null = null;

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
      if (pathname !== '/assets/manifest.json' && !pathname.endsWith('.png')) return;
      assetRequests.set(pathname, (assetRequests.get(pathname) ?? 0) + 1);
    });
    page.on('response', (response) => {
      if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
      if (new URL(response.url()).pathname === '/assets/manifest.json') {
        manifestPayload = response.json() as Promise<ProductionManifest>;
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#game-canvas canvas')).toHaveCount(1);
    const manifest = await expectManifest(manifestPayload);
    const expectedPaths = new Set([
      '/assets/manifest.json',
      ...manifest.assets
        .filter((asset) => asset.status === 'production-approved')
        .map((asset) => `/${asset.path}`),
    ]);

    expect(expectedPaths.size).toBeGreaterThan(0);
    expect(assetRequests.has('/assets/manifest.json')).toBe(true);
    const unexpectedPaths = [...assetRequests.keys()].filter((path) => !expectedPaths.has(path));
    expect(unexpectedPaths).toEqual([]);
    expect(assetRequests.size).toBeGreaterThan(1);
    for (const path of assetRequests.keys()) expect(assetRequests.get(path)).toBe(1);
    expect([...assetRequests.values()].every((count) => count === 1)).toBe(true);

    expect(await page.evaluate(() => 'SNACK_LAB' in window)).toBe(false);
    await expect(page.locator('html')).not.toHaveAttribute('data-snack-lab-debug');
    await expect(page.locator('[data-snack-lab-qa-control]')).toHaveCount(0);
    await expectNoDocumentOverflow(page, viewport.width, viewport.height);
    expect(pageErrors, `uncaught page errors at ${viewport.width}×${viewport.height}`).toEqual([]);
    expect(consoleErrors, `console errors at ${viewport.width}×${viewport.height}`).toEqual([]);
    expect(failedRequests, `failed requests at ${viewport.width}×${viewport.height}`).toEqual([]);
    expect(badResponses, `HTTP errors at ${viewport.width}×${viewport.height}`).toEqual([]);
  });
}

async function expectManifest(payload: Promise<ProductionManifest> | null): Promise<ProductionManifest> {
  if (!payload) throw new Error('The production asset manifest was not requested.');
  const manifest = await payload;
  expect(Array.isArray(manifest.assets)).toBe(true);
  return manifest;
}

async function expectNoDocumentOverflow(page: import('@playwright/test').Page, width: number, height: number): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    documentHeight: document.documentElement.scrollHeight,
    viewportWidth: document.documentElement.clientWidth,
    viewportHeight: document.documentElement.clientHeight,
    appWidth: document.querySelector('#app')?.clientWidth ?? 0,
    appHeight: document.querySelector('#app')?.clientHeight ?? 0,
  }));
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
  expect(dimensions.documentHeight).toBeLessThanOrEqual(dimensions.viewportHeight);
  expect(dimensions.appWidth).toBe(width);
  expect(dimensions.appHeight).toBe(height);
}
