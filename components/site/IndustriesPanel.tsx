'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { NavNode } from '@/lib/nav'

/**
 * Real photos exist only for the industries that have a genuine dedicated banner in the media
 * library (confirmed by filename + alt text, e.g. "Bakery_Banner1.jpg" / alt "Conveyor Belting
 * Bakery"). The rest fall back to HeroFallback rather than reusing an unrelated stock photo -
 * the live site's own per-page banner turned out to be randomised on every load, so there's no
 * real per-industry image to copy for the remainder.
 */
const INDUSTRY_IMAGES: Record<string, string> = {
  '/airport-conveyor-belts': '/api/media/file/Airport_banner.jpeg',
  '/atex-approved-conveyor-belts': '/api/media/file/ATEX-Banner-1-scaled.jpg',
  '/bakery': '/api/media/file/Bakery_Banner1.jpg',
  '/bucket-elevators': '/api/media/file/bucket-elevator-banner.jpg',
  '/ceramic': '/api/media/file/Ceramic_Banner.jpg',
  '/chicken-manure-conveyor-belt': '/api/media/file/Chicken-Manure-Conveyor-Belt-scaled.jpg',
  '/corrugated': '/api/media/file/Corrigated_Banner.jpg',
  '/dairy-industry-conveyor-belting': '/api/media/file/Dairy_437-scaled.jpg',
  '/processing': '/api/media/file/Soap_banner.jpg',
  '/fruit-veg': '/api/media/file/Fruit_veg_banner2.jpg',
  '/logistics': '/api/media/file/logistics-banner.jpg',
  '/sugar': '/api/media/file/Sugar_banner.jpg',
  '/waste': '/api/media/file/Waste_Banner.jpg',
}

function getImage(href: string): string | null {
  return INDUSTRY_IMAGES[href] ?? null
}

function HeroFallback({ text }: { text: string }) {
  const initials = text
    .split(/[\s–—-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="absolute inset-0 bg-brand-navy">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.12]"
        style={{
          background:
            'repeating-linear-gradient(55deg, transparent, transparent 16px, rgba(224,115,15,0.5) 16px, rgba(224,115,15,0.5) 20px)',
        }}
      />
      <span className="absolute bottom-4 right-4 text-5xl font-black tracking-tighter text-white/[0.12] select-none">
        {initials}
      </span>
    </div>
  )
}

function cleanName(name: string): string {
  return name
    .replace(/\s*[–—-]\s*Conveyor Belting.*$/i, '')
    .replace(/\s*Conveyor Belt\s*$/i, '')
    .trim()
}

export function IndustriesPanel({ industries }: { industries: NavNode[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = industries[activeIndex]

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:gap-12">
      {/* Featured image — top on mobile (order-1), left on desktop (order-1 lg) */}
      <div className="relative order-1 overflow-hidden rounded-xl bg-iron-900 lg:sticky lg:top-24 lg:self-start">
        <div className="relative aspect-[16/9]">
          <AnimatePresence mode="wait">
            {(() => {
              const img = getImage(active.href)
              return img ? (
                <motion.img
                  key={active.href}
                  src={img}
                  alt={cleanName(active.text)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : (
                <motion.div
                  key={active.href}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0"
                >
                  <HeroFallback text={cleanName(active.text)} />
                </motion.div>
              )
            })()}
          </AnimatePresence>

          {/* Caption overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-10">
            <AnimatePresence mode="wait">
              <motion.p
                key={active.href + '-caption'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.22, delay: 0.1 }}
                className="text-sm font-semibold text-white"
              >
                {cleanName(active.text)}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Selector list — below image on mobile (order-2), right on desktop */}
      <div className="order-2">
        <ul className="divide-y divide-border-subtle">
          {industries.map((item, i) => {
            const isActive = i === activeIndex
            return (
              <li key={item.href}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`group flex w-full items-center gap-3 py-3 text-left transition-colors duration-150 ${
                    isActive ? 'text-foreground' : 'text-text-muted hover:text-foreground'
                  }`}
                >
                  <span
                    className={`h-4 w-0.5 shrink-0 rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-amber'
                        : 'bg-transparent group-hover:bg-brand-amber/40'
                    }`}
                  />
                  <span className="flex-1 text-sm font-medium leading-snug">
                    {cleanName(item.text)}
                  </span>
                  <Link
                    href={item.href}
                    onClick={(e) => e.stopPropagation()}
                    tabIndex={isActive ? 0 : -1}
                    className={`shrink-0 text-xs font-semibold text-brand-amber transition-all duration-150 hover:text-brand-amber-light ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                    }`}
                  >
                    View&nbsp;→
                  </Link>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
