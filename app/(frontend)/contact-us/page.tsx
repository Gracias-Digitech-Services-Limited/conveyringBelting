import type { Metadata } from 'next'
import { ContactForm } from '@/components/site/ContactForm'
import { getSiteSettings } from '@/lib/siteSettings'

// Render at request time rather than prerendering at build - the build step (e.g. on Vercel,
// if DATABASE_URI isn't configured there) may not have DB access, which would otherwise fail
// the whole deploy. See sitemap.ts for the same fix. Site Settings are admin-editable and
// should show up immediately without a rebuild anyway.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with PTB Innovation Ltd for a conveyor belt survey, sample or quote.',
}

export default async function ContactPage() {
  const settings = await getSiteSettings()
  const contact = settings.contact

  return (
    <article>
      <div className="border-b border-border-subtle bg-muted">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Contact Us
          </h1>
          {settings.contactPageIntro && (
            <p className="mt-2 max-w-2xl text-text-muted">{settings.contactPageIntro}</p>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="lg:col-span-2">
          <ContactForm />
        </div>
        <aside className="space-y-4 text-sm text-text-muted">
          <div>
            <p className="font-semibold text-foreground">{settings.siteTitle}</p>
            {contact?.address && <p className="whitespace-pre-line">{contact.address}</p>}
          </div>
          {contact?.phone && (
            <div>
              <p className="font-semibold text-foreground">Phone</p>
              <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="hover:text-brand-amber">
                {contact.phone}
              </a>
            </div>
          )}
          {contact?.email && (
            <div>
              <p className="font-semibold text-foreground">Email</p>
              <a href={`mailto:${contact.email}`} className="hover:text-brand-amber">
                {contact.email}
              </a>
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}
