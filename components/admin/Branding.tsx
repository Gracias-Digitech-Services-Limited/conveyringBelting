import { mediaFileUrl } from '@/lib/media'

/**
 * Replaces Payload's own logo in the admin panel so the client sees their brand, not the CMS
 * vendor's. `AdminLogo` is the large version on the login screen, `AdminIcon` the small one in
 * the nav/breadcrumbs. Registered in payload.config.ts under admin.components.graphics.
 */
export function AdminLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaFileUrl('PTB-Monogram.png')} alt="" style={{ height: 48, width: 'auto' }} />
      <div style={{ lineHeight: 1.2 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Conveyor Belting Ireland</div>
        <div style={{ fontSize: 13, opacity: 0.6 }}>Website editor</div>
      </div>
    </div>
  )
}

export function AdminIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={mediaFileUrl('PTB-Monogram.png')} alt="Home" style={{ height: 22, width: 'auto' }} />
  )
}
