import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import {
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from './button-variants'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Stretch to the container width (useful for mobile-first layouts). */
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        buttonVariants({ variant, size }),
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {/* Icons are decorative; the accessible name comes from the label text. */}
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}
