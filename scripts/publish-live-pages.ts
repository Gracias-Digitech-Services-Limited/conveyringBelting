/**
 * One-off data fix, run once per database BEFORE deploying the "single publish control" change.
 *
 * 1. Repairs inline images in page text. Some pages' rich text had their image nodes saved with
 *    the whole populated Media document instead of just its ID (a page was written back after
 *    being read with depth > 0). The website renders either shape, but the admin's text editor
 *    crashes on the populated one ("Upload value should be a string or number"), so those pages
 *    couldn't be edited. Each such node is reduced back to the Media ID - same image, same page.
 *
 * 2. Publishes the live pages. Pages used to have two publish states: a WordPress-style `status`
 *    select (publish / draft / private) that the website read, and Payload's own `_status`
 *    (draft / published), which the original seed never set - so every page was an unpublished
 *    draft in Payload's eyes while the site showed it anyway. The website now only shows
 *    `_status: 'published'` pages, so this publishes every page whose old status was "publish",
 *    with exactly the content that's live today (the main document, not any newer unsaved
 *    draft). Pages that were draft/private in WordPress stay unpublished, i.e. hidden - matching
 *    how WordPress treated them.
 *
 * Safe to re-run: repaired nodes and already-published pages are skipped.
 *
 *   npx tsx scripts/publish-live-pages.ts --dry-run   # report only
 *   npx tsx scripts/publish-live-pages.ts             # apply
 *
 * Add --public-dns if MongoDB Atlas fails with "querySrv ECONNREFUSED": some local DNS setups
 * (e.g. Tailscale's) refuse the SRV lookups that mongodb+srv:// addresses need.
 */
import 'dotenv/config'
import dns from 'node:dns'
import { getPayload } from 'payload'
import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import config from '../payload.config'

type RawPage = { _id: unknown; slug?: string; status?: string; _status?: string; content?: unknown }
type RawVersion = { _id: unknown; parent?: unknown; version?: { content?: unknown } }

const dryRun = process.argv.includes('--dry-run')

if (process.argv.includes('--public-dns')) {
  dns.setServers(['1.1.1.1', '8.8.8.8'])
  dns.promises.setServers(['1.1.1.1', '8.8.8.8'])
}

/**
 * Returns a copy of a Lexical document with every upload node's populated `value` object
 * replaced by its ID, plus how many nodes were changed.
 */
function normalizeUploads(node: unknown): { value: unknown; fixed: number } {
  let fixed = 0
  const walk = (n: unknown): unknown => {
    if (Array.isArray(n)) return n.map(walk)
    if (!n || typeof n !== 'object') return n
    const obj = n as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(obj)) out[key] = walk(val)
    if (obj.type === 'upload' && obj.value && typeof obj.value === 'object') {
      const media = obj.value as { id?: unknown; _id?: unknown }
      const id = media.id ?? media._id
      if (id) {
        out.value = String(id)
        fixed++
      }
    }
    return out
  }
  return { value: walk(node), fixed }
}

async function main() {
  const payload = await getPayload({ config })
  const db = payload.db as unknown as MongooseAdapter
  const PagesModel = db.collections.pages
  const VersionsModel = db.versions.pages

  // --- 1. Repair inline image nodes (raw MongoDB: no hooks, no new versions) ---
  const repairedPages: string[] = []
  const rawPages = (await PagesModel.find({}, { slug: 1, content: 1 }).lean()) as RawPage[]
  for (const doc of rawPages) {
    const { value, fixed } = normalizeUploads(doc.content)
    if (!fixed) continue
    repairedPages.push(`/${doc.slug ?? '(no address)'} (${fixed} image${fixed === 1 ? '' : 's'})`)
    if (!dryRun) await PagesModel.updateOne({ _id: doc._id }, { $set: { content: value } })
  }
  let repairedVersions = 0
  const rawVersions = (await VersionsModel.find({}, { 'version.content': 1 }).lean()) as RawVersion[]
  for (const v of rawVersions) {
    const { value, fixed } = normalizeUploads(v.version?.content)
    if (!fixed) continue
    repairedVersions++
    if (!dryRun) await VersionsModel.updateOne({ _id: v._id }, { $set: { 'version.content': value } })
  }

  // --- 2. Publish the pages that are live today ---
  // The old `status` field is no longer in the Pages config, so read it straight from MongoDB.
  const raw = (await PagesModel.find({}, { slug: 1, status: 1, _status: 1 }).lean()) as RawPage[]

  let published = 0
  let alreadyPublished = 0
  const keptHidden: string[] = []

  for (const doc of raw) {
    const id = String(doc._id)
    if (doc.status !== 'publish') {
      keptHidden.push(`/${doc.slug ?? '(no address)'} (was "${doc.status ?? 'unset'}")`)
      continue
    }
    if (doc._status === 'published') {
      alreadyPublished++
      continue
    }

    if (!dryRun) {
      // draft: false reads the main document - exactly what the website shows today.
      const live = await payload.findByID({ collection: 'pages', id, draft: false, depth: 0 })
      const fields: Record<string, unknown> = { ...live }
      for (const key of ['id', 'createdAt', 'updatedAt', '_status', 'status']) delete fields[key]
      await payload.update({
        collection: 'pages',
        id,
        data: { ...fields, _status: 'published' },
        draft: false,
        depth: 0,
      })
    }
    published++
  }

  const would = dryRun ? '[dry run] would ' : ''
  console.log(`${would}repair inline images on ${repairedPages.length} page(s), ${repairedVersions} saved version(s)`)
  repairedPages.forEach((p) => console.log(`  - ${p}`))
  console.log(`${would}publish: ${published} page(s)`)
  console.log(`Already published: ${alreadyPublished}`)
  console.log(`Left unpublished (hidden from the website): ${keptHidden.length}`)
  keptHidden.forEach((p) => console.log(`  - ${p}`))
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
