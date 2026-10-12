/**
 * Download helpers — React-free, dependency-free.
 *
 * PRD §9.4 / FR-13: export a PNG with a friendly filename and revoke the
 * temporary object URL only after the browser has begun the download.
 */

import { formatDateLabel } from './utils'

/** Delay before revoking the temporary object URL (ms). */
export const REVOKE_DELAY_MS = 1000

/** Friendly filename, e.g. `flashframe-2026-10-12.png` (PRD FR-13). */
export function buildFilename(date: Date = new Date()): string {
  return `flashframe-${formatDateLabel(date)}.png`
}

/**
 * Trigger a client-side download of `blob`.
 *
 * A temporary object URL is created and revoked on a later tick so the download
 * is not cancelled before the browser starts it.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.style.display = 'none'

  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, REVOKE_DELAY_MS)
}
