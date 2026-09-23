'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { NavNode } from '@/lib/nav'

const FOOD_IMG = '/api/media/file/cropped-Egg-collection-woven-conveyor-belt-ireland-scaled-1.jpeg'
const MANURE_IMG = '/api/media/file/Chicken-Manure-Conveyor-Belt-scaled.jpg'
const INDUSTRIAL_IMG = '/api/media/file/Depanner-Belt-Metal-Detectable-Suction-Cups-scaled.jpg'

const FOOD_KEYWORDS = ['bakery', 'dairy', 'egg', 'fruit', 'meat', 'snack', 'sugar', 'confection', 'food', 'pharma', 'poultry', 'fish', 'biscuit']
const MANURE_KEYWORDS = ['manure', 'chicken manure']

function getImage(text: string): string {
  const lower = text.toLowerCase()
  if (MANURE_KEYWORDS.some((k) => lower.includes(k))) return MANURE_IMG
  if (FOOD_KEYWORDS.some((k) => lower.includes(k))) return FOOD_IMG
  return INDUSTRIAL_IMG
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
        <div className="relative aspect-[16/10] lg:aspect-[4/3]">
          <AnimatePresence mode="wait">
            <motion.img
              key={active.href}
              src={getImage(active.text)}
              alt={cleanName(active.text)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 h-full w-full object-cover"
            />
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
