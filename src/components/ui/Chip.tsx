import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

/*
 * Selectable options. Two shapes, one contract:
 *  - Chip       : compact pill (shot count, timer, filter name)
 *  - OptionCard : tile with a preview slot (frame / filter swatches)
 *
 * Both are real <button>s, so they are keyboard operable and focus-visible.
 * State is conveyed with aria-pressed AND a check indicator AND border/surface
 * change — never colour alone (PRD §13).
 */

function SelectionMark({
  selected,
  className,
}: {
  selected: boolean
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-4 shrink-0 place-items-center rounded-full transition-[opacity,transform,background-color] duration-200 ease-[var(--ease-fluid)]',
        selected
          ? 'scale-100 bg-lavender-500 text-ink-950 opacity-100'
          : 'scale-75 bg-transparent opacity-0',
        className,
      )}
    >
      <Check className="size-3" strokeWidth={3.5} />
    </span>
  )
}

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string
  /** Short supporting text, e.g. "3 photos". */
  meta?: string
  selected?: boolean
  icon?: ReactNode
  /** Colour swatch / mini preview shown before the label. */
  swatch?: ReactNode
}

export function Chip({
  label,
  meta,
  selected = false,
  icon,
  swatch,
  className,
  type = 'button',
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'group inline-flex items-center gap-2.5 rounded-chip border px-4 py-2 text-sm font-medium',
        'transition-[transform,background-color,border-color,color] duration-200 ease-[var(--ease-fluid)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400',
        'motion-safe:active:scale-[0.98]',
        selected
          ? 'border-lavender-400 bg-lavender-500/15 text-fog-100'
          : 'border-white/10 bg-ink-800/60 text-fog-300 hover:border-white/20 hover:bg-ink-800 hover:text-fog-100',
        className,
      )}
      {...rest}
    >
      {swatch}
      {icon ? (
        <span aria-hidden className="shrink-0 text-current [&_svg]:size-4">
          {icon}
        </span>
      ) : null}
      <span className="flex flex-col text-left leading-tight">
        <span className="font-semibold">{label}</span>
        {meta ? (
          <span className="text-[0.7rem] font-normal text-fog-500">{meta}</span>
        ) : null}
      </span>
      <SelectionMark selected={selected} />
    </button>
  )
}

export type OptionCardProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  label: string
  description?: string
  selected?: boolean
  /** Preview area (frame thumbnail, filter swatch, …). */
  preview?: ReactNode
}

export function OptionCard({
  label,
  description,
  selected = false,
  preview,
  className,
  type = 'button',
  ...rest
}: OptionCardProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full flex-col gap-3 rounded-tile border p-3 text-left',
        'transition-[transform,background-color,border-color,box-shadow] duration-200 ease-[var(--ease-fluid)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400',
        'motion-safe:active:scale-[0.98]',
        selected
          ? 'border-lavender-400 bg-lavender-500/12 shadow-glow-lavender'
          : 'border-white/10 bg-ink-800/60 hover:border-white/20 hover:bg-ink-800',
        className,
      )}
      {...rest}
    >
      {preview ? (
        <span className="block overflow-hidden rounded-photo ring-1 ring-white/10">
          {preview}
        </span>
      ) : null}
      <span className="flex items-center justify-between gap-2">
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-fog-100">{label}</span>
          {description ? (
            <span className="text-xs text-fog-500">{description}</span>
          ) : null}
        </span>
        <SelectionMark selected={selected} />
      </span>
    </button>
  )
}
