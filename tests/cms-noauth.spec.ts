import { test, expect } from '@playwright/test'

/** Runs with a fresh, unauthenticated browser context (no storageState). */

test.describe('TC-07 Unauthenticated access', () => {
  test('visiting a collection redirects to the login screen', async ({ page }) => {
    await page.goto('/admin/collections/pages')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})

test.describe('TC-08 Login validation', () => {
  test('rejects an invalid password and stays on the login screen', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill('swarupsharma4544@gmail.com')
    await page.getByLabel('Password').fill('definitely-the-wrong-password')
    await page.getByRole('button', { name: /login/i }).click()

    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.getByText(/email or password provided is incorrect/i)).toBeVisible({
      timeout: 10_000,
    })
  })
})
