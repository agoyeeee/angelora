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

export type FramePatternKind = 'dots' | 'stripes' | 'checker' | 'grid'

/** Repeating background motif. Only ever visible in the margins (photos cover the rest). */
export type FramePattern = {
  kind: FramePatternKind
  color: string
  /** Cell size in strip pixels (strip is 1200px wide). */
  size: number
}

export type FrameTheme = {
  /** Base paper/panel colour filling the whole strip. */
  background: string
  /** Outline colour for the strip border. */
  border: string
  /** Accent colour for separators/ornaments. */
  accent: string
  /** Caption text colour. */
  text: string
  /** Optional repeating background motif. */
  pattern?: FramePattern
  /**
   * Optional emoji set. When present the frame gets a sticker border (rows in
   * the top padding and between photos, columns down both sides, two big
   * stickers in the footer) instead of the plain accent separators.
   */
  stickers?: readonly string[]
  /** Optional funny line printed above the date in the footer (keep it short). */
  tagline?: string
}

export type FrameGroup = 'classic' | 'fun'

export type FrameOption = {
  id: FrameId
  label: string
  group: FrameGroup
  theme: FrameTheme
}

export type Sticker = {
  char: string
  /** Centre of the glyph, in strip pixels. */
  x: number
  y: number
  /** Font size in strip pixels. */
  size: number
  /** Rotation in radians. */
  rotation: number
}

export type FrameForegroundMeta = {
  caption?: string
}

/** Visual constants kept module-local so background and foreground agree. */
const FRAME_BORDER_WIDTH = 10
const FRAME_MIN_SEPARATOR = 4
const FRAME_CAPTION_FONT_PX = 48
const FRAME_TAGLINE_FONT_PX = 60
const FRAME_DATE_FONT_PX = 30
const STICKER_ROW_COUNT = 13
const STICKER_COLUMN_STEP = 96
const STICKER_FOOTER_SIZE = 96
const EMOJI_FONT_FAMILY = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'

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
  kucing: {
    background: '#fff1dc',
    border: '#f6d7ae',
    accent: '#f2a65a',
    text: '#4a2e12',
    pattern: { kind: 'dots', color: '#f9e0bb', size: 36 },
    stickers: ['🐱', '🐾', '🐟'],
    tagline: 'Meong Squad',
  },
  boba: {
    background: '#f3e3d0',
    border: '#e2c7a8',
    accent: '#b07a54',
    text: '#4b2e1e',
    pattern: { kind: 'dots', color: '#ead2b8', size: 36 },
    stickers: ['🧋', '🍡', '🍓'],
    tagline: 'Boba Is Life',
  },
  kos: {
    background: '#fffdf0',
    border: '#cfe3ff',
    accent: '#e4572e',
    text: '#3d1f0b',
    pattern: { kind: 'grid', color: '#d6e6ff', size: 60 },
    stickers: ['🍜', '🥚', '🌶️'],
    tagline: 'Anak Kos Sejati',
  },
  pizza: {
    background: '#fff7ec',
    border: '#e8603c',
    accent: '#d64527',
    text: '#3b1a0f',
    pattern: { kind: 'checker', color: '#ffdcd2', size: 40 },
    stickers: ['🍕', '🧀', '🍅'],
    tagline: 'Pizza Party',
  },
  alien: {
    background: '#0f1f17',
    border: '#1f3d2c',
    accent: '#7cff6b',
    text: '#d6ffd0',
    pattern: { kind: 'dots', color: '#17352a', size: 36 },
    stickers: ['👽', '🛸', '⭐'],
    tagline: 'Take Me Home',
  },
  hantu: {
    background: '#1b1030',
    border: '#3a2460',
    accent: '#ff8a1f',
    text: '#ffe9d2',
    pattern: { kind: 'dots', color: '#2a1a47', size: 36 },
    stickers: ['👻', '🎃', '🦇'],
    tagline: 'Boo! Kaget Kan?',
  },
  kodok: {
    background: '#dff5c8',
    border: '#b5e09a',
    accent: '#3f9b3a',
    text: '#1d3a17',
    pattern: { kind: 'dots', color: '#c9eba8', size: 36 },
    stickers: ['🐸', '🍀', '💧'],
    tagline: 'Ribbit Squad',
  },
  bucin: {
    background: '#ffe0ec',
    border: '#ffc0d6',
    accent: '#ff4f8b',
    text: '#5c1030',
    pattern: { kind: 'dots', color: '#ffcadd', size: 36 },
    stickers: ['💖', '💘', '💌'],
    tagline: 'Bucin Mode ON',
  },
  unicorn: {
    background: '#f0e4ff',
    border: '#dcc4ff',
    accent: '#b46cff',
    text: '#3a1a66',
    pattern: { kind: 'stripes', color: '#e7d6ff', size: 30 },
    stickers: ['🦄', '🌈', '✨'],
    tagline: 'Unicorn Vibes',
  },
  arcade: {
    background: '#120a2a',
    border: '#3a1a7a',
    accent: '#00e5ff',
    text: '#ff4fd8',
    pattern: { kind: 'grid', color: '#24104f', size: 60 },
    stickers: ['🕹️', '👾', '⭐'],
    tagline: 'Insert Coin',
  },
  pantai: {
    background: '#d9f3ff',
    border: '#a8e0f7',
    accent: '#ff9a3c',
    text: '#0b3b5c',
    pattern: { kind: 'stripes', color: '#c8ecfb', size: 30 },
    stickers: ['🏖️', '🍉', '🌴'],
    tagline: 'Liburan Dulu',
  },
  sultan: {
    background: '#14110a',
    border: '#3a3016',
    accent: '#f2c14e',
    text: '#f8e7b0',
    pattern: { kind: 'checker', color: '#1d190e', size: 40 },
    stickers: ['👑', '💰', '💎'],
    tagline: 'Sultan Mode',
  },
  panda: {
    background: '#f1f5f0',
    border: '#d5dfd4',
    accent: '#3c4a3e',
    text: '#1f2a21',
    pattern: { kind: 'dots', color: '#e3ebe2', size: 36 },
    stickers: ['🐼', '🎋', '🍃'],
    tagline: 'Panda Mager',
  },
  ultah: {
    background: '#fff9d6',
    border: '#ffe08a',
    accent: '#ff6b6b',
    text: '#4a1d6b',
    pattern: { kind: 'stripes', color: '#fff0a3', size: 30 },
    stickers: ['🎂', '🎈', '🎉'],
    tagline: 'Ultah Dong!',
  },
  komik: {
    background: '#ffe14d',
    border: '#111111',
    accent: '#e63946',
    text: '#111111',
    pattern: { kind: 'dots', color: '#ffc700', size: 24 },
    stickers: ['💥', '⚡', '🔥'],
    tagline: 'POW! Ganteng!',
  },
  dino: {
    background: '#e9dcc3',
    border: '#cdb98f',
    accent: '#6b8e23',
    text: '#3b2f1a',
    pattern: { kind: 'checker', color: '#e1d2b4', size: 40 },
    stickers: ['🦖', '🦕', '🌋'],
    tagline: 'Rawr Means Hi',
  },
}

/** Ordered list shown in the result UI (PRD §5 / §7.4). */
export const FRAMES: readonly FrameOption[] = [
  { id: 'clean', label: 'Clean', group: 'classic', theme: THEMES.clean },
  { id: 'midnight', label: 'Midnight', group: 'classic', theme: THEMES.midnight },
  { id: 'lavender', label: 'Lavender', group: 'classic', theme: THEMES.lavender },
  { id: 'peach', label: 'Peach', group: 'classic', theme: THEMES.peach },
  { id: 'kucing', label: 'Meong', group: 'fun', theme: THEMES.kucing },
  { id: 'boba', label: 'Boba', group: 'fun', theme: THEMES.boba },
  { id: 'kos', label: 'Kos', group: 'fun', theme: THEMES.kos },
  { id: 'pizza', label: 'Pizza', group: 'fun', theme: THEMES.pizza },
  { id: 'alien', label: 'Alien', group: 'fun', theme: THEMES.alien },
  { id: 'hantu', label: 'Hantu', group: 'fun', theme: THEMES.hantu },
  { id: 'kodok', label: 'Kodok', group: 'fun', theme: THEMES.kodok },
  { id: 'bucin', label: 'Bucin', group: 'fun', theme: THEMES.bucin },
  { id: 'unicorn', label: 'Unicorn', group: 'fun', theme: THEMES.unicorn },
  { id: 'arcade', label: 'Arcade', group: 'fun', theme: THEMES.arcade },
  { id: 'pantai', label: 'Pantai', group: 'fun', theme: THEMES.pantai },
  { id: 'sultan', label: 'Sultan', group: 'fun', theme: THEMES.sultan },
  { id: 'panda', label: 'Panda', group: 'fun', theme: THEMES.panda },
  { id: 'ultah', label: 'Ultah', group: 'fun', theme: THEMES.ultah },
  { id: 'komik', label: 'Komik', group: 'fun', theme: THEMES.komik },
  { id: 'dino', label: 'Dino', group: 'fun', theme: THEMES.dino },
]

/** Resolve the theme for a frame id. */
export function getFrameTheme(id: FrameId): FrameTheme {
  return THEMES[id]
}

/**
 * Sticker layout for a frame, in strip pixels. Shared by the canvas export and
 * the CSS preview so both place the same emoji in the same spots. Every sticker
 * sits inside the padding, the gaps between photos or the footer — never over a
 * photo slot (PRD FR-11). Frames without `stickers` get an empty list.
 */
export function computeStickers(layout: StripLayout, theme: FrameTheme): Sticker[] {
  const set = theme.stickers
  const first = layout.slots[0]
  if (!set || set.length === 0 || !first) return []

  const pick = (index: number) => set[index % set.length] ?? set[0] ?? ''
  const tilt = (index: number, amount: number) => (index % 2 === 0 ? -amount : amount)
  const rowXs = Array.from(
    { length: STICKER_ROW_COUNT },
    (_, i) => first.x + (first.width / STICKER_ROW_COUNT) * (i + 0.5),
  )
  const stickers: Sticker[] = []

  // Row across the top padding.
  const topPad = first.y
  const topSize = Math.min(36, (topPad - FRAME_BORDER_WIDTH) * 0.75)
  rowXs.forEach((x, i) => {
    stickers.push({
      char: pick(i),
      x,
      y: (FRAME_BORDER_WIDTH + topPad) / 2,
      size: topSize,
      rotation: tilt(i, 0.12),
    })
  })

  // Rows centred in every gap between photos.
  for (let index = 1; index < layout.slots.length; index += 1) {
    const previous = layout.slots[index - 1]
    const current = layout.slots[index]
    if (!previous || !current) continue
    const gapTop = previous.y + previous.height
    const gapHeight = current.y - gapTop
    if (gapHeight <= 0) continue
    const size = Math.min(28, gapHeight * 0.7)
    rowXs.forEach((x, i) => {
      stickers.push({
        char: pick(i + index),
        x,
        y: gapTop + gapHeight / 2,
        size,
        rotation: tilt(i + index, 0.12),
      })
    })
  }

  // Columns down both side margins.
  const sideSize = Math.min(30, (first.x - FRAME_BORDER_WIDTH) * 0.6)
  const leftX = (FRAME_BORDER_WIDTH + first.x) / 2
  const rightX = layout.width - leftX
  const columnSpan = layout.height - first.y * 2
  const columnCount = Math.max(1, Math.floor(columnSpan / STICKER_COLUMN_STEP))
  for (let i = 0; i < columnCount; i += 1) {
    const y = first.y + (columnSpan / columnCount) * (i + 0.5)
    stickers.push({ char: pick(i), x: leftX, y, size: sideSize, rotation: tilt(i, 0.18) })
    stickers.push({ char: pick(i + 1), x: rightX, y, size: sideSize, rotation: tilt(i + 1, 0.18) })
  }

  // One big sticker on each side of the footer text.
  const footerMidY = layout.footer.y + layout.footer.height / 2
  stickers.push({
    char: pick(0),
    x: layout.footer.x + 80,
    y: footerMidY,
    size: STICKER_FOOTER_SIZE,
    rotation: -0.2,
  })
  stickers.push({
    char: pick(1),
    x: layout.footer.x + layout.footer.width - 80,
    y: footerMidY,
    size: STICKER_FOOTER_SIZE,
    rotation: 0.2,
  })

  return stickers
}

/**
 * CSS twin of {@link drawPattern}, for the on-screen preview. Sizes are emitted
 * in `cqw` (the preview's container is the strip) so the motif scales with it.
 * Pair with `backgroundOrigin: 'border-box'` so the motif lines up with the canvas.
 */
export function getPatternCss(
  pattern: FramePattern,
  stripWidth: number,
): { backgroundImage: string; backgroundSize?: string } {
  const unit = (px: number) => `${((px / stripWidth) * 100).toFixed(4)}cqw`
  const { kind, color, size } = pattern
  switch (kind) {
    case 'dots':
      return {
        backgroundImage: `radial-gradient(circle closest-side, ${color} 0 33.3%, transparent 34.3%)`,
        backgroundSize: `${unit(size)} ${unit(size)}`,
      }
    case 'stripes':
      return {
        backgroundImage: `repeating-linear-gradient(90deg, ${color} 0 ${unit(size)}, transparent ${unit(size)} ${unit(size * 2)})`,
      }
    case 'checker':
      return {
        backgroundImage: `conic-gradient(${color} 25%, transparent 0 50%, ${color} 0 75%, transparent 0)`,
        backgroundSize: `${unit(size * 2)} ${unit(size * 2)}`,
      }
    case 'grid':
      return {
        backgroundImage: `linear-gradient(90deg, ${color} 0 ${unit(2)}, transparent ${unit(2)}), linear-gradient(${color} 0 ${unit(2)}, transparent ${unit(2)})`,
        backgroundSize: `${unit(size)} ${unit(size)}`,
      }
  }
}

function drawPattern(
  ctx: CanvasRenderingContext2D,
  layout: StripLayout,
  pattern: FramePattern,
): void {
  const { kind, color, size } = pattern
  ctx.fillStyle = color
  switch (kind) {
    case 'dots': {
      const radius = size / 6
      ctx.beginPath()
      for (let y = size / 2; y < layout.height; y += size) {
        for (let x = size / 2; x < layout.width; x += size) {
          ctx.moveTo(x + radius, y)
          ctx.arc(x, y, radius, 0, Math.PI * 2)
        }
      }
      ctx.fill()
      break
    }
    case 'stripes':
      for (let x = 0; x < layout.width; x += size * 2) {
        ctx.fillRect(x, 0, size, layout.height)
      }
      break
    case 'checker':
      for (let row = 0; row * size < layout.height; row += 1) {
        for (let col = 0; col * size < layout.width; col += 1) {
          if ((row + col) % 2 === 1) ctx.fillRect(col * size, row * size, size, size)
        }
      }
      break
    case 'grid':
      for (let x = 0; x < layout.width; x += size) ctx.fillRect(x, 0, 2, layout.height)
      for (let y = 0; y < layout.height; y += size) ctx.fillRect(0, y, layout.width, 2)
      break
  }
}

/**
 * Layer 1: paint the strip background (plus the optional pattern). Called
 * before the photos are drawn, so covering the slot area here is intentional
 * (photos are painted on top).
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
  if (theme.pattern) drawPattern(ctx, layout, theme.pattern)
  ctx.restore()
}

/**
 * Layer 3: paint the border, slot separators / stickers and caption. Every
 * ornament is confined to the padding/gap/footer margins — nothing is drawn
 * inside a slot rect (PRD FR-11).
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

  const stickers = computeStickers(layout, theme)

  // Accent separators, centred inside each vertical gap between slots. Sticker
  // frames put emoji in the gaps instead.
  if (stickers.length === 0) {
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
  }

  // Stickers.
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const sticker of stickers) {
    ctx.font = `${Math.round(sticker.size)}px ${EMOJI_FONT_FAMILY}`
    ctx.save()
    ctx.translate(sticker.x, sticker.y)
    ctx.rotate(sticker.rotation)
    ctx.fillText(sticker.char, 0, 0)
    ctx.restore()
  }

  // Footer text, centred inside the footer margin: tagline above the date when
  // the frame has one, otherwise just the date.
  const centerX = layout.footer.x + layout.footer.width / 2
  const centerY = layout.footer.y + layout.footer.height / 2
  ctx.fillStyle = theme.text
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (theme.tagline) {
    ctx.font = `800 ${FRAME_TAGLINE_FONT_PX}px system-ui, -apple-system, "Segoe UI", sans-serif`
    ctx.fillText(theme.tagline, centerX, centerY - 22)
    if (meta.caption) {
      ctx.font = `600 ${FRAME_DATE_FONT_PX}px system-ui, -apple-system, "Segoe UI", sans-serif`
      ctx.fillText(meta.caption, centerX, centerY + 42)
    }
  } else if (meta.caption) {
    ctx.font = `600 ${FRAME_CAPTION_FONT_PX}px system-ui, -apple-system, "Segoe UI", sans-serif`
    ctx.fillText(meta.caption, centerX, centerY)
  }

  ctx.restore()
}
