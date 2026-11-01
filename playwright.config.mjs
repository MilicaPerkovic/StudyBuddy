// Konfiguracija Playwright za avtomatizirane funkcionalne (E2E) teste StudyBuddy.
import { defineConfig, devices } from '@playwright/test';
import { E2E_DB_FILE, E2E_PORT } from './e2e/support/env.js';

export default defineConfig({
  testDir: './e2e',
  // Vsi testi uporabljajo isto testno bazo, zato tečejo zaporedno.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: `http://localhost:${E2E_PORT}`,
    locale: 'sl-SI',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Zgradi vmesnik in zažene strežnik, ki servira API in zgrajeni vmesnik nad ločeno testno bazo.
    command: 'npm start',
    url: `http://localhost:${E2E_PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { PORT: String(E2E_PORT), DB_FILE: E2E_DB_FILE },
  },
});
