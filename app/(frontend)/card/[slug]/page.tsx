import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getStaffCardBySlug, mediaUrl } from '@/lib/staffCards'
import { QrCanvas } from '@/components/site/QrCanvas'

type Args = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const card = await getStaffCardBySlug(slug)
  if (!card) return {}
  return { title: `${card.name} - Digital Business Card` }
}

export default async function StaffCardPage({ params }: Args) {
  const { slug } = await params
  const card = await getStaffCardBySlug(slug)
  if (!card) notFound()

  const photoUrl = mediaUrl(card.photo)
  const logoUrl = mediaUrl(card.logo)
  const vCardUrl = `/card/${card.slug}/vcard`
  const cardPageUrl = `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/card/${card.slug}`

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={card.name}
          width={120}
          height={120}
          className="h-28 w-28 rounded-full object-cover shadow-md"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-navy text-2xl font-bold text-white">
          {card.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </div>
      )}

      <h1 className="mt-4 text-2xl font-bold text-foreground">{card.name}</h1>
      {card.title && <p className="text-text-muted">{card.title}</p>}
      {card.org && <p className="text-sm text-text-faint">{card.org}</p>}

      <div className="mt-6 w-full space-y-2 text-left text-sm">
        {card.phone && (
          <a
            href={`tel:${card.phone}`}
            className="block rounded-md border border-border-subtle px-4 py-2.5 text-foreground hover:bg-muted"
          >
            📞 {card.phone}
          </a>
        )}
        {card.email && (
          <a
            href={`mailto:${card.email}`}
            className="block rounded-md border border-border-subtle px-4 py-2.5 text-foreground hover:bg-muted"
          >
            ✉️ {card.email}
          </a>
        )}
        {card.address && (
          <p className="rounded-md border border-border-subtle px-4 py-2.5 text-text-muted">
            📍 {card.address}
          </p>
        )}
        {card.website && (
          <a
            href={card.website}
            target="_blank"
            rel="noreferrer"
            className="block rounded-md border border-border-subtle px-4 py-2.5 text-foreground hover:bg-muted"
          >
            🌐 {card.website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>

      <a
        href={vCardUrl}
        download
        className="mt-6 w-full rounded-md bg-brand-amber px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-amber-light"
      >
        Save to Contacts
      </a>

      <div className="mt-8">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-faint">
          Scan to save
        </p>
        <QrCanvas
          data={cardPageUrl}
          color={card.qrStyle?.color ?? undefined}
          backgroundColor={card.qrStyle?.backgroundColor ?? undefined}
          dotsType={(card.qrStyle?.dotsType as 'dots' | 'rounded' | 'classy' | 'square') ?? 'dots'}
          logoUrl={logoUrl}
          fileName={`${card.slug}-qr`}
        />
      </div>
    </div>
  )
}
