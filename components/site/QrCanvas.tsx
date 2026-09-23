'use client'

import { useEffect, useRef, useState } from 'react'
import type QRCodeStyling from 'qr-code-styling'

export function QrCanvas({
  data,
  color = '#0f172a',
  backgroundColor = '#ffffff',
  dotsType = 'dots',
  logoUrl,
  fileName,
}: {
  data: string
  color?: string
  backgroundColor?: string
  dotsType?: 'dots' | 'rounded' | 'classy' | 'square'
  logoUrl?: string
  fileName?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    import('qr-code-styling').then(({ default: QRCodeStyling }) => {
      if (cancelled || !containerRef.current) return
      containerRef.current.innerHTML = ''
      qrRef.current = new QRCodeStyling({
        width: 240,
        height: 240,
        data,
        image: logoUrl,
        dotsOptions: { color, type: dotsType },
        backgroundOptions: { color: backgroundColor },
        cornersSquareOptions: { color, type: 'extra-rounded' },
        imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
      })
      qrRef.current.append(containerRef.current)
      setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [data, color, backgroundColor, dotsType, logoUrl])

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Deliberately fixed white, not theme-aware - QR scanners need reliable light/dark contrast. */}
      <div ref={containerRef} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700" />
      <button
        type="button"
        disabled={!ready}
        onClick={() => qrRef.current?.download({ name: fileName ?? 'qr-code', extension: 'png' })}
        className="text-sm font-medium text-brand-amber hover:underline disabled:opacity-50"
      >
        Download QR code
      </button>
    </div>
  )
}
