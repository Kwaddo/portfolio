import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4321 --ignore-lock',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: false,
    timeout: 180_000,
  },
  use: { baseURL: 'http://127.0.0.1:4321' },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 740 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /layout\.spec\.ts/ },
    { name: 'webkit-phone', use: { ...devices['iPhone 14'] }, testMatch: /layout\.spec\.ts/ },
    { name: 'tablet', use: { ...devices['iPad Mini'] }, testMatch: /layout\.spec\.ts/ },
    { name: 'tablet-landscape', use: { ...devices['iPad Mini landscape'] }, testMatch: /layout\.spec\.ts/ },
  ],
});
