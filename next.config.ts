import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'
import { buildLegacyRedirects } from './lib/legacyRedirects'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'conveyorbelting.ie' },
      { protocol: 'https', hostname: '*.s3.*.amazonaws.com' },
    ],
  },
  async redirects() {
    return buildLegacyRedirects()
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
