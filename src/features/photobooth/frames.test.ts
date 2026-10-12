import { describe, expect, it, vi } from 'vitest'
import { FRAMES, drawFrameBackground, drawFrameForeground, getFrameTheme } from './frames'
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
    scale: vi.fn(),
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
  it('lists the four PRD frames in order', () => {
    expect(FRAMES.map((frame) => frame.id)).toEqual([
      'clean',
      'midnight',
      'lavender',
      'peach',
    ])
    expect(FRAMES.map((frame) => frame.label)).toEqual([
      'Clean',
      'Midnight',
      'Lavender',
      'Peach',
    ])
  })

  it('provides complete themes for every frame', () => {
    for (const frame of FRAMES) {
      const theme = getFrameTheme(frame.id)
      expect(theme).toBe(frame.theme)
      for (const color of [theme.background, theme.border, theme.accent, theme.text]) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
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
})
