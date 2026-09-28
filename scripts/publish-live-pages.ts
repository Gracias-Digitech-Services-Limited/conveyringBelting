/**
 * One-off data fix, run once per database BEFORE deploying the "single publish control" change.
 *
 * Pages used to have two publish states: a WordPress-style `status` select (publish / draft /
 * private) that the website read, and Payload's own `_status` (draft / published), which the
 * original seed never set - so all pages were unpublished drafts in Payload's eyes while the
 * site showed them anyway. The website now only shows `_status: 'published'` pages, so this
 * publishes every page whose old status was "publish", with exactly the content that's live
 * today (the main document, not any newer unsaved draft). Pages that were draft/private in
 * WordPress stay unpublished, i.e. hidden - matching how WordPress treated them.
 *
 * Safe to re-run: already-published pages are skipped.
 *
 *   npx tsx scripts/publish-live-pages.ts --dry-run   # report only
 *   npx tsx scripts/publish-live-pages.ts             # apply
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import type { MongooseAdapter } from '@payloadcms/db-mongodb'
import config from '../payload.config'

type RawPage = { _id: unknown; slug?: string; status?: string; _status?: string }

const dryRun = process.argv.includes('--dry-run')

async function main() {
  const payload = await getPayload({ config })

  // The old `status` field is no longer in the Pages config, so read it straight from MongoDB.
  const PagesModel = (payload.db as unknown as MongooseAdapter).collections.pages
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

  console.log(`${dryRun ? '[dry run] would publish' : 'Published'}: ${published} page(s)`)
  console.log(`Already published: ${alreadyPublished}`)
  console.log(`Left unpublished (hidden from the website): ${keptHidden.length}`)
  keptHidden.forEach((p) => console.log(`  - ${p}`))
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
