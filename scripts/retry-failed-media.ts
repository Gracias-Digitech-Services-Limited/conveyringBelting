/**
 * Re-attempts the download for any `media` docs that were created with metadata only
 * (the source download failed/timed out during `npm run seed`). Matches by `sourceUrl`.
 *
 * Usage: npx tsx scripts/retry-failed-media.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

async function main() {
  console.log('Connecting to Payload / MongoDB...')
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'media',
    where: { filename: { exists: false } },
    limit: 0,
  })

  console.log(`Found ${docs.length} media doc(s) missing a file.`)

  let fixed = 0
  let stillFailing = 0

  for (const doc of docs) {
    const sourceUrl = doc.sourceUrl as string | undefined
    if (!sourceUrl) {
      console.warn(`  ⚠ ${doc.id} has no sourceUrl - skipping`)
      continue
    }

    try {
      const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(60_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buffer = Buffer.from(await res.arrayBuffer())
      const filename = sourceUrl.split('/').pop() || `${doc.id}.bin`
      const mimetype = res.headers.get('content-type') || 'application/octet-stream'

      await payload.update({
        collection: 'media',
        id: doc.id,
        data: {},
        file: { data: buffer, mimetype, name: filename, size: buffer.byteLength },
      })
      console.log(`  ✓ ${filename}`)
      fixed++
    } catch (err) {
      console.warn(`  ⚠ still failed: ${sourceUrl} (${(err as Error).message})`)
      stillFailing++
    }
  }

  console.log(`\nDone. Fixed: ${fixed}, still failing: ${stillFailing}.`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Retry failed:', err)
  process.exit(1)
})
