import { describe, expect, it, vi } from 'vitest'
import {
  FRAMES,
  computeStickers,
  drawFrameBackground,
  drawFrameForeground,
  getFrameTheme,
  getPatternCss,
} from './frames'
import { computeStripLayout } from './canvas-composer'
import type { Rect } from './canvas-composer'

type RecordedRect = { x: number; y: number; width: number; height: number }

/** Minimal recording 2D context: enough for the frame drawing paths. */
function createRecordingContext() {
  const fillRects: RecordedRect[] = []
  const strokeRects: RecordedRect[] = []
  const texts: string[] = []
  const context = {
    canvas: document.createElement('canvas'),
    filter: 'none',
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    moveTo: vi.fn(),
    arc: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn((x: number, y: number, width: number, height: number) => {
      fillRects.push({ x, y, width, height })
    }),
    strokeRect: vi.fn((x: number, y: number, width: number, height: number) => {
      strokeRects.push({ x, y, width, height })
    }),
    fillText: vi.fn((text: string) => {
      texts.push(text)
    }),
    measureText: vi.fn(() => ({ width: 0 })),
  }
  return {
    ctx: context as unknown as CanvasRenderingContext2D,
    fillRects,
    strokeRects,
    texts,
  }
}

function overlaps(a: RecordedRect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

describe('FRAMES', () => {
  it('keeps the four classic frames first, in order', () => {
    const classic = FRAMES.filter((frame) => frame.group === 'classic')
    expect(classic.map((frame) => frame.id)).toEqual(['clean', 'midnight', 'lavender', 'peach'])
    expect(FRAMES.slice(0, 4)).toEqual(classic)
  })

  it('ships a generous set of funny frames', () => {
    expect(FRAMES.filter((frame) => frame.group === 'fun').length).toBeGreaterThanOrEqual(12)
  })

  it('has unique ids and labels', () => {
    expect(new Set(FRAMES.map((frame) => frame.id)).size).toBe(FRAMES.length)
    expect(new Set(FRAMES.map((frame) => frame.label)).size).toBe(FRAMES.length)
  })

  it('provides complete themes for every frame', () => {
    for (const frame of FRAMES) {
      const theme = getFrameTheme(frame.id)
      expect(theme).toBe(frame.theme)
      for (const color of [theme.background, theme.border, theme.accent, theme.text]) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
      if (theme.pattern) expect(theme.pattern.color).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('gives every fun frame stickers, a pattern and a short tagline', () => {
    for (const frame of FRAMES.filter((option) => option.group === 'fun')) {
      expect(frame.theme.stickers?.length, frame.id).toBeGreaterThanOrEqual(2)
      expect(frame.theme.pattern, frame.id).toBeDefined()
      expect(frame.theme.tagline, frame.id).toBeTruthy()
      // Must fit between the two footer stickers at the tagline font size.
      expect(frame.theme.tagline?.length, frame.id).toBeLessThanOrEqual(22)
    }
  })
})

describe('computeStickers', () => {
  it('returns nothing for frames without stickers', () => {
    const layout = computeStripLayout(4)
    for (const id of ['clean', 'midnight', 'lavender', 'peach'] as const) {
      expect(computeStickers(layout, getFrameTheme(id))).toEqual([])
    }
  })

  it('keeps every sticker out of the photo slots and inside the strip', () => {
    for (const count of [3, 4] as const) {
      const layout = computeStripLayout(count)
      for (const frame of FRAMES.filter((option) => option.group === 'fun')) {
        const stickers = computeStickers(layout, frame.theme)
        expect(stickers.length, frame.id).toBeGreaterThan(0)
        for (const sticker of stickers) {
          const half = sticker.size / 2
          const box = { x: sticker.x - half, y: sticker.y - half, width: sticker.size, height: sticker.size }
          expect(box.x, frame.id).toBeGreaterThanOrEqual(0)
          expect(box.y, frame.id).toBeGreaterThanOrEqual(0)
          expect(box.x + box.width, frame.id).toBeLessThanOrEqual(layout.width)
          expect(box.y + box.height, frame.id).toBeLessThanOrEqual(layout.height)
          for (const slot of layout.slots) {
            expect(overlaps(box, slot), `${frame.id} sticker at ${sticker.x},${sticker.y}`).toBe(false)
          }
        }
      }
    }
  })
})

describe('getPatternCss', () => {
  it('emits a CSS background for every pattern kind', () => {
    for (const kind of ['dots', 'stripes', 'checker', 'grid'] as const) {
      const css = getPatternCss({ kind, color: '#112233', size: 40 }, 1200)
      expect(css.backgroundImage).toContain('#112233')
      expect(css.backgroundImage).toContain('gradient')
    }
  })
})

describe('drawFrameBackground', () => {
  it('fills the entire strip with the theme background', () => {
    const layout = computeStripLayout(4)
    const { ctx, fillRects } = createRecordingContext()
    drawFrameBackground(ctx, layout, 'midnight')
    expect(fillRects[0]).toEqual({
      x: 0,
      y: 0,
      width: layout.width,
      height: layout.height,
    })
    expect(ctx.filter).toBe('none')
  })
})

describe('drawFrameForeground', () => {
  it('draws the caption inside the footer', () => {
    const layout = computeStripLayout(3)
    const { ctx, texts } = createRecordingContext()
    drawFrameForeground(ctx, layout, 'clean', { caption: 'flashframe-2026-10-12' })
    expect(texts).toContain('flashframe-2026-10-12')
  })

  it('never paints ornaments over the photo slots', () => {
    const layout = computeStripLayout(4)
    const { ctx, fillRects } = createRecordingContext()
    drawFrameForeground(ctx, layout, 'lavender')
    for (const rect of fillRects) {
      for (const slot of layout.slots) {
        expect(overlaps(rect, slot)).toBe(false)
      }
    }
  })

  it('draws no text when no caption is supplied', () => {
    const layout = computeStripLayout(3)
    const { ctx, texts } = createRecordingContext()
    drawFrameForeground(ctx, layout, 'peach')
    expect(texts).toHaveLength(0)
  })

  it('prints a tagline above the date for funny frames and keeps ornaments off the photos', () => {
    const layout = computeStripLayout(4)
    const { ctx, texts, fillRects } = createRecordingContext()
    drawFrameForeground(ctx, layout, 'kucing', { caption: 'flashframe-2026-10-12' })
    expect(texts).toContain('Meong Squad')
    expect(texts).toContain('flashframe-2026-10-12')
    expect(texts).toContain('🐱')
    for (const rect of fillRects) {
      for (const slot of layout.slots) {
        expect(overlaps(rect, slot)).toBe(false)
      }
    }
  })

  it('skips the plain accent bars on sticker frames', () => {
    const layout = computeStripLayout(3)
    const { ctx, fillRects } = createRecordingContext()
    drawFrameForeground(ctx, layout, 'pizza')
    expect(fillRects).toHaveLength(0)
  })
})
