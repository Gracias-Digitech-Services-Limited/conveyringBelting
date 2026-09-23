'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // localStorage can throw in private browsing / blocked storage - theme just won't persist
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null)

  useEffect(() => {
    // Deliberately reading DOM state set by the inline no-flash script (globals via
    // `document`, unavailable during SSR) once after mount - not deriving from props/state,
    // so this doesn't fit the "external system" callback pattern the lint rule expects.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, [])

  if (!theme) {
    // Avoid rendering the wrong icon for a frame before we know the theme (set by the inline
    // script in layout.tsx before hydration) - a fixed-size placeholder keeps layout stable.
    return <span className="inline-block h-9 w-9" />
  }

  const next = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      aria-label={`Switch to ${next} mode`}
      onClick={() => {
        applyTheme(next)
        setTheme(next)
      }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 hover:text-white"
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="flex"
      >
        {theme === 'dark' ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.4 5.4 0 01-7.54-7.54c-.44-.06-.9-.1-1.36-.1z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M12 4.5a1 1 0 011-1V2a1 1 0 10-2 0v1.5a1 1 0 011 1zm0 15a1 1 0 011 1V22a1 1 0 10-2 0v-1.5a1 1 0 011-1zM4.5 12a1 1 0 01-1 1H2a1 1 0 100-2h1.5a1 1 0 011 1zm18 0a1 1 0 01-1 1H20a1 1 0 100-2h1.5a1 1 0 011 1zM5.64 5.64a1 1 0 011.42 0l1.06 1.06a1 1 0 11-1.42 1.42L5.64 7.06a1 1 0 010-1.42zm11.24 11.24a1 1 0 011.42 0l1.06 1.06a1 1 0 11-1.42 1.42l-1.06-1.06a1 1 0 010-1.42zM18.36 5.64a1 1 0 010 1.42l-1.06 1.06a1 1 0 11-1.42-1.42l1.06-1.06a1 1 0 011.42 0zM7.06 16.88a1 1 0 010 1.42L6 19.36a1 1 0 11-1.42-1.42l1.06-1.06a1 1 0 011.42 0zM12 7a5 5 0 100 10 5 5 0 000-10z" />
          </svg>
        )}
      </motion.span>
    </button>
  )
}
