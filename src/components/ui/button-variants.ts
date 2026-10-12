import { cn } from '../../lib/utils'

/**
 * Button style contract. Kept in a non-component module so `Button.tsx` can be
 * the only export of its file (React Fast Refresh friendly) and so router
 * <Link> elements can borrow the same look via `buttonVariants(...)`.
 *
 * PRD §7.5 interaction budget: hover = brightness + lift (-2px),
 * active = scale 0.98. All motion is wrapped in `motion-safe:` so
 * prefers-reduced-motion users get a static, still-legible control.
 *
 * Any <svg> placed inside is auto-sized per button size via a child selector,
 * so callers can pass a bare lucide icon without size classes.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full border font-semibold ' +
  'transition-[transform,background-color,border-color,color,box-shadow,filter] duration-200 ease-[var(--ease-fluid)] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400 ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'motion-safe:hover:-translate-y-0.5 motion-safe:active:translate-y-0 motion-safe:active:scale-[0.98] ' +
  '[&_svg]:shrink-0'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-lavender-500 text-ink-950 shadow-glow-lavender ' +
    'hover:bg-lavender-400 motion-safe:hover:brightness-105',
  secondary:
    'border-white/12 bg-ink-800 text-fog-100 hover:border-white/20 hover:bg-ink-700',
  ghost:
    'border-transparent bg-transparent text-fog-300 hover:bg-white/6 hover:text-fog-100',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm [&_svg]:size-4',
  md: 'h-11 px-5 text-sm [&_svg]:size-4',
  lg: 'h-13 px-7 text-base [&_svg]:size-5',
}

export type ButtonVariantOptions = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}

/** Returns the class string for a button-styled element. */
export function buttonVariants({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonVariantOptions = {}): string {
  return cn(base, variantStyles[variant], sizeStyles[size], className)
}
