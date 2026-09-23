/**
 * Builds a direct URL to a media file by filename, for the handful of places in the UI that
 * reference a known filename directly (logo, hardcoded banner lookups) rather than through a
 * Payload media relationship. Uses R2's public URL when configured - proxying every image
 * through Payload's own `/api/media/file` route adds a slow serverless round-trip per request.
 * Falls back to that route when R2 isn't configured (e.g. local dev without S3 set up).
 */
const MEDIA_BASE = process.env.NEXT_PUBLIC_S3_PUBLIC_URL

export function mediaFileUrl(filename: string): string {
  return MEDIA_BASE ? `${MEDIA_BASE}/${filename}` : `/api/media/file/${filename}`
}
