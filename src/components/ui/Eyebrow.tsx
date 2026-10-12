import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

/**
 * Small mono label that sits above section headings ("How it works",
 * "Privacy", "Error 404"…). Uses the technical typeface deliberately, echoing
 * camera metadata (PRD §7.1).
 */
export function Eyebrow({
  children,
  icon,
  className,
}: {
  children: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        'flex items-center gap-2 font-mono text-xs uppercase tracking-[0.28em] text-fog-500',
        className,
      )}
    >
      {icon ? (
        <span aria-hidden className="text-lavender-400 [&_svg]:size-3.5">
          {icon}
        </span>
      ) : null}
      {children}
    </p>
  )
}
