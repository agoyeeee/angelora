import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Compact selectable card shared by the filter and frame pickers on the result
 * page (PRD §7.4). It mirrors the design-system contract from `OptionCard`
 * (same tokens, same radius/shadow language) but is tuned to sit tightly in a
 * row of five filter swatches without losing legibility.
 *
 * It is a real <button>, so it is keyboard operable and focus-visible. Selection
 * is conveyed three ways at once — `aria-pressed`, a corner check, and a border
 * + surface lift — never by colour alone (PRD §13 / FR-16).
 *
 * The preview must supply its own aspect ratio (4:3 filter swatch, 3:4 frame
 * swatch) so the two pickers can share one shell.
 */
export type PickerCardProps = {
  label: string
  selected: boolean
  onSelect: () => void
  /** Accessible name, e.g. "Warm filter". */
  ariaLabel: string
  /** Preview content; must set its own aspect ratio. */
  preview: ReactNode
  className?: string
}

export function PickerCard({
  label,
  selected,
  onSelect,
  ariaLabel,
  preview,
  className,
}: PickerCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
      className={cn(
        'group relative flex w-full flex-col rounded-tile border p-2 text-left',
        'transition-[transform,background-color,border-color,box-shadow] duration-200 ease-[var(--ease-fluid)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400',
        'motion-safe:active:scale-[0.98]',
        selected
          ? 'border-lavender-400 bg-lavender-500/12 shadow-glow-lavender'
          : 'border-white/10 bg-ink-800/60 hover:border-white/20 hover:bg-ink-800',
        className,
      )}
    >
      <span className="relative block w-full overflow-hidden rounded-[0.6rem] ring-1 ring-white/10">
        {preview}
        <span
          aria-hidden
          className={cn(
            'absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-lavender-500 text-ink-950 shadow-lift',
            'transition-[opacity,transform] duration-200 ease-[var(--ease-fluid)]',
            selected ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
          )}
        >
          <Check className="size-2.5" strokeWidth={3.5} />
        </span>
      </span>
      <span className="mt-2 block truncate px-0.5 pb-0.5 text-xs font-semibold text-fog-100">
        {label}
      </span>
    </button>
  )
}
