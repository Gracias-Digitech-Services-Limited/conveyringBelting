'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type QRCodeStyling from 'qr-code-styling'
import { Button, useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { cardQrOptions, type CardQrStyle, type QrDotsType } from '@/lib/qr'

/** Printable size for downloads - the on-screen preview is smaller. */
const DOWNLOAD_SIZE = 1200

/**
 * Sidebar panel on a Business Card: the card page's QR code, ready to download and print.
 *
 * It encodes the *saved* card address (not what's currently typed), so a code is never handed
 * out for a page that doesn't exist yet. Colour/style changes preview live before saving.
 */
export function CardQrField() {
  const { id, savedDocumentData } = useDocumentInfo()
  const { config } = useConfig()
  const slug = typeof savedDocumentData?.slug === 'string' ? savedDocumentData.slug : ''

  const color = useFormFields(([fields]) => fields['qrStyle.color']?.value) as string | undefined
  const backgroundColor = useFormFields(([fields]) => fields['qrStyle.backgroundColor']?.value) as
    | string
    | undefined
  const dotsType = useFormFields(([fields]) => fields['qrStyle.dotsType']?.value) as QrDotsType | undefined
  const logo = useFormFields(([fields]) => fields.logo?.value) as string | { id: string } | null | undefined
  const logoId = typeof logo === 'string' ? logo : logo?.id

  // Falls back to the current site when no server URL is configured (e.g. local dev). Read via
  // useSyncExternalStore so the server render ('') and hydration agree.
  const browserOrigin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => '',
  )
  const origin = config.serverURL || browserOrigin

  const cardUrl = slug && origin ? `${origin}/card/${slug}` : ''
  const style: CardQrStyle = { color, backgroundColor, dotsType }
  const logoUrl = logoId ? `/next/media/${logoId}` : undefined

  const previewRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!cardUrl) return
    let cancelled = false
    import('qr-code-styling').then(({ default: QRCodeStyling }) => {
      if (cancelled || !previewRef.current) return
      previewRef.current.innerHTML = ''
      new QRCodeStyling({ ...cardQrOptions({ data: cardUrl, style, logoUrl, size: 200 }), type: 'svg' }).append(
        previewRef.current,
      )
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- style fields listed individually
  }, [cardUrl, color, backgroundColor, dotsType, logoUrl])

  async function download(extension: 'png' | 'svg') {
    const { default: QRCodeStyling } = await import('qr-code-styling')
    const qr: QRCodeStyling = new QRCodeStyling({
      ...cardQrOptions({ data: cardUrl, style, logoUrl, size: DOWNLOAD_SIZE }),
      type: 'svg',
    })
    await qr.download({ name: `${slug}-qr-code`, extension })
  }

  async function copyLink() {
    await navigator.clipboard.writeText(cardUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="field-type" style={{ marginBottom: 'var(--base)' }}>
      <span className="field-label" style={{ display: 'block', marginBottom: 8 }}>
        QR code
      </span>
      {!id || !cardUrl ? (
        <div
          style={{
            padding: 16,
            borderRadius: 4,
            border: '1px dashed var(--theme-elevation-250)',
            fontSize: 13,
            opacity: 0.8,
          }}
        >
          Save the card to create its QR code.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
          {/* Always white behind the code - scanners need the contrast, whatever the admin theme. */}
          <div
            ref={previewRef}
            data-testid="card-qr-preview"
            style={{ background: '#fff', padding: 8, borderRadius: 4, lineHeight: 0 }}
          />
          <a href={cardUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, wordBreak: 'break-all' }}>
            {cardUrl}
          </a>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Button buttonStyle="secondary" size="small" margin={false} onClick={() => download('png')}>
              Download PNG
            </Button>
            <Button buttonStyle="secondary" size="small" margin={false} onClick={() => download('svg')}>
              Download SVG
            </Button>
            <Button buttonStyle="secondary" size="small" margin={false} onClick={copyLink}>
              {copied ? 'Copied!' : 'Copy link'}
            </Button>
          </div>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            PNG for everyday use, SVG for professional printing. Style it under &quot;QR Code Style&quot; below.
          </span>
        </div>
      )}
    </div>
  )
}
