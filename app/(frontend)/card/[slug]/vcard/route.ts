import { NextResponse } from 'next/server'
import { getStaffCardBySlug } from '@/lib/staffCards'
import { buildVCard } from '@/lib/vcard'

type Args = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: Args) {
  const { slug } = await params
  const card = await getStaffCardBySlug(slug)

  if (!card) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const vcf = buildVCard({
    name: card.name,
    title: card.title,
    org: card.org,
    phone: card.phone,
    email: card.email,
    address: card.address,
    website: card.website,
  })

  return new NextResponse(vcf, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${card.slug}.vcf"`,
    },
  })
}
