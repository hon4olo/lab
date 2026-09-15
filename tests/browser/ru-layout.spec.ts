import { expect, test } from '@playwright/test';

test.use({ locale: 'ru-RU', contextOptions: { reducedMotion: 'reduce' } });

interface TestWindow {
  SNACK_LAB?: { getSnapshot(): { readonly orderPhase: string | null; readonly documentLanguage: string | null } };
}

test('Russian 360×640 boot keeps the first order inside the mobile layout', async ({ page }) => {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const badResponses: string[] = [];

  await page.setViewportSize({ width: 360, height: 640 });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => failedRequests.push(request.url()));
  page.on('response', (response) => {
    if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('#app')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('#game-canvas canvas')).toHaveCount(1);
  await expect.poll(async () => (await readSnapshot(page))?.orderPhase ?? null).toBe('ingredient-selection');
  expect(await page.locator('html').getAttribute('lang')).toBe('ru');
  expect((await readSnapshot(page))?.documentLanguage).toBe('ru');

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
  expect(dimensions.appWidth).toBe(360);
  expect(dimensions.appHeight).toBe(640);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  expect(badResponses).toEqual([]);
});

async function readSnapshot(page: import('@playwright/test').Page): Promise<{
  readonly orderPhase: string | null;
  readonly documentLanguage: string | null;
} | null> {
  return page.evaluate(() => (window as unknown as TestWindow).SNACK_LAB?.getSnapshot() ?? null);
}
