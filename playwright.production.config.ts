import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: 'production-smoke.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: './node_modules/.cache/playwright-production-results',
  reporter: 'list',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    browserName: 'chromium',
    headless: true,
    baseURL: 'http://127.0.0.1:4174',
    locale: 'en-US',
    colorScheme: 'dark',
    contextOptions: { reducedMotion: 'reduce' },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4174',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
