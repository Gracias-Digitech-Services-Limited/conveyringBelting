'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { NavNode } from '@/lib/nav'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function IndustriesGrid({ industries }: { industries: NavNode[] }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-3 xl:grid-cols-4"
    >
      {industries.map((item) => (
        <motion.div key={item.href} variants={itemVariants}>
          <Link
            href={item.href}
            className="group relative block overflow-hidden rounded-lg border border-border-subtle bg-card px-5 py-4 transition-all duration-250 hover:border-brand-amber/30 hover:bg-brand-navy hover:shadow-xl hover:shadow-brand-navy/15"
          >
            {/* Accent bottom line */}
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-0.5 w-0 rounded-full bg-brand-amber transition-all duration-300 group-hover:w-full"
            />

            <p className="text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-white">
              {item.text}
            </p>

            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-amber opacity-0 transition-all duration-200 group-hover:opacity-100">
              Explore
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
            </span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
