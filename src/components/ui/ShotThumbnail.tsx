import type { ReactNode } from 'react'
import { Camera, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * One slot in a photostrip. Empty before a shot, captured once an image exists.
 * Phase 2 (booth) renders the live grid of 3/4 of these; Phase 3 adds retake.
 *
 * Presentational only — it does not own animation. Phase 2/3 should wrap it in
 * a Motion element using `thumbnailPopVariants` for the capture entrance.
 *
 * Renders a <button> when `onSelect` is provided (keyboard operable, aria-pressed),
 * otherwise a plain <div>. Never encodes state by colour alone: the empty state
 * shows a dashed frame + camera glyph, the captured state shows the image + check.
 */

export type ShotState = 'empty' | 'captured'

export type ShotThumbnailProps = {
  state?: ShotState
  /** Image source (object URL or data URL) when captured. */
  src?: string
  alt?: string
  /** 1-based shot number, used for the visible label. */
  index?: number
  /** Overrides the generated label. */
  label?: string
  selected?: boolean
  onSelect?: () => void
  className?: string
}

export function ShotThumbnail({
  state = 'empty',
  src,
  alt,
  index,
  label,
  selected = false,
  onSelect,
  className,
}: ShotThumbnailProps) {
  const shotLabel = label ?? (index ? `Shot ${index}` : 'Shot')
  const captured = state === 'captured'
  const interactive = typeof onSelect === 'function'

  const surfaceClass = cn(
    'group relative block w-full overflow-hidden rounded-photo border text-left',
    'aspect-[4/3] transition-[border-color,box-shadow,transform] duration-200 ease-[var(--ease-fluid)]',
    captured
      ? 'border-white/12 bg-ink-950 shadow-lift'
      : 'border-dashed border-white/15 bg-ink-850/70',
    interactive &&
      'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400 motion-safe:active:scale-[0.98] hover:border-white/25',
    selected && 'border-lavender-400 ring-2 ring-lavender-400/60',
    className,
  )

  const inner: ReactNode = (
    <>
      {captured && src ? (
        <img
          src={src}
          alt={alt ?? shotLabel}
          className="absolute inset-0 size-full object-cover"
          draggable={false}
        />
      ) : captured ? (
        // Captured but the image failed to load: still show a stable frame.
        <span className="absolute inset-0 grid place-items-center text-fog-500">
          <Camera className="size-6" aria-hidden />
        </span>
      ) : (
        <span className="absolute inset-0 grid place-items-center gap-1.5 text-fog-500">
          <Camera className="size-6" aria-hidden />
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em]">
            {shotLabel}
          </span>
        </span>
      )}

      {captured ? (
        <>
          <span
            aria-hidden
            className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-lavender-500 text-ink-950 shadow-lift"
          >
            <Check className="size-3" strokeWidth={3.5} />
          </span>
          {index ? (
            <span
              aria-hidden
              className="absolute bottom-1.5 left-1.5 rounded-full bg-ink-950/80 px-2 py-0.5 font-mono text-[0.6rem] tracking-widest text-fog-200 backdrop-blur-sm"
            >
              {String(index).padStart(2, '0')}
            </span>
          ) : null}
        </>
      ) : null}
    </>
  )

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={captured ? `${shotLabel}, captured` : `${shotLabel}, empty`}
        className={surfaceClass}
      >
        {inner}
      </button>
    )
  }

  return <div className={surfaceClass}>{inner}</div>
}

/** Backwards-friendly alias. */
export const ThumbnailSlot = ShotThumbnail

export type ThumbnailSlotProps = ShotThumbnailProps
