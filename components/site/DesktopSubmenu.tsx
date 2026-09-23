import Link from 'next/link'
import type { NavNode } from '@/lib/nav'

// Tailwind needs each utility class to appear as a literal, contiguous token somewhere in the
// source to generate it — depth-keyed group names are written out in full here.
const FLYOUT_ITEM_CLASS = ['', 'group/sub1 relative', 'group/sub2 relative', 'group/sub2 relative']
const FLYOUT_PANEL_VISIBLE_CLASS = [
  '',
  'group-hover/sub1:visible group-hover/sub1:opacity-100 group-hover/sub1:translate-x-0 group-focus-within/sub1:visible group-focus-within/sub1:opacity-100 group-focus-within/sub1:translate-x-0',
  'group-hover/sub2:visible group-hover/sub2:opacity-100 group-hover/sub2:translate-x-0 group-focus-within/sub2:visible group-focus-within/sub2:opacity-100 group-focus-within/sub2:translate-x-0',
  'group-hover/sub2:visible group-hover/sub2:opacity-100 group-hover/sub2:translate-x-0 group-focus-within/sub2:visible group-focus-within/sub2:opacity-100 group-focus-within/sub2:translate-x-0',
]

export function DesktopSubmenu({ items, depth }: { items: NavNode[]; depth: 1 | 2 | 3 }) {
  return (
    <div className="w-72 py-1.5">
      {items.map((item) =>
        item.children?.length ? (
          <div key={item.href} className={FLYOUT_ITEM_CLASS[depth]}>
            <Link
              href={item.href}
              className="flex items-center justify-between gap-2 rounded-sm mx-1.5 px-3 py-2 text-sm transition-all duration-150 hover:bg-muted hover:text-brand-amber text-text-muted"
            >
              {item.text}
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5 shrink-0 text-text-faint"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <div
              className={`invisible absolute left-full top-0 z-50 -translate-x-1 opacity-0 shadow-2xl shadow-black/20 transition-all duration-150 rounded-lg border border-border-subtle bg-card text-foreground ${FLYOUT_PANEL_VISIBLE_CLASS[depth]}`}
            >
              <DesktopSubmenu
                items={item.children}
                depth={depth === 3 ? 3 : ((depth + 1) as 1 | 2 | 3)}
              />
            </div>
          </div>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-sm mx-1.5 px-3 py-2 text-sm text-text-muted transition-all duration-150 hover:bg-muted hover:text-brand-amber"
          >
            {item.text}
          </Link>
        ),
      )}
    </div>
  )
}
