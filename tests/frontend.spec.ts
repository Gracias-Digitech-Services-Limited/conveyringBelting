import { test, expect } from '@playwright/test'

/**
 * Public frontend smoke tests - no auth needed (all these routes are public). Covers the
 * homepage, navigation, CMS-driven content pages (including the embed/inline-image restoration
 * work), staff digital business cards, and basic error/SEO routes.
 */

test.describe('TC-09 Homepage', () => {
  test('loads with the current logo and hero content', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Conveyor Belting Ireland/)

    // Regression check for the logo swap - both header and footer should use the new
    // "ProTech Belting Ireland" badge, not the old "PTB Innovation Ltd" wordmark.
    const logos = page.getByAltText('ProTech Belting Ireland')
    await expect(logos).toHaveCount(2)
    for (const logo of await logos.all()) {
      await expect(logo).toHaveJSProperty('complete', true)
      expect(await logo.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
    }

    await expect(page.getByRole('heading', { name: 'Conveyor Belting Ireland' })).toBeVisible()
  })

  test('Products grid shows distinct images/icons per card, never a duplicated photo', async ({
    page,
  }) => {
    await page.goto('/')

    // Regression test for the original bug report: several product cards were all showing the
    // same reused stock photo. Solid PU and TPE have real, distinct photos; Plied has none and
    // must fall back to the icon card (no <img> at all), never someone else's photo.
    const solidPuImg = page.locator('a[href="/solid-pu"] img')
    const tpeImg = page.locator('a[href="/tpe-conveyor-belting"] img')
    const pliedImg = page.locator('a[href="/plied"] img')

    await expect(solidPuImg).toHaveCount(1)
    await expect(tpeImg).toHaveCount(1)
    await expect(pliedImg).toHaveCount(0)

    const solidPuSrc = await solidPuImg.getAttribute('src')
    const tpeSrc = await tpeImg.getAttribute('src')
    expect(solidPuSrc).not.toBe(tpeSrc)
    expect(solidPuSrc).toContain('SuperDrive.jpg')
    expect(tpeSrc).toContain('Thermoplastic_Polyester_TPE')
  })
})

test.describe('TC-10 Navigation', () => {
  for (const [linkName, expectedPath] of [
    ['Products', '/products'],
    ['Industries', '/industries'],
    ['About Us', '/about-us'],
    ['Contact us', '/contact-us'],
  ] as const) {
    test(`header "${linkName}" link navigates to ${expectedPath}`, async ({ page }) => {
      await page.goto('/')
      await page.locator('header').getByRole('link', { name: linkName, exact: true }).click()
      await expect(page).toHaveURL(new RegExp(`${expectedPath}/?$`))
    })
  }
})

test.describe('TC-11 Restored PDF/video embeds', () => {
  test('a Download Section flyer page shows a working YouTube embed and PDF preview', async ({
    page,
  }) => {
    await page.goto('/bakery-industry')

    const iframe = page.locator('iframe[src*="youtube.com/embed"]')
    await expect(iframe).toHaveCount(1)
    await expect(iframe).toHaveAttribute('src', /Asc5Ybj-0D0/)

    const pdfObject = page.locator('object[type="application/pdf"]')
    await expect(pdfObject).toHaveCount(1)
    const pdfUrl = await pdfObject.getAttribute('data')
    expect(pdfUrl).toBeTruthy()
    const pdfRes = await page.request.get(pdfUrl!)
    expect(pdfRes.ok()).toBeTruthy()
    expect(pdfRes.headers()['content-type']).toContain('application/pdf')
  })
})

test.describe('TC-12 Restored inline body images', () => {
  test('a product page with interleaved photos renders them alongside the text', async ({
    page,
  }) => {
    await page.goto('/solid-pu')
    const article = page.locator('article')
    const images = article.locator('img')
    await expect(images).toHaveCount(4)
    for (const img of await images.all()) {
      expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)
    }
    await expect(article.getByText('SuperDrive™', { exact: true })).toBeVisible()
  })
})

test.describe('TC-13 Hub pages show full content and the sub-page grid', () => {
  test('/belts shows its own real body copy plus links to PVC/PU/Synthetic belts', async ({
    page,
  }) => {
    await page.goto('/belts')
    await expect(
      page.getByText(/Synthetic Belts have got a fabric base/i),
    ).toBeVisible()

    const grid = page.locator('a[href="/pvc"], a[href="/pu"], a[href="/synthetic-belts"]')
    expect(await grid.count()).toBeGreaterThanOrEqual(3)
  })
})

test.describe('TC-14 Staff digital business card', () => {
  test('a card page renders contact details, vCard link, and a QR code', async ({ page }) => {
    await page.goto('/card/saulius-kulvelis')
    await expect(page.getByRole('heading', { name: 'Saulius Kulvelis' })).toBeVisible()
    await expect(page.getByText('saulius@ptbltd.ie')).toBeVisible()

    const vcardLink = page.getByRole('link', { name: /save to contacts/i })
    await expect(vcardLink).toHaveAttribute('href', /\/card\/saulius-kulvelis\/vcard/)

    await expect(page.locator('canvas')).toBeVisible()
  })
})

test.describe('TC-15 Error and SEO routes', () => {
  test('an unknown URL renders the 404 page, not a crash', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist-xyz')
    expect(res?.status()).toBe(404)
    await expect(page.getByText('This page could not be found.')).toBeVisible()
  })

  test('robots.txt and sitemap.xml are served', async ({ page }) => {
    const robots = await page.request.get('/robots.txt')
    expect(robots.ok()).toBeTruthy()
    expect(await robots.text()).toContain('Sitemap')

    const sitemap = await page.request.get('/sitemap.xml')
    expect(sitemap.ok()).toBeTruthy()
    expect(sitemap.headers()['content-type']).toContain('xml')
  })
})
