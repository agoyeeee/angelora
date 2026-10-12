/**
 * Small shared helpers. React-free and dependency-free.
 * Owned by the orchestrator as part of the shared contract so UI and logic
 * modules can both import it.
 */

/** Join truthy class name fragments. */
export function cn(
  ...inputs: Array<string | false | null | undefined>
): string {
  return inputs.filter(Boolean).join(' ')
}

/** Clamp a number into the inclusive [min, max] range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/** Local date as `YYYY-MM-DD` (used for captions and download filenames). */
export function formatDateLabel(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
