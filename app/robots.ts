import type { MetadataRoute } from 'next'
import { SERVER_URL } from '@/lib/serverUrl'

export default function robots(): MetadataRoute.Robots {
  const base = SERVER_URL ?? 'https://conveyorbelting.ie'

  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
