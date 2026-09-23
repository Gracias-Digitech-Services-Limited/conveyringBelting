import { test as setup, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.CMS_TEST_ADMIN_EMAIL || 'swarupsharma4544@gmail.com'
const ADMIN_PASSWORD = process.env.CMS_TEST_ADMIN_PASSWORD || 'LocalDevAdmin!2026'
const authFile = 'playwright/.auth/admin.json'

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/admin/login')
  await page.getByLabel('Email').fill(ADMIN_EMAIL)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: /login/i }).click()
  await expect(page).toHaveURL(/\/admin(\/)?$/, { timeout: 10_000 })
  await expect(page.getByRole('heading', { name: 'Collections' })).toBeVisible()
  await page.context().storageState({ path: authFile })
})
