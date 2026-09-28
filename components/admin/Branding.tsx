import { mediaFileUrl } from '@/lib/media'

/**
 * Replaces Payload's own logo in the admin panel so the client sees their brand, not the CMS
 * vendor's. `AdminLogo` is the large version on the login screen, `AdminIcon` the small one in
 * the nav/breadcrumbs. Registered in payload.config.ts under admin.components.graphics.
 */
export function AdminLogo() {
  return (
    // Stacked rather than side by side: the wordmark is ~5:1, so a row layout squeezed the
    // site name into wrapping onto two lines.
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaFileUrl('PTB-Monogram.png')} alt="" style={{ height: 56, width: 'auto', maxWidth: '100%' }} />
      <div style={{ lineHeight: 1.3 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Conveyor Belting Ireland</div>
        <div style={{ fontSize: 13, opacity: 0.6 }}>Website editor</div>
      </div>
    </div>
  )
}

export function AdminIcon() {
  return (
    // Sized in app/(payload)/custom.css: fills the breadcrumb's fixed-height home slot, with the
    // width following the wordmark's ~5:1 shape instead of Payload's square icon box.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={mediaFileUrl('PTB-Monogram.png')} alt="Home" />
  )
}
