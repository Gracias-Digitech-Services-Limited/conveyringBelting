import { getPayloadClient } from '@/lib/payload'

/**
 * Serves a Media image from this site's own origin. The admin's business-card QR preview draws
 * the card logo onto a <canvas>, which browsers refuse for cross-origin images without CORS
 * headers - and R2's public bucket sends none. (The public card page avoids the same problem
 * server-side with lib/staffCards.ts#mediaDataUrl.) Media is public anyway, so this exposes
 * nothing new; it's limited to images.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadClient()
  const media = await payload.findByID({ collection: 'media', id, depth: 0 }).catch(() => null)
  if (!media?.url || !media.mimeType?.startsWith('image/')) {
    return new Response('Not found', { status: 404 })
  }

  // Local-disk storage (dev without R2) gives a relative /api/media/file/... URL.
  const upstream = await fetch(new URL(media.url, request.url))
  if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 })

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? media.mimeType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
