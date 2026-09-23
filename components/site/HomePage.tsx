import Link from 'next/link'
import type { Page } from '@/payload-types'
import { extractTextSections, isBoilerplateAddress } from '@/lib/richtext'
import { getIndustryTopLevel, getProductTopLevel } from '@/lib/nav'
import { mediaFileUrl } from '@/lib/media'
import { getSiteSettings } from '@/lib/siteSettings'
import { Reveal } from './Reveal'
import { IndustriesPanel } from './IndustriesPanel'
import { ProductsGrid } from './ProductsGrid'
import { HeroParallax } from './HeroParallax'

/* Icon helpers rendered inline for zero-dependency SVG icons */
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 3L4 7v5c0 5.25 3.5 10.15 8 11 4.5-.85 8-5.75 8-11V7L12 3z" />
    </svg>
  )
}
function IconMap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  )
}
function IconFactory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M2 20V10l6-4v4l6-4v4l6-4v14H2z" />
    </svg>
  )
}

const TRUST_ICONS = [IconClock, IconMap, IconShield, IconFactory]

/* Feature card icons keyed to card index */
function IconGear() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )
}
function IconTruck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" />
      <rect x="9" y="11" width="14" height="10" rx="2" />
      <circle cx="12" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
    </svg>
  )
}
function IconStar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </svg>
  )
}
const FEATURE_ICONS = [IconGear, IconTruck, IconStar, IconCheck]

const KEY_POINTS = [
  '24/7 emergency fitting & call-out service',
  'Full coverage across ROI & Northern Ireland',
  'EU & FDA compliant food-grade belts',
  'European-manufactured, premium-quality belts',
]

export async function HomePage({ page }: { page: Page }) {
  const sections = extractTextSections(page.content).filter((s) => !isBoilerplateAddress(s.body))
  const intro = sections.find((s) => !s.heading)
  const featureCards = sections.filter((s) => s.heading && s.body).slice(0, 4)
  const [industries, products, settings] = await Promise.all([
    getIndustryTopLevel(),
    getProductTopLevel(),
    getSiteSettings(),
  ])
  const hero = settings.homepageHero
  const trustBadges = settings.trustBadges ?? []

  return (
    <div>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">

        {/* Real conveyor belt photo — parallax via client component */}
        <HeroParallax src={mediaFileUrl('cropped-Egg-collection-woven-conveyor-belt-ireland-scaled-1.jpeg')} />

        {/* Atmospheric overlay — semi-transparent so photo shows through */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 120% 70% at 8% 85%, rgba(224,115,15,0.15) 0%, transparent 55%),' +
              'radial-gradient(ellipse 70% 60% at 88% 15%, rgba(22,32,48,0.7) 0%, transparent 50%),' +
              'linear-gradient(168deg, rgba(12,21,32,0.88) 0%, rgba(24,37,58,0.80) 45%, rgba(12,21,32,0.92) 100%)',
          }}
        />

        {/* Technical grid overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.032]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        {/* Decorative gear / circle ring */}
        <svg
          aria-hidden
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          className="absolute -right-20 top-1/4 hidden h-72 w-72 text-white/[0.03] sm:block lg:h-96 lg:w-96"
        >
          <circle cx="100" cy="100" r="90" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="60" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="30" strokeWidth="0.6" />
          <line x1="100" y1="10" x2="100" y2="190" strokeWidth="0.4" />
          <line x1="10" y1="100" x2="190" y2="100" strokeWidth="0.4" />
          <line x1="27" y1="27" x2="173" y2="173" strokeWidth="0.4" />
          <line x1="173" y1="27" x2="27" y2="173" strokeWidth="0.4" />
        </svg>

        {/* Decorative bracket element lower-left */}
        <svg
          aria-hidden
          viewBox="0 0 120 160"
          fill="none"
          stroke="currentColor"
          className="absolute left-8 bottom-16 h-32 w-24 text-white/[0.04] hidden lg:block"
        >
          <path d="M80 10H20C14.5 10 10 14.5 10 20v120c0 5.5 4.5 10 10 10h60" strokeWidth="1" />
          <line x1="10" y1="50" x2="40" y2="50" strokeWidth="0.6" />
          <line x1="10" y1="80" x2="30" y2="80" strokeWidth="0.6" />
          <line x1="10" y1="110" x2="40" y2="110" strokeWidth="0.6" />
        </svg>

        {/* Hero content */}
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-10 pt-12 sm:px-6 sm:pt-14 lg:px-8 lg:pb-14 lg:pt-18">

          {hero?.eyebrow && (
            <Reveal>
              <div className="mb-4 inline-flex items-center gap-2.5">
                <span className="h-px w-6 bg-brand-amber" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-amber">
                  {hero.eyebrow}
                </p>
              </div>
            </Reveal>
          )}

          <Reveal delay={0.05}>
            <h1 className="max-w-4xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {hero?.heading || settings.siteTitle}
            </h1>
          </Reveal>

          {settings.tagline && (
            <Reveal delay={0.12}>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
                {settings.tagline}
              </p>
            </Reveal>
          )}

          <Reveal delay={0.18}>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              {hero?.primaryCtaLabel && (
                <Link
                  href={hero.primaryCtaHref || '/contact-us'}
                  className="group inline-flex w-full items-center justify-center gap-2.5 rounded bg-brand-amber px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-amber/20 transition-all duration-200 hover:bg-brand-amber-light hover:shadow-xl hover:shadow-brand-amber/30 sm:w-auto sm:justify-start"
                >
                  {hero.primaryCtaLabel}
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                  >
                    <path d="M2 7h10M7 2l5 5-5 5" />
                  </svg>
                </Link>
              )}
              {hero?.secondaryCtaLabel && (
                <Link
                  href={hero.secondaryCtaHref || '/industries'}
                  className="inline-flex w-full items-center justify-center gap-2 rounded border border-white/20 px-7 py-3.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:border-white/40 hover:bg-white/8 hover:text-white sm:w-auto sm:justify-start"
                >
                  {hero.secondaryCtaLabel}
                </Link>
              )}
            </div>
          </Reveal>

          {/* Stat row */}
          <Reveal delay={0.24}>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5 border-t border-white/8 pt-5 sm:gap-x-8">
              {[
                { value: '24/7', label: 'Emergency Service' },
                { value: 'ROI & NI', label: 'Full Coverage' },
                { value: 'EU / FDA', label: 'Food-Grade Compliant' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-white">{stat.value}</span>
                  <span className="text-sm text-white/40">{stat.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Cinematic belt strip */}
        <div aria-hidden className="relative h-3 w-full overflow-hidden bg-black/30 shrink-0">
          <div className="absolute inset-y-0 flex w-[200%] animate-[belt-slide_14s_linear_infinite] items-center">
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                className="mx-2 inline-block h-full w-7 shrink-0 skew-x-[-20deg] bg-brand-amber/55"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust badges ─────────────────────────────────────── */}
      {trustBadges.length > 0 && (
        <section className="border-b border-border-subtle bg-muted">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid divide-y divide-border-subtle sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {trustBadges.map((badge, i) => {
                const Icon = TRUST_ICONS[i % TRUST_ICONS.length]
                return (
                  <Reveal key={badge.id ?? badge.label} delay={i * 0.05}>
                    <div className="flex items-start gap-4 px-6 py-5">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded bg-brand-amber/10 text-brand-amber">
                        <Icon />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{badge.label}</p>
                        {badge.detail && (
                          <p className="mt-0.5 text-xs text-text-faint">{badge.detail}</p>
                        )}
                      </div>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── About / Feature cards ────────────────────────────── */}
      {(intro || featureCards.length > 0) && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          {intro && (
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
              {/* Left: text + key points */}
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-amber">
                  Our Expertise
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Ireland&apos;s Conveyor Belt Specialists
                </h2>
                <p className="mt-5 text-base leading-relaxed text-text-muted lg:text-lg">
                  {intro.body}
                </p>
                <ul className="mt-6 space-y-3">
                  {KEY_POINTS.map((point) => (
                    <li key={point} className="flex items-center gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-amber/12 text-brand-amber">
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      </span>
                      <span className="text-sm font-medium text-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              {/* Right: conveyor belt photo */}
              <Reveal delay={0.1}>
                <div className="relative overflow-hidden rounded-xl aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaFileUrl('cropped-Egg-collection-woven-conveyor-belt-ireland-scaled-1.jpeg')}
                    alt="Conveyor belt in food processing facility"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {/* Subtle technical grid overlay */}
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(0,0,0,1) 1px, transparent 1px),' +
                        'linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)',
                      backgroundSize: '32px 32px',
                    }}
                  />
                </div>
              </Reveal>
            </div>
          )}

          {featureCards.length > 0 && (
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
              {featureCards.map((card, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]
                return (
                  <Reveal key={card.heading} delay={i * 0.08}>
                    <div className="group relative flex h-full flex-col rounded-xl border border-border-subtle bg-card p-6 transition-all duration-250 hover:-translate-y-1 hover:border-brand-amber/30 hover:shadow-xl hover:shadow-black/8">
                      {/* Accent top bar on hover */}
                      <span
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 rounded-t-xl bg-brand-amber transition-transform duration-300 group-hover:scale-x-100"
                      />
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-amber/8 text-brand-amber transition-colors duration-200 group-hover:bg-brand-amber group-hover:text-white">
                        <Icon />
                      </div>
                      <p className="text-sm font-bold text-foreground">{card.heading}</p>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">{card.body}</p>
                    </div>
                  </Reveal>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* ─── Industries ───────────────────────────────────────── */}
      <section className="border-y border-border-subtle bg-muted">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
          <Reveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-amber">
                  Sector Experience
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Industries We Supply
                </h2>
              </div>
              <Link
                href="/industries"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors duration-200 hover:text-brand-amber"
              >
                View all sectors
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <path d="M2 6h8M6 2l4 4-4 4" />
                </svg>
              </Link>
            </div>
          </Reveal>

          <div className="mt-10">
            <IndustriesPanel industries={industries.slice(0, 16)} />
          </div>
        </div>
      </section>

      {/* ─── Products ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-amber">
                Belt Range
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Our Conveyor Belts
              </h2>
            </div>
            <Link
              href="/products"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-text-muted transition-colors duration-200 hover:text-brand-amber"
            >
              Browse full range
              <svg
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
              >
                <path d="M2 6h8M6 2l4 4-4 4" />
              </svg>
            </Link>
          </div>
        </Reveal>

        <div className="mt-10">
          <ProductsGrid products={products.slice(0, 12)} />
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-navy">
        {/* Background atmosphere */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 80% at 90% 50%, rgba(224,115,15,0.09) 0%, transparent 60%),' +
              'radial-gradient(ellipse 60% 60% at 10% 50%, rgba(224,115,15,0.05) 0%, transparent 50%)',
          }}
        />

        {/* Technical grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Diagonal bracket decoration */}
        <svg
          aria-hidden
          viewBox="0 0 160 200"
          fill="none"
          stroke="currentColor"
          className="absolute left-0 top-0 h-48 w-40 text-white/[0.04] hidden md:block"
        >
          <path d="M80 10H20C14.5 10 10 14.5 10 20v160c0 5.5 4.5 10 10 10h60" strokeWidth="1" />
        </svg>
        <svg
          aria-hidden
          viewBox="0 0 160 200"
          fill="none"
          stroke="currentColor"
          className="absolute right-0 bottom-0 h-48 w-40 text-white/[0.04] hidden md:block rotate-180"
        >
          <path d="M80 10H20C14.5 10 10 14.5 10 20v160c0 5.5 4.5 10 10 10h60" strokeWidth="1" />
        </svg>

        <Reveal>
          <div className="relative mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8 lg:py-28">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-amber">
              24 / 7 Service
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Need a conveyor belt survey or sample?
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-white/55">
              Emergency call-out service throughout Ireland and Northern Ireland. Tell us your
              application and we&apos;ll propose the right belt.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
              <Link
                href="/contact-us"
                className="group inline-flex items-center justify-center gap-2.5 rounded bg-brand-amber px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-brand-amber/20 transition-all duration-200 hover:bg-brand-amber-light hover:shadow-brand-amber/30"
              >
                Get in Touch
                <svg
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <path d="M2 7h10M7 2l5 5-5 5" />
                </svg>
              </Link>
              <Link
                href="/belt-survey"
                className="inline-flex items-center justify-center gap-2 rounded border border-white/20 px-7 py-3.5 text-sm font-semibold text-white/90 transition-all duration-200 hover:border-white/40 hover:bg-white/8 hover:text-white"
              >
                Request Belt Survey
              </Link>
            </div>
          </div>
        </Reveal>

        {/* Belt strip */}
        <div aria-hidden className="relative h-2 w-full overflow-hidden bg-black/20">
          <div className="absolute inset-y-0 flex w-[200%] animate-[belt-slide_18s_linear_infinite] items-center">
            {Array.from({ length: 32 }).map((_, i) => (
              <span
                key={i}
                className="mx-1.5 inline-block h-full w-6 shrink-0 skew-x-[-20deg] bg-brand-amber/50"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
