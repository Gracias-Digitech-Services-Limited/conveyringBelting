'use client'

import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

export function HeroParallax({ src }: { src: string }) {
  const shouldReduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  // Move image down gently as user scrolls, creating a parallax effect within the overflow-hidden hero
  const y = useTransform(scrollY, [0, 650], [0, shouldReduceMotion ? 0 : 110])

  return (
    <motion.img
      aria-hidden
      src={src}
      alt=""
      style={{ y, height: 'calc(100% + 110px)' }}
      className="absolute left-0 top-0 w-full object-cover object-center will-change-transform"
    />
  )
}
