import type { ReactNode } from 'react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

/**
 * Shared shell for the landing and privacy pages: sticky navbar, flexible
 * content area, minimal footer, plus a keyboard "skip to content" link.
 * The booth and result routes (Phase 2/3) are intentionally not wrapped here.
 */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only-focusable fixed left-4 top-4 z-50 rounded-full bg-lavender-500 px-4 py-2 text-sm font-semibold text-ink-950"
      >
        Skip to content
      </a>
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}
