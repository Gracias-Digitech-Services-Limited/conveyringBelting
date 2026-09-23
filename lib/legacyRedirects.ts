import { getAllContentWithResolvedSlugs } from './wpData'

interface RedirectRule {
  source: string
  destination: string
  permanent: boolean
  has?: Array<{ type: 'query'; key: string; value: string }>
}

/**
 * Maps every page/post `url` from the WordPress export to its new path, so old
 * search-engine-indexed links keep working after launch. Built from data/*.json,
 * not hand-maintained, so it stays correct as the export is refreshed.
 */
export function buildLegacyRedirects(): RedirectRule[] {
  const items = getAllContentWithResolvedSlugs()
  const redirects: RedirectRule[] = []

  for (const item of items) {
    const destination = item.resolvedSlug === 'home' ? '/' : `/${item.resolvedSlug}`
    let oldUrl: URL
    try {
      oldUrl = new URL(item.url)
    } catch {
      continue
    }

    const pageId = oldUrl.searchParams.get('page_id')

    if (oldUrl.pathname === '/' && pageId) {
      // These WP drafts were only ever reachable via /?page_id=<id>, never a real path -
      // match on that query param instead of the (ambiguous, shared-by-everyone) "/" path.
      redirects.push({
        source: '/',
        has: [{ type: 'query', key: 'page_id', value: pageId }],
        destination,
        permanent: true,
      })
      continue
    }

    const source = oldUrl.pathname.replace(/\/+$/, '') || '/'
    if (source === destination) continue // same path under the new site - no redirect needed

    redirects.push({ source, destination, permanent: true })
  }

  return redirects
}
