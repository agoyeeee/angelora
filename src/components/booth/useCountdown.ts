import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs the "3 / 2 / 1" countdown shown over the preview (FR-06).
 *
 * `start(seconds)` resolves once the whole countdown has elapsed — including
 * after cancellation, so the awaiting capture loop can simply re-check its own
 * abort flag. The number is exposed as `value` (null while idle) for the visual
 * overlay; nothing here touches the DOM.
 */

export type UseCountdownResult = {
  /** Current number on screen, or null when idle. */
  value: number | null
  /** True while a countdown is in progress. */
  running: boolean
  /** Run a countdown; resolves when it finishes or is cancelled. */
  start: (seconds: number) => Promise<void>
  /** Stop the current countdown (used by "start over"). */
  cancel: () => void
}

export function useCountdown(): UseCountdownResult {
  const [value, setValue] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const timerRef = useRef<number | null>(null)
  const resolveRef = useRef<(() => void) | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const cancel = useCallback(() => {
    clearTimer()
    // Resolve a pending wait so the capture loop is not stranded.
    const resolve = resolveRef.current
    resolveRef.current = null
    setRunning(false)
    setValue(null)
    resolve?.()
  }, [clearTimer])

  const start = useCallback(
    (seconds: number) =>
      new Promise<void>((resolve) => {
        clearTimer()
        resolveRef.current = resolve
        setRunning(true)

        let remaining = Math.max(1, Math.floor(seconds))
        setValue(remaining)

        const step = (): void => {
          timerRef.current = window.setTimeout(() => {
            remaining -= 1
            if (remaining <= 0) {
              timerRef.current = null
              resolveRef.current = null
              setRunning(false)
              setValue(null)
              resolve()
            } else {
              setValue(remaining)
              step()
            }
          }, 1000)
        }

        step()
      }),
    [clearTimer],
  )

  // Clear the pending timer on unmount (no state writes after teardown).
  useEffect(
    () => () => {
      clearTimer()
      resolveRef.current = null
    },
    [clearTimer],
  )

  return { value, running, start, cancel }
}
