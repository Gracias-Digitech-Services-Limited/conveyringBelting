'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      // Deliberately mount-triggered (`animate`), not `whileInView`: this content must never
      // depend on IntersectionObserver actually firing (older browsers, some crawlers, and
      // extensions/privacy tools can suppress it) - a permanently invisible hero is far worse
      // than losing the "only animate once truly scrolled into view" refinement.
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
