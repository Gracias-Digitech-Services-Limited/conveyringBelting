import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'

/**
 * Target of the admin's "Preview" button (collections/Pages.ts `admin.preview`). Turns on Next's
 * Draft Mode - which makes the page route show the latest unpublished draft - but only for
 * someone logged in to the admin; anyone else gets a 401. Then sends them to the page itself.
 */
export async function GET(request: Request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return new Response('Log in to the website editor to preview unpublished pages.', { status: 401 })
  }

  const slug = new URL(request.url).searchParams.get('slug') ?? ''
  const { docs } = await payload.find({
    collection: 'pages',
    draft: true,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const page = docs[0]
  if (!page) return new Response('Page not found.', { status: 404 })

  ;(await draftMode()).enable()
  // Built from the stored slug, never the raw query param, so this can't redirect off-site.
  redirect(page.slug === 'home' ? '/' : `/${page.slug.replace(/^\/+/, '')}`)
}
