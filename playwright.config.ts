import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  testMatch: [
    'first-session.spec.ts',
    'asset-batch-02.spec.ts',
    'normal-motion.spec.ts',
    'ru-layout.spec.ts',
    'visual-capture.spec.ts',
  ],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  outputDir: './node_modules/.cache/playwright-test-results',
  reporter: 'list',
  timeout: 90_000,
  expect: { timeout: 12_000 },
  use: {
    browserName: 'chromium',
    headless: true,
    baseURL: 'http://127.0.0.1:4173',
    locale: 'en-US',
    colorScheme: 'dark',
    contextOptions: { reducedMotion: 'reduce' },
    actionTimeout: 8_000,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
