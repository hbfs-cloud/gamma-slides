import { defineConfig } from '@playwright/test';
import { findBrowserExecutable } from './src/browser.js';

export default defineConfig({
  testDir: './qa',
  outputDir: 'output/playwright-results',
  timeout: 45_000,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'output/immersive-qa/playwright.json' }]],
  use: {
    browserName: 'chromium',
    launchOptions: { executablePath: findBrowserExecutable() },
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});
