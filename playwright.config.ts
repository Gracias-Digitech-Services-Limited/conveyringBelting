import { defineConfig, devices } from '@playwright/test'

// Defaults to the local dev server; set PW_BASE_URL to test a production build (`next start`).
const baseURL = process.env.PW_BASE_URL ?? 'http://localhost:3000'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'cms',
      testMatch: /cms\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/admin.json' },
      dependencies: ['setup'],
    },
    {
      name: 'cms-admin',
      testMatch: /cms-admin\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/admin.json' },
      dependencies: ['setup'],
    },
    {
      name: 'cms-noauth',
      testMatch: /cms-noauth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'frontend',
      testMatch: /frontend\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'frontend-all-pages',
      testMatch: /frontend-all-pages\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // The dev server is already running locally (npm run dev on :3000) - reuse it instead of
  // spawning a second instance, but fail fast if nothing is listening.
  webServer: {
    command: 'echo "expects npm run dev already running on :3000"',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 5_000,
  },
})
