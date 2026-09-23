import allPagesExport from '../data/conveyorbelting-all-pages-export.json'
import siteAssetsExport from '../data/conveyorbelting-site-assets-export.json'
import qrFormsExport from '../data/conveyorbelting-qrcards-forms-export.json'

export type WpStatus = 'publish' | 'draft' | 'private'

export interface WpPageItem {
  id: number
  slug: string
  title: string
  url: string
  status: WpStatus
  parent: number
  modified: string
  content_text: string
  excerpt_text: string
}

export interface WpPostItem extends Omit<WpPageItem, 'parent'> {
  parent?: number
}

export interface WpMediaItem {
  id: number
  slug: string
  title: { rendered: string }
  caption: { rendered: string }
  alt_text: string
  media_type: string
  mime_type: string
  source_url: string
}

export interface NavLink {
  text: string
  href: string
}

export interface WpQrCard {
  id: number
  slug: string
  name: string
  title: string | null
  phone: string
  email: string
  address: string
  org: string
  website: string
  status: WpStatus
  photo_media_id: number | null
  logo_media_id: number | null
}

export const wpPages = allPagesExport.pages as WpPageItem[]
export const wpPosts = allPagesExport.posts as WpPostItem[]
export const wpMedia = siteAssetsExport.media as WpMediaItem[]
export const siteSettings = siteAssetsExport.site_settings as Record<string, unknown>
export const navMenus = siteAssetsExport.nav_menus as { index: number; id: string; class: string; links: NavLink[] }[]
export const staffCardsData = qrFormsExport.qr_business_cards as WpQrCard[]
export const contactFormSchema = qrFormsExport.contact_forms

/** Slugify a title into a URL-safe segment (used only as a fallback when the WP slug was empty). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&#8211;|&#8212;/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}

export function decodeWpEntities(input: string): string {
  return input
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
}

/**
 * Every page/post in the export, with a guaranteed-unique, non-empty slug.
 * 6 draft pages ship with an empty `slug` in the WP export (never published under a real path) -
 * those get a deterministic `page-{id}` fallback slug so they still show up in the CMS and sitemap.
 */
export function getAllContentWithResolvedSlugs(): Array<
  (WpPageItem | WpPostItem) & { resolvedSlug: string; kind: 'page' | 'post' }
> {
  const seen = new Set<string>()
  const all = [
    ...wpPages.map((p) => ({ ...p, kind: 'page' as const })),
    ...wpPosts.map((p) => ({ ...p, kind: 'post' as const })),
  ]

  return all.map((item) => {
    let resolvedSlug = item.slug?.trim() || `page-${item.id}`
    while (seen.has(resolvedSlug)) {
      resolvedSlug = `${resolvedSlug}-${item.id}`
    }
    seen.add(resolvedSlug)
    return { ...item, resolvedSlug }
  })
}
