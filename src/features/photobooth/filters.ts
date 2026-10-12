/**
 * Filter presets for FlashFrame.
 *
 * PRD FR-10: the final PNG export must use the same filter as the on-screen
 * preview, not a CSS-only effect. This module is therefore the single source of
 * truth: the result UI applies `getFilterCss(id)` as a CSS `filter`, and the
 * canvas composer applies the exact same string to `ctx.filter` while drawing
 * the final strip.
 *
 * React-free by design (PRD §10) so it can be unit-tested and swapped without
 * touching the UI layer.
 */

import type { FilterId } from './types'

export type FilterOption = {
  id: FilterId
  label: string
}

/** Ordered list shown in the result UI (PRD §5 / §7.4). */
export const FILTERS: readonly FilterOption[] = [
  { id: 'original', label: 'Original' },
  { id: 'warm', label: 'Warm' },
  { id: 'bw', label: 'B&W' },
  { id: 'soft', label: 'Soft' },
  { id: 'vivid', label: 'Vivid' },
]

/**
 * Canvas/CSS `filter` values. Deliberately gentle so faces stay readable and
 * the export keeps a natural film feel (PRD §9.4, FR-11). Deterministic — no
 * randomness or time input, so preview and export always match byte-for-byte
 * in intent.
 */
const FILTER_CSS: Readonly<Record<FilterId, string>> = {
  original: 'none',
  warm: 'brightness(1.05) contrast(1.05) saturate(1.15) sepia(0.22)',
  bw: 'grayscale(1) contrast(1.12) brightness(1.02)',
  soft: 'brightness(1.08) contrast(0.92) saturate(0.92)',
  vivid: 'brightness(1.02) contrast(1.18) saturate(1.45)',
}

/** The `ctx.filter` / CSS value for a filter id. `'original'` maps to `'none'`. */
export function getFilterCss(id: FilterId): string {
  return FILTER_CSS[id]
}

/** Set the canvas filter for the next draw. Pair with {@link resetFilter}. */
export function applyFilter(ctx: CanvasRenderingContext2D, id: FilterId): void {
  ctx.filter = getFilterCss(id)
}

/** Restore the canvas to unfiltered drawing (frame layers, captions). */
export function resetFilter(ctx: CanvasRenderingContext2D): void {
  ctx.filter = 'none'
}
