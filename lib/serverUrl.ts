/**
 * The site's public origin from NEXT_PUBLIC_SERVER_URL, with any trailing slash removed.
 *
 * The slash matters: Payload only trusts the login cookie on requests whose Origin header
 * exactly matches serverURL, and browsers send the origin without a trailing slash - so
 * "https://example.com/" silently turns every admin save/upload into "You are not allowed to
 * perform this action". It also avoids "//sitemap.xml"-style double slashes in built URLs.
 */
export const SERVER_URL: string | undefined =
  process.env.NEXT_PUBLIC_SERVER_URL?.trim().replace(/\/+$/, '') || undefined
