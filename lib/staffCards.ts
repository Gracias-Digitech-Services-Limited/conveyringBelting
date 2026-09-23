import { getPayloadClient } from './payload'
import type { StaffCard } from '@/payload-types'

export async function getStaffCardBySlug(slug: string): Promise<StaffCard | null> {
  const payload = await getPayloadClient()
  // No status filter here on purpose: these cards are shared as a direct personal link/QR
  // code (business cards handed out one-to-one), not browsed publicly, so draft/private
  // status shouldn't block the direct link from working - only a real WordPress delete should.
  const result = await payload.find({
    collection: 'staff-cards',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return (result.docs[0] as StaffCard) ?? null
}

/**
 * Payload prefixes upload URLs with `serverURL` (needed for S3 in production), which makes
 * them absolute. Returning the path only keeps this working regardless of which origin the
 * app is actually served from (localhost in dev vs. the real domain in prod) and avoids
 * `next/image`/QR-canvas cross-origin fetches for what is really always a same-origin file.
 */
export function mediaUrl(media: StaffCard['photo']): string | undefined {
  if (!media || typeof media === 'string' || !media.url) return undefined
  try {
    return new URL(media.url, 'http://placeholder').pathname
  } catch {
    return media.url
  }
}
