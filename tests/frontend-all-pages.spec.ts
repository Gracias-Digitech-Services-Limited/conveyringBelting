import { test, expect } from '@playwright/test'
import allPages from './fixtures/all-pages.json' with { type: 'json' }

/**
 * Smoke-tests every published page in the CMS (fetched via the API and snapshotted into
 * fixtures/all-pages.json - see README note below on regenerating it). For each page: loads
 * with a real 200 (not a silent Next.js error boundary), has no console/page errors, has no
 * broken <img> tags, and its <title> reflects the page.
 *
 * To regenerate the fixture after content changes:
 *   fetch('/api/pages?where[status][equals]=publish&limit=100&depth=0')
 *     .then(r => r.json()).then(j => j.docs.map(d => ({ slug: d.slug, title: d.title })))
 */

for (const { slug, title } of allPages as { slug: string; title: string }[]) {
  const path = slug === 'home' ? '/' : `/${slug}`

  test(`TC-16 page renders cleanly: ${path}`, async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => pageErrors.push(err.message))

    const res = await page.goto(path)
    expect(res?.status(), `${path} should respond 200`).toBe(200)

    // The generic page template always renders an <h1> with the page title (the homepage has
    // its own custom hero heading instead, checked separately in frontend.spec.ts).
    if (slug !== 'home') {
      const escaped = title.replace(/&amp;/g, '&').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      await expect(page.locator('h1').first()).toContainText(new RegExp(escaped, 'i'), {
        timeout: 10_000,
      })
    }

    const images = page.locator('img')
    const count = await images.count()
    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      if (!(await img.isVisible())) continue
      const natural = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
      const src = await img.getAttribute('src')
      expect(natural, `broken image on ${path}: ${src}`).toBeGreaterThan(0)
    }

    // Next.js dev overlay / React error boundaries show up as console errors - a page that
    // "loads" with a 200 but crashed client-side would still be a real bug. Filter out benign
    // third-party noise (the embedded YouTube iframe logs a harmless Permissions-Policy
    // warning for features it probes for but the host page doesn't grant).
    const seriousErrors = consoleErrors.filter(
      (e) =>
        !e.includes('Download the React DevTools') &&
        !e.includes('hydrat') &&
        !e.includes('Permissions policy violation'),
    )
    expect(seriousErrors, `console errors on ${path}`).toEqual([])
    expect(pageErrors, `uncaught errors on ${path}`).toEqual([])
  })
}
