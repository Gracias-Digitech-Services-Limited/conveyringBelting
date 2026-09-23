import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import '../globals.css'
import { Header } from '@/components/site/Header'
import { Footer } from '@/components/site/Footer'
import { BackToTop } from '@/components/site/BackToTop'
import { getHeaderNav } from '@/lib/nav'
import { getSiteSettings } from '@/lib/siteSettings'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  return {
    title: { default: settings.siteTitle, template: `%s | ${settings.siteTitle}` },
    description: settings.tagline ?? undefined,
    metadataBase: process.env.NEXT_PUBLIC_SERVER_URL
      ? new URL(process.env.NEXT_PUBLIC_SERVER_URL)
      : undefined,
  }
}

// Runs before hydration so the page never flashes the wrong theme: reads the saved
// preference (falling back to OS preference) and applies the `.dark` class immediately.
const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default async function FrontendLayout({ children }: { children: ReactNode }) {
  const [nav, settings] = await Promise.all([getHeaderNav(), getSiteSettings()])

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The no-flash script below adds `.dark` to this element before hydration, based on
      // localStorage/OS preference the server can't know about - that's an intentional,
      // expected mismatch (the standard pattern for SSR + class-based dark mode), not a bug.
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Script id="no-flash-theme" strategy="beforeInteractive">
          {NO_FLASH_THEME_SCRIPT}
        </Script>
        <Header nav={nav} siteTitle={settings.siteTitle} />
        <main className="flex-1">{children}</main>
        <Footer siteTitle={settings.siteTitle} tagline={settings.tagline ?? undefined} contact={settings.contact} />
        <BackToTop />
      </body>
    </html>
  )
}
