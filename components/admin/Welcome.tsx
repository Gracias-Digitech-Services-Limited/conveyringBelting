import type { ServerProps } from 'payload'

/**
 * Shown above the dashboard's collection cards: a plain-language "what do you want to do?"
 * panel so the client can jump straight to the common edits without learning the CMS layout.
 */
const QUICK_LINKS = [
  { href: '/admin/collections/pages', label: 'Edit a page', detail: 'Change text, images and videos' },
  { href: '/admin/collections/media/create', label: 'Upload an image or PDF', detail: 'Add to the media library' },
  { href: '/admin/collections/contact-submissions', label: 'Read enquiries', detail: 'Messages from the contact form' },
  { href: '/admin/globals/site-settings', label: 'Homepage & contact details', detail: 'Hero text, phone, address' },
]

export function Welcome({ user }: ServerProps) {
  const name = (user as { name?: string } | undefined)?.name
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ margin: '0 0 4px' }}>{name ? `Welcome back, ${name}` : 'Welcome back'}</h2>
      <p style={{ margin: '0 0 16px', opacity: 0.7 }}>What would you like to do today?</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {QUICK_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={{
              display: 'block',
              padding: '14px 16px',
              borderRadius: 6,
              border: '1px solid var(--theme-elevation-150)',
              background: 'var(--theme-elevation-50)',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <strong style={{ display: 'block', marginBottom: 2 }}>{link.label}</strong>
            <span style={{ fontSize: 13, opacity: 0.7 }}>{link.detail}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
