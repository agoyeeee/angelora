import type { ElementType, HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export type CardProps = HTMLAttributes<HTMLElement> & {
  /** Render as another element (section, article, li …). Defaults to div. */
  as?: ElementType
  /** Adds a subtle lift + border highlight on hover. */
  interactive?: boolean
}

export function Card({
  as,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  const Tag = (as ?? 'div') as ElementType

  return (
    <Tag
      className={cn(
        'rounded-card border border-white/10 bg-ink-850/90 shadow-card',
        interactive &&
          'transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-fluid)] hover:border-white/20 hover:shadow-lift motion-safe:hover:-translate-y-1',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  )
}
