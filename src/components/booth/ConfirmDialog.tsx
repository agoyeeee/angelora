import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'

export type ConfirmDialogProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** `danger` tints the confirm action coral for destructive resets. */
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirm overlay for actions that discard captured photos (FR-09 / PRD §11).
 *
 * Uses the native `<dialog>` + `showModal()` so focus is trapped, the page
 * behind is inert, and Esc closes it for free. Focus lands on the safer choice:
 * cancel for destructive resets, confirm for neutral prompts.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
      const target = tone === 'danger' ? '[data-cancel]' : '[data-confirm]'
      dialog.querySelector<HTMLButtonElement>(target)?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, tone])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onCancel()
      }}
      className="w-[min(92vw,26rem)] rounded-card border border-white/12 bg-ink-850 p-0 text-fog-100 shadow-panel backdrop:bg-ink-950/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2
          id="confirm-dialog-title"
          className="font-display text-lg font-semibold tracking-tight text-fog-100"
        >
          {title}
        </h2>
        <div className="mt-2.5 text-sm leading-relaxed text-fog-400">
          {description}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" data-cancel onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            data-confirm
            onClick={onConfirm}
            className={
              tone === 'danger'
                ? 'bg-coral-500! text-ink-950! shadow-glow-coral! hover:bg-coral-400!'
                : undefined
            }
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
