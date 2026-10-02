import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'
import { buildLegacyRedirects } from './lib/legacyRedirects'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'conveyorbelting.ie' },
      { protocol: 'https', hostname: '*.s3.*.amazonaws.com' },
      // Cloudflare R2's public dev domain (media is served straight from here, not proxied -
      // see payload.config.ts's generateFileURL) - wildcarded since the `pub-<hash>` subdomain
      // is bucket-specific and would change if the R2 bucket is ever recreated.
      { protocol: 'https', hostname: '*.r2.dev' },
      // AWS media: CloudFront's own address while testing, then media.conveyorbelting.ie.
      { protocol: 'https', hostname: '*.cloudfront.net' },
      { protocol: 'https', hostname: 'media.conveyorbelting.ie' },
    ],
  },
  async redirects() {
    return buildLegacyRedirects()
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
