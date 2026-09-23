/**
 * One-time migration script: reads the three WordPress export files in /data and
 * populates MongoDB via Payload's local API. Safe to re-run - it upserts by the
 * original WordPress id (`wpId`) instead of duplicating documents.
 *
 * Usage: npm run seed
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import {
  getAllContentWithResolvedSlugs,
  wpMedia,
  staffCardsData,
  siteSettings as wpSiteSettings,
  decodeWpEntities,
  type WpMediaItem,
} from '../lib/wpData'
import { plainTextToLexical } from '../lib/richtext'
import { DEFAULT_NAV } from '../lib/nav'

async function upsertMedia(payload: Awaited<ReturnType<typeof getPayload>>, item: WpMediaItem) {
  const existing = await payload.find({
    collection: 'media',
    where: { wpId: { equals: item.id } },
    limit: 1,
  })
  if (existing.docs[0]) return existing.docs[0].id as string

  const alt = decodeWpEntities(item.alt_text || item.title?.rendered || '')
  const caption = decodeWpEntities(item.caption?.rendered || '')
  const filename = item.source_url.split('/').pop() || `${item.slug}.bin`

  let buffer: Buffer
  try {
    const res = await fetch(item.source_url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    buffer = Buffer.from(await res.arrayBuffer())
  } catch (err) {
    console.warn(`  ⚠ could not download ${item.source_url} (${(err as Error).message}) - skipping file, keeping metadata only`)
    return null
  }

  const created = await payload.create({
    collection: 'media',
    data: { alt, caption, wpId: item.id, sourceUrl: item.source_url },
    file: {
      data: buffer,
      mimetype: item.mime_type,
      name: filename,
      size: buffer.byteLength,
    },
  })
  return created.id as string
}

async function seedMedia(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log(`\nSeeding ${wpMedia.length} media items...`)
  const map = new Map<number, string>()
  let ok = 0
  let skipped = 0

  for (const item of wpMedia) {
    const id = await upsertMedia(payload, item)
    if (id) {
      map.set(item.id, id)
      ok++
    } else {
      skipped++
    }
  }

  console.log(`Media done: ${ok} created/found, ${skipped} skipped (download failed).`)
  return map
}

async function seedPages(payload: Awaited<ReturnType<typeof getPayload>>) {
  const items = getAllContentWithResolvedSlugs()
  console.log(`\nSeeding ${items.length} pages/posts...`)

  const needsCopy: string[] = []
  let created = 0
  let updated = 0

  for (const item of items) {
    const existing = await payload.find({
      collection: 'pages',
      where: { 'migration.wpId': { equals: item.id } },
      limit: 1,
    })

    const title = decodeWpEntities(item.title)
    const contentIsEmpty = !item.content_text?.trim()
    if (contentIsEmpty) needsCopy.push(`${title} (/${item.resolvedSlug})`)

    const data = {
      title,
      slug: item.resolvedSlug,
      status: item.status,
      needsCopy: contentIsEmpty,
      content: plainTextToLexical(item.content_text),
      seo: {
        metaTitle: title,
        metaDescription: decodeWpEntities(item.excerpt_text || '').slice(0, 160),
      },
      migration: {
        wpId: item.id,
        legacyUrl: item.url,
        contentType: item.kind,
        modifiedAt: item.modified,
      },
    }

    // Publish status.publish -> live version; draft/private -> kept as a draft version in Payload.
    const draft = item.status !== 'publish'

    if (existing.docs[0]) {
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data,
        draft,
      })
      updated++
    } else {
      await payload.create({
        collection: 'pages',
        data,
        draft,
      })
      created++
    }
  }

  console.log(`Pages done: ${created} created, ${updated} updated.`)
  if (needsCopy.length) {
    console.log(`\n${needsCopy.length} page(s) need new copy written (empty in the WP export):`)
    needsCopy.forEach((p) => console.log(`  - ${p}`))
  }
}

async function seedStaffCards(
  payload: Awaited<ReturnType<typeof getPayload>>,
  mediaMap: Map<number, string>,
) {
  console.log(`\nSeeding ${staffCardsData.length} staff business cards...`)
  let created = 0
  let updated = 0

  for (const card of staffCardsData) {
    const existing = await payload.find({
      collection: 'staff-cards',
      where: { wpId: { equals: card.id } },
      limit: 1,
    })

    const data = {
      name: card.name,
      slug: card.slug,
      title: card.title || undefined,
      org: card.org,
      phone: card.phone,
      email: card.email,
      address: card.address,
      website: card.website,
      status: card.status,
      photo: card.photo_media_id ? mediaMap.get(card.photo_media_id) : undefined,
      logo: card.logo_media_id ? mediaMap.get(card.logo_media_id) : undefined,
      wpId: card.id,
    }

    if (existing.docs[0]) {
      await payload.update({ collection: 'staff-cards', id: existing.docs[0].id, data })
      updated++
    } else {
      await payload.create({ collection: 'staff-cards', data })
      created++
    }
  }

  console.log(`Staff cards done: ${created} created, ${updated} updated.`)
}

/**
 * Populates the Navigation and Site Settings globals so the admin panel starts pre-filled
 * with the real migrated content instead of blank fields - but only the first time (if an
 * admin has already edited them, re-running the seed script must not clobber that).
 */
async function seedGlobals(payload: Awaited<ReturnType<typeof getPayload>>) {
  console.log('\nSeeding site settings + navigation globals...')

  const nav = await payload.findGlobal({ slug: 'navigation' })
  if (!nav?.items?.length) {
    await payload.updateGlobal({ slug: 'navigation', data: { items: DEFAULT_NAV } })
    console.log('  Navigation menu seeded.')
  } else {
    console.log('  Navigation menu already set - left untouched.')
  }

  const settings = await payload.findGlobal({ slug: 'site-settings' })
  if (!settings?.siteTitle) {
    await payload.updateGlobal({
      slug: 'site-settings',
      data: {
        siteTitle: (wpSiteSettings.title as string) || 'Conveyor Belting Ireland',
        tagline: (wpSiteSettings.description as string) || undefined,
      },
    })
    console.log('  Site settings seeded (fill in the rest - contact info, hero copy - in /admin).')
  } else {
    console.log('  Site settings already set - left untouched.')
  }
}

async function main() {
  console.log('Connecting to Payload / MongoDB...')
  const payload = await getPayload({ config })

  const mediaMap = await seedMedia(payload)
  await seedPages(payload)
  await seedStaffCards(payload, mediaMap)
  await seedGlobals(payload)

  console.log('\nSeed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
