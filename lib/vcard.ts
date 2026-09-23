export interface VCardInput {
  name: string
  title?: string | null
  org?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  website?: string | null
}

function escapeVCard(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

/** Builds a vCard 3.0 (.vcf) file body - the widely-supported version for iOS/Android/Outlook contact import. */
export function buildVCard(card: VCardInput): string {
  const [firstName, ...rest] = card.name.trim().split(/\s+/)
  const lastName = rest.join(' ')

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`,
    `FN:${escapeVCard(card.name)}`,
  ]

  if (card.org) lines.push(`ORG:${escapeVCard(card.org)}`)
  if (card.title) lines.push(`TITLE:${escapeVCard(card.title)}`)
  if (card.phone) lines.push(`TEL;TYPE=CELL,VOICE:${escapeVCard(card.phone)}`)
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(card.email)}`)
  if (card.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(card.address)};;;;`)
  if (card.website) lines.push(`URL:${escapeVCard(card.website)}`)

  lines.push('END:VCARD')
  return lines.join('\r\n')
}
