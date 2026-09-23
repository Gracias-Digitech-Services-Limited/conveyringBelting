import { test, expect, type Page } from '@playwright/test'

/**
 * CMS test plan - Payload admin (Products/Industries content, media, pages, staff cards,
 * contact form -> CMS integration). Runs against the locally seeded MongoDB (npm run seed).
 * Auth is handled once in tests/auth.setup.ts and reused via storageState.
 */

/**
 * Playwright's `page.request` (APIRequestContext) doesn't attach an Origin header the way a
 * real page fetch() does, and Payload's session validation rejects authenticated requests
 * without one (403 "You are not allowed to perform this action.") even though the auth cookie
 * itself is present. Public, unauthenticated reads (media/pages/staff-cards - all `read: () =>
 * true`) work fine via `page.request`; only auth-gated reads (contact-submissions) need this.
 */
async function authedFetch(page: Page, url: string, init?: { method?: string }) {
  return page.evaluate(
    async ({ url, init }) => {
      const r = await fetch(url, { ...init, credentials: 'include' })
      const body = await r.text()
      return { status: r.status, ok: r.ok, body }
    },
    { url, init },
  )
}

test.describe('TC-01 Dashboard', () => {
  test('shows all collections and globals after login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Collections' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Globals' })).toBeVisible()
    for (const name of ['Users', 'Pages', 'Media', 'Staff Cards', 'Contact Submissions']) {
      await expect(page.getByRole('link', { name: `Show all ${name}` })).toBeVisible()
    }
    for (const name of ['Site Settings', 'Navigation Menu']) {
      await expect(page.getByRole('link', { name: `Edit ${name}` })).toBeVisible()
    }
  })
})

test.describe('TC-02 Media collection', () => {
  test('list view loads seeded items', async ({ page }) => {
    await page.goto('/admin/collections/media')
    await expect(page.getByRole('heading', { name: 'Media', exact: true })).toBeVisible()
    // 282 items are in the WP export; a handful may have failed to download - just assert the
    // collection is meaningfully populated, not empty or broken.
    const res = await page.request.get('/api/media?limit=1&depth=0')
    expect(res.ok()).toBeTruthy()
    const json = await res.json()
    expect(json.totalDocs).toBeGreaterThan(250)
  })
})

test.describe('TC-03 Pages collection', () => {
  test('list view loads seeded pages', async ({ page }) => {
    await page.goto('/admin/collections/pages')
    await expect(page.getByRole('heading', { name: 'Pages', exact: true })).toBeVisible()
    const res = await page.request.get('/api/pages?limit=1&depth=0')
    const json = await res.json()
    expect(json.totalDocs).toBeGreaterThanOrEqual(79)
  })

  test('flags the 5 pages that had empty WordPress content as needsCopy', async ({ page }) => {
    const res = await page.request.get('/api/pages?where[needsCopy][equals]=true&limit=20&depth=0')
    const json = await res.json()
    const slugs = json.docs.map((d: { slug: string }) => d.slug).sort()
    expect(slugs).toEqual(['blog', 'page-445', 'page-452', 'page-454', 'shop'])
  })
})

test.describe('TC-04 Staff Cards collection', () => {
  test('list view loads all 4 seeded business cards', async ({ page }) => {
    await page.goto('/admin/collections/staff-cards')
    await expect(page.getByRole('heading', { name: 'Staff Cards', exact: true })).toBeVisible()
    const res = await page.request.get('/api/staff-cards?limit=1&depth=0')
    const json = await res.json()
    expect(json.totalDocs).toBe(4)
  })
})

test.describe.serial('TC-05 Page CRUD', () => {
  const title = `Playwright CMS Test Page ${Date.now()}`
  const slug = `playwright-cms-test-${Date.now()}`
  let docUrl: string

  test('creates a new page', async ({ page }) => {
    await page.goto('/admin/collections/pages/create')
    // Payload renders the required-field "*" as a separate element from the label text, so its
    // accessible name isn't a clean "Title *" - match with an anchored regex instead of an
    // exact string (anchored so it doesn't also match "Meta Title").
    await page.getByLabel(/^Title\s*\*?$/).fill(title)
    await page.getByLabel(/^Slug\s*\*?$/).fill(slug)
    await page.getByRole('button', { name: /save draft/i }).click()

    await expect(page).toHaveURL(/\/admin\/collections\/pages\/[a-f0-9]{24}$/, { timeout: 10_000 })
    docUrl = page.url()

    const res = await page.request.get(`/api/pages?where[slug][equals]=${slug}&depth=0`)
    const json = await res.json()
    expect(json.totalDocs).toBe(1)
    expect(json.docs[0].status).toBe('draft')
  })

  test('edits the page and the change persists after reload', async ({ page }) => {
    await page.goto(docUrl)
    const titleField = page.getByLabel(/^Title\s*\*?$/)
    await titleField.fill(`${title} (edited)`)
    await page.getByRole('button', { name: /save draft/i }).click()
    await expect(page.getByText('Last Modified:')).toBeVisible()

    await page.reload()
    await expect(page.getByLabel(/^Title\s*\*?$/)).toHaveValue(`${title} (edited)`)
  })

  test('deletes the page', async ({ page }) => {
    await page.goto(docUrl)
    // The delete action lives behind the doc controls' "..." popup menu (no accessible name,
    // so it's targeted by its Payload-assigned class instead of a role/label).
    await page.locator('button.popup-button--default').click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()

    await expect(page).toHaveURL(/\/admin\/collections\/pages(\?.*)?$/, { timeout: 10_000 })

    const res = await page.request.get(`/api/pages?where[slug][equals]=${slug}&depth=0`)
    const json = await res.json()
    expect(json.totalDocs).toBe(0)
  })
})

test.describe('TC-06 Contact form -> CMS integration', () => {
  test('a public contact form submission creates a Contact Submission the admin can read', async ({
    page,
  }) => {
    const uniqueEmail = `playwright-test-${Date.now()}@example.com`

    await page.goto('/contact-us')
    await page.getByLabel('Your name *').fill('Playwright Test')
    await page.getByLabel('Company name *').fill('Playwright QA Ltd')
    await page.getByLabel('Email *').fill(uniqueEmail)
    await page.getByLabel('Comment or Message').fill('Automated CMS test submission - safe to delete.')
    await page.getByRole('button', { name: /submit/i }).click()

    await expect(page.getByText(/thanks.*message has been sent/i)).toBeVisible({ timeout: 10_000 })

    // Verify it landed in the CMS (read access requires the logged-in admin session).
    const res = await authedFetch(
      page,
      `/api/contact-submissions?where[email][equals]=${encodeURIComponent(uniqueEmail)}&depth=0`,
    )
    expect(res.ok).toBeTruthy()
    const json = JSON.parse(res.body)
    expect(json.totalDocs).toBe(1)
    expect(json.docs[0].company).toBe('Playwright QA Ltd')

    // Clean up the test submission.
    await authedFetch(page, `/api/contact-submissions/${json.docs[0].id}`, { method: 'DELETE' })
  })
})
