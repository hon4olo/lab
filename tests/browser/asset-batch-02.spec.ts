import { expect, test } from '@playwright/test';

interface AssetQaWindow {
  SNACK_LAB?: { previewAssets(): Promise<void> };
}

test('development asset QA loads every approved Batch 01+02 asset', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const badResponses: string[] = [];

  await page.setViewportSize({ width: 1440, height: 900 });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => failedRequests.push(request.url()));
  page.on('response', (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
  await expect.poll(() => page.locator('html').getAttribute('data-snack-lab-debug')).toBe('ready');
  const manifest = await page.evaluate(async () => {
    const response = await fetch('/assets/manifest.json');
    return response.json() as Promise<{ assets: readonly { status: string }[] }>;
  });
  expect(manifest.assets).toHaveLength(62);
  expect(manifest.assets.every((asset) => asset.status === 'production-approved')).toBe(true);

  await page.evaluate(() => (window as unknown as AssetQaWindow).SNACK_LAB?.previewAssets());
  await expect.poll(
    () => page.locator('html').getAttribute('data-snack-lab-asset-qa-status'),
    { timeout: 30_000 },
  ).toBe('passed');
  expect(await page.locator('html').getAttribute('data-snack-lab-asset-qa-failed')).toBe('');
  expect(await page.locator('html').getAttribute('data-snack-lab-asset-preview')).toBe('active');
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  expect(badResponses).toEqual([]);
});
