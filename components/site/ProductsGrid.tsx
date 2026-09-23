'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { NavNode } from '@/lib/nav'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

function getProductImage(text: string): string | null {
  const lower = text.toLowerCase()
  if (
    lower.includes('conveyor belt') &&
    !lower.includes('pvc') &&
    !lower.includes('pu') &&
    !lower.includes('modular') &&
    !lower.includes('timing') &&
    !lower.includes('silicone')
  ) {
    return '/api/media/file/cropped-Egg-collection-woven-conveyor-belt-ireland-scaled-1.jpeg'
  }
  if (lower.includes('solid pu') || lower.includes('depanner') || lower.includes('suction')) {
    return '/api/media/file/Depanner-Belt-Metal-Detectable-Suction-Cups-scaled.jpg'
  }
  if (
    lower.includes('accessor') ||
    lower.includes('fastener') ||
    lower.includes('clipper') ||
    lower.includes('alligator')
  ) {
    return '/api/media/file/Suction-Cup-Metal-Detectable-Depanner-Belt.jpg'
  }
  return null
}

function GradientCard({ text }: { text: string }) {
  const initials = text
    .split(/[\s–—-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="absolute inset-0 bg-brand-navy">
      {/* Technical grid */}
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
      {/* Diagonal belt stripe */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.12]"
        style={{
          background:
            'repeating-linear-gradient(55deg, transparent, transparent 16px, rgba(224,115,15,0.5) 16px, rgba(224,115,15,0.5) 20px)',
        }}
      />
      {/* Corner bracket */}
      <svg
        aria-hidden
        viewBox="0 0 40 40"
        fill="none"
        stroke="currentColor"
        className="absolute left-3 top-3 h-6 w-6 text-white/10"
      >
        <path d="M20 2H4C2.9 2 2 2.9 2 4v16" strokeWidth="1.5" />
      </svg>
      {/* Initials */}
      <span className="absolute bottom-4 right-4 text-4xl font-black tracking-tighter text-white/[0.12] select-none">
        {initials}
      </span>
    </div>
  )
}

export function ProductsGrid({ products }: { products: NavNode[] }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4"
    >
      {products.map((item) => {
        const img = getProductImage(item.text)
        return (
          <motion.div key={item.href} variants={itemVariants}>
            <Link
              href={item.href}
              className="group relative block overflow-hidden rounded-xl border border-border-subtle bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/12"
            >
              {/* Image area */}
              <div className="relative aspect-[4/3] overflow-hidden">
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <GradientCard text={item.text} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-80" />
              </div>

              {/* Text row */}
              <div className="relative overflow-hidden px-4 py-3.5">
                {/* Orange accent bottom bar animates from left */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 rounded-b-xl bg-brand-amber transition-transform duration-300 group-hover:scale-x-100"
                />
                <p className="text-sm font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-brand-amber">
                  {item.text}
                </p>
                <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-text-faint opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-hover:text-brand-amber">
                  View range
                  <svg
                    viewBox="0 0 10 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5"
                  >
                    <path d="M2 5h6M5 2l3 3-3 3" />
                  </svg>
                </span>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
