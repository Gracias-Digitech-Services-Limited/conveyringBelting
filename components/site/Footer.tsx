import Link from 'next/link'
import type { SiteSetting } from '@/payload-types'

export function Footer({
  siteTitle,
  tagline,
  contact,
}: {
  siteTitle: string
  tagline?: string
  contact?: SiteSetting['contact']
}) {
  const year = new Date().getFullYear()
  const phone = contact?.phone
  const email = contact?.email
  const address = contact?.address

  return (
    <footer className="border-t border-iron-800 bg-brand-navy text-iron-300">
      {/* Top CTA strip */}
      <div className="border-b border-iron-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-base font-semibold text-white">
              Need a belt survey or emergency call-out?
            </p>
            <p className="mt-0.5 text-sm text-iron-400">
              24/7 service across Ireland &amp; Northern Ireland.
            </p>
          </div>
          <Link
            href="/contact-us"
            className="inline-flex shrink-0 items-center gap-2 rounded bg-brand-amber px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-amber-light hover:shadow-lg hover:shadow-brand-amber/20"
          >
            Contact Us
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M2 7h10M7 2l5 5-5 5" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Main columns */}
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 sm:py-14 lg:grid-cols-4 lg:px-8">

        {/* Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="flex shrink-0 items-center rounded bg-white px-2.5 py-1 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/api/media/file/PTB-Logo-png.png"
                alt="PTB Innovation Ltd"
                className="h-6 w-auto object-contain"
              />
            </div>
            <p className="text-[15px] font-bold text-white">{siteTitle}</p>
          </div>
          {tagline && (
            <p className="mt-3 text-sm leading-relaxed text-iron-400">{tagline}</p>
          )}
          <div className="mt-5 h-px w-12 rounded-full bg-brand-amber" />
        </div>

        {/* Products */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-iron-500">
            Products
          </p>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: 'PVC Conveyor Belting', href: '/pvc' },
              { label: 'PU Conveyor Belting', href: '/pu' },
              { label: 'Modular Conveyor Belts', href: '/modular' },
              { label: 'Timing Belts', href: '/timing' },
              { label: 'Silicone Belts', href: '/silicone' },
              { label: 'Belt Accessories', href: '/belt-accessories' },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="group inline-flex flex-col">
                  <span className="text-iron-400 transition-colors duration-150 group-hover:text-brand-amber">
                    {link.label}
                  </span>
                  <span className="h-px w-0 bg-brand-amber transition-all duration-200 group-hover:w-full" />
                </Link>
              </li>
            ))}
            <li>
              <Link href="/products" className="inline-flex items-center gap-1 text-brand-amber text-xs font-medium hover:text-brand-amber-light transition-colors mt-1">
                View all products
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                  <path d="M2 5h6M5 2l3 3-3 3" />
                </svg>
              </Link>
            </li>
          </ul>
        </div>

        {/* Industries */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-iron-500">
            Industries
          </p>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: 'Food Processing', href: '/meat-industry' },
              { label: 'Bakery', href: '/bakery' },
              { label: 'Dairy', href: '/dairy-industry-conveyor-belting' },
              { label: 'Airports / Logistics', href: '/airport-conveyor-belts' },
              { label: 'Pharmaceutical', href: '/pharmaceutical-conveyor-belts' },
              { label: 'Waste & Recycling', href: '/waste' },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="group inline-flex flex-col">
                  <span className="text-iron-400 transition-colors duration-150 group-hover:text-brand-amber">
                    {link.label}
                  </span>
                  <span className="h-px w-0 bg-brand-amber transition-all duration-200 group-hover:w-full" />
                </Link>
              </li>
            ))}
            <li>
              <Link href="/industries" className="inline-flex items-center gap-1 text-brand-amber text-xs font-medium hover:text-brand-amber-light transition-colors mt-1">
                View all industries
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
                  <path d="M2 5h6M5 2l3 3-3 3" />
                </svg>
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-iron-500">
            Contact
          </p>
          <ul className="space-y-3 text-sm">
            {phone && (
              <li>
                <a
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="flex items-start gap-2 text-iron-400 transition-colors duration-150 hover:text-white"
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" clipRule="evenodd" />
                  </svg>
                  {phone}
                </a>
              </li>
            )}
            {email && (
              <li>
                <a
                  href={`mailto:${email}`}
                  className="flex items-start gap-2 text-iron-400 transition-colors duration-150 hover:text-white"
                >
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                  </svg>
                  {email}
                </a>
              </li>
            )}
            {address && (
              <li>
                <div className="flex items-start gap-2 text-iron-400">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-brand-amber" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 15.01 17 12.42 17 9A7 7 0 103 9c0 3.42 1.698 6.01 3.354 7.585.829.799 1.654 1.38 2.274 1.765.31.193.57.337.757.433a5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" clipRule="evenodd" />
                  </svg>
                  <span className="whitespace-pre-line leading-relaxed">{address}</span>
                </div>
              </li>
            )}
          </ul>

          <div className="mt-6 space-y-2 text-sm">
            <Link href="/about-us" className="group inline-flex flex-col">
              <span className="text-iron-400 transition-colors duration-150 group-hover:text-brand-amber">About Us</span>
              <span className="h-px w-0 bg-brand-amber transition-all duration-200 group-hover:w-full" />
            </Link>
            <br />
            <Link href="/terms-and-conditions" className="group inline-flex flex-col">
              <span className="text-iron-400 transition-colors duration-150 group-hover:text-brand-amber">Terms &amp; Conditions</span>
              <span className="h-px w-0 bg-brand-amber transition-all duration-200 group-hover:w-full" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-iron-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-iron-600 sm:flex-row sm:px-6 lg:px-8">
          <p>© {year} {siteTitle}. All rights reserved.</p>
          <div className="flex items-center gap-1 text-iron-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-amber/60" />
            <span>Ireland &amp; Northern Ireland</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
