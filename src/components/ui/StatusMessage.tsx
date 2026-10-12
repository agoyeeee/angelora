import type { ReactNode } from 'react'
import {
  CircleAlert,
  CircleCheck,
  ImageOff,
  Info,
  LoaderCircle,
} from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Unified status surface for loading / error / empty / success / info states.
 * Phase 2 (camera + permission errors) and Phase 3/4 (capture, export) reuse it.
 *
 * Live-region roles follow the intent: errors are assertive, everything else
 * polite, so screen readers announce state changes without spamming (PRD §13).
 */

export type StatusTone = 'error' | 'loading' | 'empty' | 'success' | 'info'

export type StatusMessageProps = {
  tone?: StatusTone
  title: string
  description?: ReactNode
  /** Actions rendered below the copy (buttons / links). */
  children?: ReactNode
  /** Replace the default icon. */
  icon?: ReactNode
  className?: string
}

const toneConfig: Record<
  StatusTone,
  { shell: string; iconWrap: string; live: 'assertive' | 'polite'; role: 'alert' | 'status' }
> = {
  error: {
    shell: 'border-coral-500/35 bg-coral-500/10',
    iconWrap: 'bg-coral-500/15 text-coral-400',
    live: 'assertive',
    role: 'alert',
  },
  loading: {
    shell: 'border-lavender-500/25 bg-lavender-500/8',
    iconWrap: 'bg-lavender-500/15 text-lavender-400',
    live: 'polite',
    role: 'status',
  },
  empty: {
    shell: 'border-white/10 bg-ink-850/80',
    iconWrap: 'bg-white/6 text-fog-400',
    live: 'polite',
    role: 'status',
  },
  success: {
    shell: 'border-lavender-400/30 bg-lavender-500/10',
    iconWrap: 'bg-lavender-500/15 text-lavender-300',
    live: 'polite',
    role: 'status',
  },
  info: {
    shell: 'border-white/10 bg-ink-850/80',
    iconWrap: 'bg-white/6 text-fog-300',
    live: 'polite',
    role: 'status',
  },
}

const toneIcon: Record<StatusTone, ReactNode> = {
  error: <CircleAlert />,
  loading: <LoaderCircle className="motion-safe:animate-spin" />,
  empty: <ImageOff />,
  success: <CircleCheck />,
  info: <Info />,
}

export function StatusMessage({
  tone = 'info',
  title,
  description,
  children,
  icon,
  className,
}: StatusMessageProps) {
  const config = toneConfig[tone]

  return (
    <div
      role={config.role}
      aria-live={config.live}
      className={cn(
        'flex items-start gap-3.5 rounded-tile border p-4 sm:gap-4 sm:p-5',
        config.shell,
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-full [&_svg]:size-[1.15rem]',
          config.iconWrap,
        )}
      >
        {icon ?? toneIcon[tone]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-semibold text-fog-100">
          {title}
        </p>
        {description ? (
          <div className="mt-1 text-sm leading-relaxed text-fog-400">
            {description}
          </div>
        ) : null}
        {children ? (
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}
