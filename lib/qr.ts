import type { Options } from 'qr-code-styling'

export type QrDotsType = 'dots' | 'rounded' | 'classy' | 'square'

export type CardQrStyle = {
  color?: string | null
  backgroundColor?: string | null
  dotsType?: QrDotsType | null
}

/**
 * The one definition of how a business-card QR code looks - shared by the public card page
 * (components/site/QrCanvas.tsx) and the admin's card editor (components/admin/CardQr.tsx), so
 * the code an admin downloads and prints is exactly the one on the card page.
 */
export function cardQrOptions({
  data,
  style,
  logoUrl,
  size = 240,
}: {
  data: string
  style?: CardQrStyle | null
  logoUrl?: string
  size?: number
}): Options {
  const color = style?.color || '#0f172a'
  return {
    width: size,
    height: size,
    data,
    image: logoUrl,
    dotsOptions: { color, type: style?.dotsType || 'dots' },
    backgroundOptions: { color: style?.backgroundColor || '#ffffff' },
    cornersSquareOptions: { color, type: 'extra-rounded' },
    imageOptions: { crossOrigin: 'anonymous', margin: 6, imageSize: 0.35 },
  }
}
