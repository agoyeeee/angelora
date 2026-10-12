import { Link } from '@tanstack/react-router'
import { Camera } from 'lucide-react'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/8 bg-ink-950/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-[0.55rem] border border-white/10 bg-ink-850 text-fog-500">
            <Camera className="size-3.5" aria-hidden />
          </span>
          <span className="font-display text-sm font-semibold text-fog-200">
            FlashFrame
          </span>
        </div>

        <p className="max-w-sm text-xs leading-relaxed text-fog-500">
          Photos are processed in your browser and never uploaded. Download your
          strip before you close the tab.
        </p>

        <div className="flex items-center gap-4 text-sm">
          <Link
            to="/privacy"
            className="rounded-full text-fog-400 transition-colors duration-200 hover:text-fog-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400"
          >
            Privacy
          </Link>
          <span className="font-mono text-xs text-fog-600">© {year} FlashFrame</span>
        </div>
      </div>
    </footer>
  )
}
