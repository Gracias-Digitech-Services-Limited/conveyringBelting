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
  embedsBySlug,
  contentBlocksBySlug,
  type WpMediaItem,
} from '../lib/wpData'
import { plainTextToLexical, blocksToLexical, type ContentBlock } from '../lib/richtext'
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
    const res = await fetch(item.source_url, { signal: AbortSignal.timeout(60_000) })
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

/**
 * Resolves a media filename (from the embeds/content-images supplements) to its Payload doc id,
 * if migrated. Matches against `sourceUrl` rather than the stored `filename` - Payload silently
 * renames an upload on disk (e.g. `-3.pdf` -> `-4.pdf`) when a file of that name already exists,
 * which would otherwise cause an exact filename match to miss it. sourceUrl is never touched.
 *
 * `contains` alone isn't enough: "SuperDrive.png" is a substring of "Mini-SuperDrive.png", so a
 * loose match can silently resolve to the wrong file. Fetch candidates, then require the
 * sourceUrl's own basename to equal the target exactly.
 */
async function findMediaIdByFilename(
  payload: Awaited<ReturnType<typeof getPayload>>,
  filename: string,
): Promise<string | null> {
  // WordPress serves auto-generated resized variants inline (e.g. `-1024x742` before the
  // extension) that aren't separate media-library items - strip that suffix before matching.
  const deSized = filename.replace(/-\d+x\d+(\.\w+)$/, '$1')

  for (const candidate of [filename, deSized]) {
    const result = await payload.find({
      collection: 'media',
      where: { sourceUrl: { contains: candidate } },
      limit: 20,
    })
    const exact = result.docs.find((d) => {
      const url = d.sourceUrl as string | undefined
      return url && decodeURIComponent(url.split('/').pop() || '') === candidate
    })
    if (exact) return exact.id as string
  }
  return null
}

/**
 * A handful of content-images-supplement blocks point at a third-party supplier's own site
 * (e.g. esbelt.com) rather than conveyorbelting.ie's own WordPress media library - the live
 * page hotlinks them directly. To keep every image on the migrated site self-hosted (no
 * dependency on an external domain staying up), download and store a copy in our own `media`
 * collection instead of hotlinking. Idempotent: re-checks by sourceUrl before creating.
 */
async function importExternalImage(
  payload: Awaited<ReturnType<typeof getPayload>>,
  src: string,
  alt: string,
): Promise<string | null> {
  const existing = await payload.find({
    collection: 'media',
    where: { sourceUrl: { equals: src } },
    limit: 1,
  })
  if (existing.docs[0]) return existing.docs[0].id as string

  const filename = decodeURIComponent(src.split('/').pop() || 'external-image.jpg')
  try {
    const res = await fetch(src, { signal: AbortSignal.timeout(60_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    const mimetype = res.headers.get('content-type') || 'image/jpeg'
    const created = await payload.create({
      collection: 'media',
      data: { alt, sourceUrl: src },
      file: { data: buffer, mimetype, name: filename, size: buffer.byteLength },
    })
    return created.id as string
  } catch (err) {
    console.warn(`  ⚠ could not import external image ${src} (${(err as Error).message})`)
    return null
  }
}

async function seedPages(payload: Awaited<ReturnType<typeof getPayload>>) {
  const items = getAllContentWithResolvedSlugs()
  console.log(`\nSeeding ${items.length} pages/posts...`)

  const needsCopy: string[] = []
  let created = 0
  let updated = 0
  let embedsAttached = 0
  let imagesRestored = 0

  for (const item of items) {
    const existing = await payload.find({
      collection: 'pages',
      where: { 'migration.wpId': { equals: item.id } },
      limit: 1,
    })

    const title = decodeWpEntities(item.title)
    const contentIsEmpty = !item.content_text?.trim()
    if (contentIsEmpty) needsCopy.push(`${title} (/${item.resolvedSlug})`)

    const embedInfo = embedsBySlug.get(item.resolvedSlug)
    let embeds: { youtubeVideoId?: string; youtubeTitle?: string; pdfAttachment?: string } | undefined
    if (embedInfo) {
      const pdfId = embedInfo.pdfFilename
        ? await findMediaIdByFilename(payload, embedInfo.pdfFilename)
        : null
      embeds = {
        youtubeVideoId: embedInfo.youtubeVideoId,
        youtubeTitle: embedInfo.youtubeTitle,
        ...(pdfId ? { pdfAttachment: pdfId } : {}),
      }
      embedsAttached++
    }

    // A handful of pages have their live body content interleaved with real photos - restored
    // as a proper block sequence (see data/conveyorbelting-content-images-supplement.json)
    // rather than plainTextToLexical's blank-line guessing, which has no concept of images.
    const contentBlocks = contentBlocksBySlug.get(item.resolvedSlug)
    let content = plainTextToLexical(item.content_text)
    if (contentBlocks) {
      const resolved: ContentBlock[] = []
      for (const b of contentBlocks) {
        if (b.type === 'image' && b.src) {
          // Some images are served through WordPress's Jetpack "Photon" CDN proxy
          // (i0/i1/i2.wp.com/<original-host>/<path>?ssl=1) - the file itself is still the same
          // conveyorbelting.ie upload, just wrapped with a query string that would otherwise
          // break filename matching.
          const cleanSrc = b.src.split('?')[0]
          const filename = cleanSrc.split('/').pop()
          let mediaId = filename ? await findMediaIdByFilename(payload, filename) : null
          if (!mediaId && !cleanSrc.includes('conveyorbelting.ie')) {
            mediaId = await importExternalImage(payload, cleanSrc, b.alt || '')
          }
          if (mediaId) resolved.push({ type: 'image', mediaId })
        } else if (b.type !== 'image') {
          resolved.push({ type: b.type, text: b.text })
        }
      }
      content = blocksToLexical(resolved)
      imagesRestored++
    }

    const data = {
      title,
      slug: item.resolvedSlug,
      status: item.status,
      needsCopy: contentIsEmpty,
      content,
      ...(embeds ? { embeds } : {}),
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

  console.log(
    `Pages done: ${created} created, ${updated} updated, ${embedsAttached} with embeds restored, ${imagesRestored} with inline images restored.`,
  )
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
