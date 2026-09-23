import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'

// Query the DB at request time, not build time - the build step (e.g. in CI) may not have
// network access to MongoDB, and this keeps the sitemap in sync without a rebuild+redeploy.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://conveyorbelting.ie'
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'pages',
    where: { status: { equals: 'publish' } },
    limit: 0,
    depth: 0,
  })

  return docs.map((page) => ({
    url: page.slug === 'home' ? base : `${base}/${page.slug}`,
    lastModified: page.migration?.modifiedAt ?? page.updatedAt,
  }))
}
