import type { Page, Media } from '@/payload-types'

/** Renders the YouTube video / PDF preview a page's original WordPress content embedded -
 * restored via the `embeds` field since the plain-text migration export dropped them. */
export function PageEmbeds({ embeds }: { embeds: Page['embeds'] }) {
  if (!embeds) return null

  const { youtubeVideoId, youtubeTitle, pdfAttachment } = embeds
  const pdf = typeof pdfAttachment === 'object' ? (pdfAttachment as Media) : null

  if (!youtubeVideoId && !pdf?.url) return null

  return (
    <div className="mt-8 space-y-8">
      {youtubeVideoId && (
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-black shadow-sm">
          <div className="relative aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}`}
              title={youtubeTitle || 'Video'}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}

      {pdf?.url && (
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
            <p className="truncate text-sm font-medium text-foreground">
              {pdf.filename || 'Download PDF'}
            </p>
            <a
              href={pdf.url}
              download
              className="shrink-0 rounded-md bg-brand-amber px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-amber-light"
            >
              Download
            </a>
          </div>
          {/* Native browser PDF viewer - same object/embed approach the original WordPress
              "File" block used, no extra PDF.js dependency needed. */}
          <object data={pdf.url} type="application/pdf" className="h-[70vh] w-full">
            <p className="p-4 text-sm text-text-muted">
              Your browser can&apos;t preview this PDF inline.{' '}
              <a href={pdf.url} className="text-brand-amber underline">
                Download it instead
              </a>
              .
            </p>
          </object>
        </div>
      )}
    </div>
  )
}
