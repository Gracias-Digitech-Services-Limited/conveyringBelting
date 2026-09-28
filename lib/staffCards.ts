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
 * Payload already returns the right URL for however media is currently stored - a same-origin
 * `/api/media/file/...` path in local dev without S3 configured, or the direct R2 public URL
 * (a different origin entirely) when it is. Used to strip this down to just the pathname on the
 * assumption uploads were always same-origin, which broke every photo/logo once media moved to
 * serving straight from R2's own domain instead of being proxied through this app.
 */
export function mediaUrl(media: StaffCard['photo']): string | undefined {
  if (!media || typeof media === 'string' || !media.url) return undefined
  return media.url
}

/**
 * Fetches a media file server-side and inlines it as a base64 data URI. Needed for the QR
 * code's center logo specifically: qr-code-styling draws it onto a `<canvas>` with
 * `crossOrigin: 'anonymous'`, which the browser blocks outright since R2's public bucket
 * doesn't send CORS headers - silently killing the entire QR render, not just the logo. A data
 * URI sidesteps the cross-origin fetch altogether.
 */
export async function mediaDataUrl(media: StaffCard['logo']): Promise<string | undefined> {
  const url = mediaUrl(media)
  if (!url) return undefined
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    const buffer = Buffer.from(await res.arrayBuffer())
    const mimeType = res.headers.get('content-type') || 'image/png'
    return `data:${mimeType};base64,${buffer.toString('base64')}`
  } catch {
    return undefined
  }
}
