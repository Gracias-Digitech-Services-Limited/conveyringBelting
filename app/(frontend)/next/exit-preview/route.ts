import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/** Turns Draft Mode back off (the "Exit preview" link in components/site/PreviewBanner.tsx). */
export async function GET(request: Request) {
  ;(await draftMode()).disable()
  const path = new URL(request.url).searchParams.get('path') ?? '/'
  // Same-site paths only - "//evil.com" or "https://..." fall back to the homepage.
  redirect(path.startsWith('/') && !path.startsWith('//') ? path : '/')
}
