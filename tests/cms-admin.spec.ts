import { test, expect, type Page, type Browser } from '@playwright/test'

/**
 * End-to-end admin workflows: each test drives the admin UI the way the client would, then
 * checks the public website actually reflects the change. Runs as the logged-in admin
 * (storageState from auth.setup.ts) against the local dev server + local MongoDB.
 *
 * Everything a test creates is deleted, and every global it edits (Site Settings, Navigation
 * Menu) is restored to its original value in afterAll - even if the test fails midway.
 */

type ApiResult = { status: number; json: any } // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Authenticated REST call from inside the page, so the browser attaches the auth cookie AND an
 * Origin header - Payload rejects cookie-authenticated requests without one (see cms.spec.ts).
 * The page must already be on the app's origin.
 */
async function api(page: Page, url: string, init?: { method?: string; body?: unknown }): Promise<ApiResult> {
  return page.evaluate(
    async ({ url, init }) => {
      const r = await fetch(url, {
        method: init?.method ?? 'GET',
        credentials: 'include',
        headers: init?.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      })
      const text = await r.text()
      let json = null
      try {
        json = JSON.parse(text)
      } catch {}
      return { status: r.status, json }
    },
    { url, init },
  )
}

/**
 * Opens an admin screen and waits for it to finish loading. Text inputs accept typing as soon
 * as the server HTML arrives, but buttons (tabs, "Add Item") do nothing until React has
 * hydrated - clicking earlier is silently lost.
 */
async function gotoAdmin(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

async function openTab(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).click()
}

async function expectSaved(page: Page) {
  await expect(page.getByText(/(updated|published|saved|created) successfully/i).first()).toBeVisible({
    timeout: 15_000,
  })
}

const RUN = Date.now()
// Contexts made with browser.newContext() don't inherit the config's baseURL.
const BASE_URL = process.env.PW_BASE_URL ?? 'http://localhost:3000'

test.describe('Dashboard shortcuts', () => {
  const shortcuts = [
    { label: 'Edit a page', url: /\/admin\/collections\/pages/, heading: 'Pages' },
    { label: 'Upload an image or PDF', url: /\/admin\/collections\/media\/create/, heading: null },
    { label: 'Read enquiries', url: /\/admin\/collections\/contact-submissions/, heading: 'Enquiries' },
    { label: 'Homepage & contact details', url: /\/admin\/globals\/site-settings/, heading: 'Site Settings' },
  ]
  for (const s of shortcuts) {
    test(`"${s.label}" opens the right screen`, async ({ page }) => {
      await page.goto('/admin')
      await page.getByRole('link', { name: new RegExp(s.label) }).click()
      await expect(page).toHaveURL(s.url)
      if (s.heading) {
        await expect(page.getByRole('heading', { name: s.heading, exact: true })).toBeVisible()
      } else {
        await expect(page.locator('input[type="file"]')).toBeAttached()
      }
    })
  }
})

test.describe.serial('Page lifecycle: draft -> preview -> publish -> draft edit -> unpublish -> delete', () => {
  const slug = `pw-page-${RUN}`
  const title = `PW Lifecycle Page ${RUN}`
  const body = `Belt text written by the Playwright lifecycle test ${RUN}.`
  let editUrl = ''

  test.afterAll(async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      const found = await api(page, `/api/pages?where[slug][equals]=${slug}&depth=0&draft=true`)
      for (const d of found.json?.docs ?? []) await api(page, `/api/pages/${d.id}`, { method: 'DELETE' })
    })
  })

  test('a new page saved as a draft is NOT on the website', async ({ page }) => {
    await gotoAdmin(page, '/admin/collections/pages/create')
    await page.getByLabel(/^Title\s*\*?$/).fill(title)
    await page.getByLabel(/^Page address\s*\*?$/).fill(slug)
    const editor = page.locator('[data-lexical-editor="true"]').first()
    await editor.click()
    await page.keyboard.type(body)

    await page.getByRole('button', { name: /save draft/i }).click()
    await expect(page).toHaveURL(/\/admin\/collections\/pages\/[a-f0-9]{24}$/, { timeout: 15_000 })
    editUrl = page.url()
    await expect(page.locator('.status')).toContainText('Draft')

    const res = await page.goto(`/${slug}`)
    expect(res?.status()).toBe(404)
  })

  test('drafts are also hidden from the public API', async ({ playwright }) => {
    // Explicitly empty session - otherwise the project's admin storageState is inherited.
    const anon = await playwright.request.newContext({
      baseURL: BASE_URL,
      storageState: { cookies: [], origins: [] },
    })
    for (const q of ['', '&draft=true']) {
      const res = await anon.get(`/api/pages?where[slug][equals]=${slug}&depth=0${q}`)
      expect((await res.json()).totalDocs, `anonymous query${q}`).toBe(0)
    }
    await anon.dispose()
  })

  test('"Preview" shows the draft in the website design, only to logged-in editors', async ({
    page,
    browser,
  }) => {
    await gotoAdmin(page, editUrl)
    const [preview] = await Promise.all([
      page.waitForEvent('popup'),
      // Payload's Preview control is an icon link (opens in a new tab), not a button.
      page.locator('#preview-button').click(),
    ])
    await preview.waitForLoadState()
    await expect(preview).toHaveURL(new RegExp(`/${slug}$`))
    await expect(preview.locator('h1').first()).toHaveText(title)
    await expect(preview.getByText(body)).toBeVisible()
    await expect(preview.getByRole('status').filter({ hasText: /preview/i })).toBeVisible()

    // "Exit preview" returns to the normal public view, where the draft doesn't exist.
    await preview.getByRole('link', { name: 'Exit preview' }).click()
    await expect(preview.getByText(body)).toHaveCount(0)
    await preview.close()

    // Someone who isn't logged in can't switch preview on.
    const anon = await browser.newContext({ baseURL: BASE_URL, storageState: { cookies: [], origins: [] } })
    const res = await anon.request.get(`/next/preview?slug=${slug}`, { maxRedirects: 0 })
    expect(res.status()).toBe(401)
    await anon.close()
  })

  test('"Publish changes" puts it live', async ({ page }) => {
    await gotoAdmin(page, editUrl)
    await page.getByRole('button', { name: 'Publish changes' }).click()
    await expectSaved(page)
    await expect(page.locator('.status')).toContainText('Published')

    const res = await page.goto(`/${slug}`)
    expect(res?.status()).toBe(200)
    await expect(page.locator('h1').first()).toHaveText(title)
    await expect(page.getByText(body)).toBeVisible()
  })

  test('Google/SEO and Video tabs change the live page', async ({ page }) => {
    await gotoAdmin(page, editUrl)
    await openTab(page, 'Google / SEO')
    await page.getByLabel('Title in Google').fill(`PW SEO Title ${RUN}`)
    await page.getByLabel('Description in Google').fill('PW meta description')
    await openTab(page, 'Video & PDF')
    await page.getByLabel('YouTube video ID').fill('dQw4w9WgXcQ')
    await page.getByRole('button', { name: 'Publish changes' }).click()
    await expectSaved(page)

    await page.goto(`/${slug}`)
    await expect(page).toHaveTitle(new RegExp(`PW SEO Title ${RUN}`))
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'PW meta description')
    await expect(page.locator('iframe[src*="youtube.com/embed/dQw4w9WgXcQ"]')).toBeAttached()
  })

  test('"Save Draft" keeps edits off the website until "Publish changes"', async ({ page }) => {
    await gotoAdmin(page, editUrl)
    await page.getByLabel(/^Title\s*\*?$/).fill(`${title} (edited)`)
    await page.getByRole('button', { name: /save draft/i }).click()
    await expectSaved(page)
    await expect(page.locator('.status')).toContainText('Changed')

    await page.goto(`/${slug}`)
    await expect(page.locator('h1').first()).toHaveText(title)

    await gotoAdmin(page, editUrl)
    await expect(page.getByLabel(/^Title\s*\*?$/)).toHaveValue(`${title} (edited)`)
    await page.getByRole('button', { name: 'Publish changes' }).click()
    await expectSaved(page)

    await page.goto(`/${slug}`)
    await expect(page.locator('h1').first()).toHaveText(`${title} (edited)`)
  })

  test('Versions keeps a history of every save', async ({ page }) => {
    await gotoAdmin(page, `${editUrl}/versions`)
    // draft + publish + SEO publish + draft save + publish = at least 5 versions
    await expect.poll(() => page.locator('table tbody tr').count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(5)
  })

  test('"Needs new text" shows the placeholder instead of the content', async ({ page }) => {
    await gotoAdmin(page, editUrl)
    await page.getByLabel('Needs new text').check()
    await page.getByRole('button', { name: 'Publish changes' }).click()
    await expectSaved(page)

    await page.goto(`/${slug}`)
    await expect(page.getByText(/awaiting final copy/i)).toBeVisible()
    await expect(page.getByText(body)).toHaveCount(0)
  })

  test('"Unpublish" takes the page off the website', async ({ page }) => {
    await gotoAdmin(page, editUrl)
    await page.locator('button.popup-button--default').click()
    await page.getByRole('button', { name: 'Unpublish', exact: true }).click()
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(page.getByText(/unpublished successfully/i).first()).toBeVisible({ timeout: 15_000 })

    const res = await page.goto(`/${slug}`)
    expect(res?.status()).toBe(404)
  })

  test('deletes the page from the admin', async ({ page }) => {
    await gotoAdmin(page, editUrl)
    await page.locator('button.popup-button--default').click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await page.getByRole('button', { name: 'Confirm', exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/collections\/pages(\?.*)?$/, { timeout: 15_000 })

    const found = await api(page, `/api/pages?where[slug][equals]=${slug}&depth=0&draft=true`)
    expect(found.json.totalDocs).toBe(0)
  })
})

test.describe.serial('Media library', () => {
  const filename = `pw-upload-${RUN}.png`
  // 1x1 transparent PNG
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )

  test.afterAll(async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      const found = await api(page, `/api/media?where[filename][equals]=${filename}&depth=0`)
      for (const d of found.json?.docs ?? []) await api(page, `/api/media/${d.id}`, { method: 'DELETE' })
    })
  })

  test('uploads an image with alt text and serves the file', async ({ page }) => {
    await gotoAdmin(page, '/admin/collections/media/create')
    await page.locator('input[type="file"]').setInputFiles({ name: filename, mimeType: 'image/png', buffer: png })
    await page.getByLabel('Alt text').fill('Playwright test image')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/collections\/media\/[a-f0-9]{24}$/, { timeout: 15_000 })

    const found = await api(page, `/api/media?where[filename][equals]=${filename}&depth=0`)
    expect(found.json.totalDocs).toBe(1)
    const doc = found.json.docs[0]
    expect(doc.alt).toBe('Playwright test image')

    const file = await page.request.get(doc.url)
    expect(file.status()).toBe(200)
    expect(file.headers()['content-type']).toContain('image/png')
  })

  test('the uploaded image appears in the library list', async ({ page }) => {
    await page.goto('/admin/collections/media')
    await page.getByPlaceholder(/search/i).fill(filename)
    await expect(page.getByRole('link', { name: filename })).toBeVisible({ timeout: 15_000 })
  })
})

test.describe.serial('Site Settings reach the website', () => {
  let original: Record<string, unknown> | null = null
  const heading = `PW Hero Heading ${RUN}`
  const phone = `01 555 ${String(RUN).slice(-4)}`

  test.beforeAll(async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      original = (await api(page, '/api/globals/site-settings?depth=0')).json
    })
  })
  test.afterAll(async ({ browser }) => {
    if (!original) return
    await withAdmin(browser, async (page) => {
      const o = original as Record<string, unknown>
      const fields = ['siteTitle', 'tagline', 'logo', 'contact', 'homepageHero', 'trustBadges', 'contactPageIntro']
      const data = Object.fromEntries(fields.map((f) => [f, o[f]]))
      const res = await api(page, '/api/globals/site-settings', { method: 'POST', body: data })
      expect(res.status, 'restoring Site Settings').toBe(200)
    })
  })

  test('Homepage tab: banner heading shows on the homepage', async ({ page }) => {
    await gotoAdmin(page, '/admin/globals/site-settings')
    // Payload reopens whichever tab this user last had open, so select it explicitly.
    await openTab(page, 'Homepage')
    await page.locator('#field-homepageHero__heading').fill(heading)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expectSaved(page)

    await page.goto('/')
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  })

  test('Contact details tab: phone number shows in the footer', async ({ page }) => {
    await gotoAdmin(page, '/admin/globals/site-settings')
    await openTab(page, 'Contact details')
    await page.locator('#field-contact__phone').fill(phone)
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expectSaved(page)

    await page.goto('/')
    await expect(page.locator('footer').getByText(phone)).toBeVisible()
  })
})

test.describe.serial('Navigation Menu reaches the header', () => {
  let originalItems: unknown[] | null = null
  const renamed = `Home PW${String(RUN).slice(-4)}`
  const added = { text: `PW Link ${String(RUN).slice(-4)}`, href: '/contact-us' }

  test.beforeAll(async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      originalItems = (await api(page, '/api/globals/navigation?depth=0')).json.items
    })
  })
  test.afterAll(async ({ browser }) => {
    if (!originalItems) return
    await withAdmin(browser, async (page) => {
      const res = await api(page, '/api/globals/navigation', { method: 'POST', body: { items: originalItems } })
      expect(res.status, 'restoring Navigation Menu').toBe(200)
    })
  })

  test('renaming a menu item and adding a new one updates the header', async ({ page }) => {
    test.setTimeout(90_000) // the menu is 4 levels deep - its editor is slow to build in dev
    await gotoAdmin(page, '/admin/globals/navigation')

    // Add the row before typing anywhere: a new row loads its fields from the server, and if
    // another field's change is still syncing at that moment the row can stay on its loading
    // placeholder. Waiting for the row first keeps the two from overlapping.
    const count = (originalItems ?? []).length
    await page.getByRole('button', { name: 'Add Item', exact: true }).click()
    const newText = page.locator(`#field-items__${count}__text`)
    await expect(newText).toBeVisible({ timeout: 30_000 })
    await newText.fill(added.text)
    await page.locator(`#field-items__${count}__href`).fill(added.href)
    await page.locator('#field-items__0__text').fill(renamed)

    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expectSaved(page)

    await page.goto('/')
    const header = page.locator('header')
    await expect(header.getByRole('link', { name: renamed, exact: true }).first()).toBeAttached()
    await expect(header.getByRole('link', { name: added.text, exact: true }).first()).toHaveAttribute(
      'href',
      added.href,
    )
  })
})

test.describe.serial('Business Cards', () => {
  const suffix = String(RUN).slice(-6)
  const name = `PW Card Person ${suffix}`
  const slug = `pw-card-person-${suffix}` // generated from the name
  let editUrl = ''

  test.afterAll(async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      const found = await api(page, `/api/staff-cards?where[slug][equals]=${slug}&depth=0`)
      for (const d of found.json?.docs ?? []) await api(page, `/api/staff-cards/${d.id}`, { method: 'DELETE' })
    })
  })

  test('adding a card creates its address from the name, its page and its vCard', async ({ page }) => {
    await gotoAdmin(page, '/admin/collections/staff-cards/create')
    await expect(page.getByText('Save the card to create its QR code.')).toBeVisible()
    await page.locator('#field-name').fill(name)
    await page.locator('#field-title').fill('Test Engineer')
    await page.locator('#field-email').fill('pw-card@example.com')
    await page.locator('#field-phone').fill('01 234 5678')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(page).toHaveURL(/\/admin\/collections\/staff-cards\/[a-f0-9]{24}$/, { timeout: 15_000 })
    editUrl = page.url()
    await expect(page.locator('#field-slug')).toHaveValue(slug)

    const res = await page.goto(`/card/${slug}`)
    expect(res?.status()).toBe(200)
    await expect(page.getByText(name).first()).toBeVisible()
    await expect(page.getByText('Test Engineer').first()).toBeVisible()
    await expect(page.locator('canvas, svg').first()).toBeAttached()

    const vcard = await page.request.get(`/card/${slug}/vcard`)
    expect(vcard.status()).toBe(200)
    expect(await vcard.text()).toContain(name)
  })

  test('the card editor shows its QR code with PNG/SVG downloads and the card link', async ({ page }) => {
    await gotoAdmin(page, editUrl)
    const qr = page.getByTestId('card-qr-preview')
    await expect(qr.locator('svg')).toBeAttached({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: new RegExp(`/card/${slug}$`) })).toBeVisible()

    for (const ext of ['png', 'svg'] as const) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: `Download ${ext.toUpperCase()}` }).click(),
      ])
      expect(download.suggestedFilename()).toBe(`${slug}-qr-code.${ext}`)
    }
  })
})

test.describe('Enquiries', () => {
  test('list is read-only: no "Create New" button', async ({ page }) => {
    await page.goto('/admin/collections/contact-submissions')
    await expect(page.getByRole('heading', { name: 'Enquiries', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /create new/i })).toHaveCount(0)
  })
})

test.describe.serial('Editor role (WordPress-style permissions)', () => {
  const email = `pw-editor-${RUN}@example.com`
  const username = `pweditor${RUN}`
  const password = `pw-${RUN}-Editor!`
  let editorId = ''

  test.beforeAll(async ({ browser }) => {
    await withAdmin(browser, async (page) => {
      const res = await api(page, '/api/users', {
        method: 'POST',
        body: { email, username, password, name: 'PW Editor', role: 'editor' },
      })
      expect(res.status, 'creating the test editor').toBe(201)
      editorId = res.json.doc.id
    })
  })
  test.afterAll(async ({ browser }) => {
    if (!editorId) return
    await withAdmin(browser, async (page) => {
      await api(page, `/api/users/${editorId}`, { method: 'DELETE' })
    })
  })

  async function loginAsEditor(browser: Browser) {
    const context = await browser.newContext({ baseURL: BASE_URL, storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()
    await page.goto('/admin/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: /login/i }).click()
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 15_000 })
    return { context, page }
  }

  test('can log in with a username instead of an email', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE_URL, storageState: { cookies: [], origins: [] } })
    const page = await context.newPage()
    await page.goto('/admin/login')
    await page.getByLabel(/email or username/i).fill(username)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: /login/i }).click()
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 15_000 })
    await context.close()
  })

  test('can log in and manage pages', async ({ browser }) => {
    const { context, page } = await loginAsEditor(browser)
    const res = await api(page, '/api/pages', {
      method: 'POST',
      body: { title: `PW Editor Page ${RUN}`, slug: `pw-editor-page-${RUN}` },
    })
    expect(res.status).toBe(201)
    const del = await api(page, `/api/pages/${res.json.doc.id}`, { method: 'DELETE' })
    expect(del.status).toBe(200)
    await context.close()
  })

  test('cannot change Site Settings or the Navigation Menu', async ({ browser }) => {
    const { context, page } = await loginAsEditor(browser)
    expect((await api(page, '/api/globals/site-settings', { method: 'POST', body: { tagline: 'hacked' } })).status).toBe(403)
    expect((await api(page, '/api/globals/navigation', { method: 'POST', body: { items: [] } })).status).toBe(403)

    await gotoAdmin(page, '/admin/globals/site-settings')
    await openTab(page, 'Homepage')
    await expect(page.locator('#field-homepageHero__heading')).toBeDisabled()
    await context.close()
  })

  test('only sees their own account and cannot make themselves admin', async ({ browser }) => {
    const { context, page } = await loginAsEditor(browser)
    const users = await api(page, '/api/users?depth=0')
    expect(users.json.totalDocs).toBe(1)
    expect(users.json.docs[0].email).toBe(email)

    await api(page, `/api/users/${editorId}`, { method: 'PATCH', body: { role: 'admin' } })
    const me = await api(page, `/api/users/${editorId}?depth=0`)
    expect(me.json.role).toBe('editor')
    await context.close()
  })
})

/** Runs `fn` with a fresh admin-authenticated page on the app origin (for setup/cleanup). */
async function withAdmin(browser: Browser, fn: (page: Page) => Promise<void>) {
  const context = await browser.newContext({ baseURL: BASE_URL, storageState: 'playwright/.auth/admin.json' })
  const page = await context.newPage()
  await page.goto('/admin')
  try {
    await fn(page)
  } finally {
    await context.close()
  }
}
