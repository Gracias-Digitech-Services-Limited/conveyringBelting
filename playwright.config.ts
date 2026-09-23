import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:3000',
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
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 5_000,
  },
})
