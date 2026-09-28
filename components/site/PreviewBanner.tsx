'use client'

import { usePathname } from 'next/navigation'

/**
 * Pinned notice shown while an editor is previewing unpublished changes (Draft Mode, see
 * app/(frontend)/next/preview/route.ts), so a preview is never mistaken for the live site.
 */
export function PreviewBanner() {
  const pathname = usePathname()
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[60] flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-brand-amber px-4 py-2.5 text-sm font-medium text-white shadow-lg"
    >
      <span>Preview - you&apos;re seeing unpublished changes. Visitors still see the published version.</span>
      <a
        href={`/next/exit-preview?path=${encodeURIComponent(pathname)}`}
        className="rounded bg-white/20 px-3 py-1 font-semibold hover:bg-white/30"
      >
        Exit preview
      </a>
    </div>
  )
}
