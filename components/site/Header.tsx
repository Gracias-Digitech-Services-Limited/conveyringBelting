'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { NavNode } from '@/lib/nav'
import { mediaFileUrl } from '@/lib/media'
import { ThemeToggle } from './ThemeToggle'
import { DesktopSubmenu } from './DesktopSubmenu'
import { MobileNavItem } from './MobileNavItem'

export function Header({ nav, siteTitle }: { nav: NavNode[]; siteTitle: string }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 text-white transition-all duration-300 ${
        scrolled
          ? 'bg-brand-navy shadow-2xl shadow-black/40 border-b border-white/5'
          : 'bg-brand-navy/90 backdrop-blur-md border-b border-white/8'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-3 whitespace-nowrap">
          <div className="flex shrink-0 items-center rounded bg-white px-2.5 py-1 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaFileUrl('PTB-Monogram.png')}
              alt="ProTech Belting Ireland"
              className="h-8 w-auto object-contain"
            />
          </div>
          <span className="hidden text-[15px] font-bold tracking-tight text-white/90 transition-colors duration-200 group-hover:text-white sm:block">
            {siteTitle}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden min-w-0 flex-1 items-center gap-0.5 justify-center lg:flex xl:gap-0.5">
          {nav.map((item, i) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return item.children?.length ? (
              <div key={item.href} className="group/top relative">
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-1 rounded-sm px-3 py-2 text-sm font-medium transition-all duration-150 hover:text-white hover:bg-white/8 ${
                    isActive ? 'text-white' : 'text-white/75'
                  }`}
                >
                  {item.text}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-px bg-brand-amber rounded-full" />
                  )}
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5 opacity-50 transition-transform duration-200 group-hover/top:rotate-180"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
                <div
                  className={`invisible absolute top-full z-50 mt-1 translate-y-2 opacity-0 shadow-2xl shadow-black/30 transition-all duration-200 rounded-lg border border-border-subtle bg-card text-foreground group-hover/top:visible group-hover/top:translate-y-0 group-hover/top:opacity-100 group-focus-within/top:visible group-focus-within/top:translate-y-0 group-focus-within/top:opacity-100 ${
                    i > nav.length / 2 ? 'right-0' : 'left-0'
                  }`}
                >
                  <DesktopSubmenu items={item.children} depth={1} />
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-sm px-3 py-2 text-sm font-medium transition-all duration-150 hover:text-white hover:bg-white/8 ${
                  isActive ? 'text-white' : 'text-white/75'
                }`}
              >
                {item.text}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-px bg-brand-amber rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          <Link
            href="/contact-us"
            className="hidden shrink-0 items-center gap-2 rounded bg-brand-amber px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-amber-light hover:shadow-lg hover:shadow-brand-amber/25 lg:inline-flex"
          >
            Get a Quote
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

          <button
            type="button"
            aria-label="Toggle menu"
            className="inline-flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <motion.span
              animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 7 : 0 }}
              transition={{ duration: 0.2 }}
              className="h-0.5 w-5 rounded-full bg-white"
            />
            <motion.span
              animate={{ opacity: mobileOpen ? 0 : 1, scaleX: mobileOpen ? 0 : 1 }}
              transition={{ duration: 0.15 }}
              className="h-0.5 w-5 rounded-full bg-white"
            />
            <motion.span
              animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -7 : 0 }}
              transition={{ duration: 0.2 }}
              className="h-0.5 w-5 rounded-full bg-white"
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-white/10 bg-brand-navy lg:hidden"
          >
            <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">
              <nav className="pt-2">
                {nav.map((item) => (
                  <div key={item.href} className="border-b border-white/8 py-0.5">
                    <MobileNavItem item={item} depth={0} onNavigate={() => setMobileOpen(false)} />
                  </div>
                ))}
              </nav>
              <div className="mt-5">
                <Link
                  href="/contact-us"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded bg-brand-amber px-4 py-3 text-sm font-semibold text-white hover:bg-brand-amber-light transition-colors duration-200"
                >
                  Get a Quote
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M2 7h10M7 2l5 5-5 5" />
                  </svg>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
