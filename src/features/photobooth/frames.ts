/**
 * Frame themes and canvas drawing for FlashFrame photostrips.
 *
 * PRD FR-11: frame ornaments and captions live only in the strip padding /
 * footer and must never paint over the photo slots. The composer draws the
 * background before the photos and the foreground after them, so the layer
 * order is explicit (PRD §9.4).
 *
 * React-free and fully deterministic: identical inputs produce identical draw
 * calls, which keeps the export identical to the preview.
 */

import type { FrameId } from './types'
import type { StripLayout } from './canvas-composer'

export type FrameTheme = {
  /** Base paper/panel colour filling the whole strip. */
  background: string
  /** Outline colour for the strip border. */
  border: string
  /** Accent colour for separators/ornaments. */
  accent: string
  /** Caption text colour. */
  text: string
}

export type FrameOption = {
  id: FrameId
  label: string
  theme: FrameTheme
}

export type FrameForegroundMeta = {
  caption?: string
}

/** Visual constants kept module-local so background and foreground agree. */
const FRAME_BORDER_WIDTH = 10
const FRAME_MIN_SEPARATOR = 4
const FRAME_CAPTION_FONT_PX = 48

/** Theme table (also the lookup for {@link getFrameTheme}). */
const THEMES: Readonly<Record<FrameId, FrameTheme>> = {
  clean: {
    background: '#f7f4ee',
    border: '#e3dccd',
    accent: '#c9a86a',
    text: '#2b2b30',
  },
  midnight: {
    background: '#101014',
    border: '#2a2a34',
    accent: '#8b7cf6',
    text: '#f4f4f6',
  },
  lavender: {
    background: '#efeafc',
    border: '#d8ccf5',
    accent: '#7c5cff',
    text: '#2a2440',
  },
  peach: {
    background: '#fdeee6',
    border: '#f6d2c2',
    accent: '#f0866a',
    text: '#3a241d',
  },
}

/** Ordered list shown in the result UI (PRD §5 / §7.4). */
export const FRAMES: readonly FrameOption[] = [
  { id: 'clean', label: 'Clean', theme: THEMES.clean },
  { id: 'midnight', label: 'Midnight', theme: THEMES.midnight },
  { id: 'lavender', label: 'Lavender', theme: THEMES.lavender },
  { id: 'peach', label: 'Peach', theme: THEMES.peach },
]

/** Resolve the theme for a frame id. */
export function getFrameTheme(id: FrameId): FrameTheme {
  return THEMES[id]
}

/**
 * Layer 1: paint the strip background. Called before the photos are drawn, so
 * covering the slot area here is intentional (photos are painted on top).
 */
export function drawFrameBackground(
  ctx: CanvasRenderingContext2D,
  layout: StripLayout,
  id: FrameId,
): void {
  const theme = getFrameTheme(id)
  ctx.save()
  ctx.filter = 'none'
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, layout.width, layout.height)
  ctx.restore()
}

/**
 * Layer 3: paint the border, slot separators and caption. Every ornament is
 * confined to the padding/gap/footer margins — nothing is drawn inside a slot
 * rect (PRD FR-11).
 */
export function drawFrameForeground(
  ctx: CanvasRenderingContext2D,
  layout: StripLayout,
  id: FrameId,
  meta: FrameForegroundMeta = {},
): void {
  const theme = getFrameTheme(id)
  ctx.save()
  ctx.filter = 'none'

  // Strip border, centred on the outer edge so it stays inside the padding.
  ctx.strokeStyle = theme.border
  ctx.lineWidth = FRAME_BORDER_WIDTH
  ctx.strokeRect(
    FRAME_BORDER_WIDTH / 2,
    FRAME_BORDER_WIDTH / 2,
    layout.width - FRAME_BORDER_WIDTH,
    layout.height - FRAME_BORDER_WIDTH,
  )

  // Accent separators, centred inside each vertical gap between slots.
  ctx.fillStyle = theme.accent
  for (let index = 1; index < layout.slots.length; index += 1) {
    const previous = layout.slots[index - 1]
    const current = layout.slots[index]
    if (!previous || !current) continue
    const gapTop = previous.y + previous.height
    const gapHeight = current.y - gapTop
    if (gapHeight <= 0) continue
    const barHeight = Math.max(FRAME_MIN_SEPARATOR, Math.round(gapHeight * 0.4))
    const barY = gapTop + (gapHeight - barHeight) / 2
    ctx.fillRect(previous.x, barY, previous.width, barHeight)
  }

  // Caption, centred inside the footer margin.
  if (meta.caption) {
    ctx.fillStyle = theme.text
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `600 ${FRAME_CAPTION_FONT_PX}px system-ui, -apple-system, "Segoe UI", sans-serif`
    ctx.fillText(
      meta.caption,
      layout.footer.x + layout.footer.width / 2,
      layout.footer.y + layout.footer.height / 2,
    )
  }

  ctx.restore()
}
