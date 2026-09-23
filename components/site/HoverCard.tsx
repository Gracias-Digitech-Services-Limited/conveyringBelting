'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function HoverCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 340, damping: 22 }}
      className={`group transition-shadow duration-200 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/40 ${className ?? ''}`}
    >
      {children}
    </motion.div>
  )
}
