import { Link } from '@tanstack/react-router'
import { Camera } from 'lucide-react'

const navLinkClass =
  'rounded-full px-3 py-2 text-sm font-medium text-fog-400 transition-colors duration-200 hover:text-fog-100 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400 ' +
  'data-[status=active]:text-fog-100 data-[status=active]:bg-white/6'

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-900/80 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8"
      >
        <Link
          to="/"
          aria-label="FlashFrame — home"
          className="group inline-flex items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lavender-400"
        >
          <span className="grid size-8 place-items-center rounded-[0.6rem] border border-white/12 bg-ink-800 text-lavender-400 transition-colors duration-200 group-hover:text-lavender-300">
            <Camera className="size-4" aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-fog-100">
            FlashFrame
          </span>
        </Link>

        <div className="-mr-2 flex items-center gap-0.5 sm:gap-1">
          <Link
            to="/"
            hash="how-it-works"
            className={`${navLinkClass} hidden sm:inline`}
          >
            How it works
          </Link>
          <Link to="/privacy" className={navLinkClass}>
            Privacy
          </Link>
        </div>
      </nav>
    </header>
  )
}
