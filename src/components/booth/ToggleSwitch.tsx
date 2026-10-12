import { useId } from 'react'
import { cn } from '../../lib/utils'

export type ToggleSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

/**
 * Accessible on/off control (role="switch") used for the mirror preview (FR-05).
 * State is conveyed by position + `aria-checked`, not colour alone.
 */
export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleSwitchProps) {
  const labelId = useId()
  const descriptionId = useId()

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="min-w-0">
        <span id={labelId} className="block text-sm font-medium text-fog-100">
          {label}
        </span>
        {description ? (
          <span
            id={descriptionId}
            className="mt-0.5 block text-xs leading-relaxed text-fog-500"
          >
            {description}
          </span>
        ) : null}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 ease-[var(--ease-fluid)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender-400',
          'disabled:pointer-events-none disabled:opacity-50',
          checked
            ? 'border-transparent bg-lavender-500'
            : 'border-white/12 bg-ink-700',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'inline-block size-5 rounded-full bg-fog-100 shadow-lift transition-transform duration-200 ease-[var(--ease-fluid)]',
            checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}
