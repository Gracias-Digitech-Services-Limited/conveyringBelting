'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { NavNode } from '@/lib/nav'

export function MobileNavItem({
  item,
  depth,
  onNavigate,
}: {
  item: NavNode
  depth: number
  onNavigate: () => void
}) {
  const [open, setOpen] = useState(false)

  if (!item.children?.length) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className="block py-2 text-sm"
        style={{ paddingLeft: depth * 12 }}
      >
        {item.text}
      </Link>
    )
  }

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between py-2 text-left text-sm font-medium"
        style={{ paddingLeft: depth * 12 }}
        onClick={() => setOpen((v) => !v)}
      >
        {item.text}
        <span className={`mr-2 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {item.children.map((child) => (
              <MobileNavItem key={child.href} item={child} depth={depth + 1} onNavigate={onNavigate} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
