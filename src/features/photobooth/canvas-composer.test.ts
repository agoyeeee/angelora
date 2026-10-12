import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  STRIP_WIDTH,
  composeAndExport,
  composeStrip,
  computeStripLayout,
  drawCover,
  exportStripPng,
  loadImageFromBlob,
} from './canvas-composer'
import type { Rect } from './canvas-composer'
import { getFilterCss } from './filters'
import { DEFAULT_SESSION } from './types'
import type { BoothSession, CapturedShot, ShotCount } from './types'

function makeSession(
  shotCount: ShotCount,
  overrides: Partial<BoothSession> = {},
): BoothSession {
  const shots: CapturedShot[] = Array.from({ length: shotCount }, (_, index) => ({
    id: `shot-${index}`,
    blob: new Blob(['capture']),
    capturedAt: index,
    width: 640,
    height: 480,
  }))
  return { ...DEFAULT_SESSION, shotCount, shots, ...overrides }
}

function fakeImage(width = 800, height = 600): ImageBitmap {
  return { width, height } as unknown as ImageBitmap
}

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

/** Swap the prototype getContext for the duration of a synchronous test. */
function withContext<T>(context: CanvasRenderingContext2D, run: () => T): T {
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () => context,
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext
  try {
    return run()
  } finally {
    HTMLCanvasElement.prototype.getContext = original
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('computeStripLayout', () => {
  it('uses the fixed 1200px strip width', () => {
    expect(STRIP_WIDTH).toBe(1200)
    expect(computeStripLayout(3).width).toBe(STRIP_WIDTH)
    expect(computeStripLayout(4).width).toBe(STRIP_WIDTH)
  })

  it('creates exactly one 4:3 slot per shot', () => {
    for (const count of [3, 4] as const) {
      const layout = computeStripLayout(count)
      expect(layout.slots).toHaveLength(count)
      for (const slot of layout.slots) {
        expect(Math.abs(slot.width / slot.height - 4 / 3)).toBeLessThan(1e-9)
      }
    }
  })

  it('keeps every slot inside the strip bounds', () => {
    for (const count of [3, 4] as const) {
      const layout = computeStripLayout(count)
      for (const slot of layout.slots) {
        expect(slot.x).toBeGreaterThanOrEqual(0)
        expect(slot.y).toBeGreaterThanOrEqual(0)
        expect(slot.x + slot.width).toBeLessThanOrEqual(layout.width)
        expect(slot.y + slot.height).toBeLessThanOrEqual(layout.height)
      }
    }
  })

  it('never overlaps slots', () => {
    for (const count of [3, 4] as const) {
      const { slots } = computeStripLayout(count)
      for (let i = 0; i < slots.length; i += 1) {
        const a = slots[i]
        if (!a) continue
        for (let j = i + 1; j < slots.length; j += 1) {
          const b = slots[j]
          if (!b) continue
          expect(overlaps(a, b)).toBe(false)
        }
      }
    }
  })

  it('places the footer below the last slot, inside the strip', () => {
    for (const count of [3, 4] as const) {
      const layout = computeStripLayout(count)
      const last = layout.slots[layout.slots.length - 1]
      expect(last).toBeDefined()
      if (!last) continue
      expect(layout.footer.y).toBeGreaterThanOrEqual(last.y + last.height)
      expect(layout.footer.y + layout.footer.height).toBeLessThanOrEqual(layout.height)
      expect(layout.footer.y).toBeGreaterThan(last.y + last.height)
    }
  })

  it('derives deterministic dimensions from the shot count', () => {
    expect(computeStripLayout(3)).toEqual(computeStripLayout(3))
    expect(computeStripLayout(4)).toEqual(computeStripLayout(4))
    // Documented actual dimensions.
    expect(computeStripLayout(3).height).toBe(2890)
    expect(computeStripLayout(4).height).toBe(3740)
    expect(computeStripLayout(4).height).toBeGreaterThan(computeStripLayout(3).height)
  })
})

describe('drawCover', () => {
  it('crops with cover without stretching the source', () => {
    const drawImage = vi.fn()
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      drawImage,
    } as unknown as CanvasRenderingContext2D

    drawCover(ctx, fakeImage(1000, 500), { x: 10, y: 20, width: 1080, height: 810 })

    expect(drawImage).toHaveBeenCalledTimes(1)
    const call = drawImage.mock.calls[0]
    expect(call).toBeDefined()
    const sourceAspect = 1000 / 500
    if (call) {
      const [, , , drawWidth, drawHeight] = call as [
        unknown,
        number,
        number,
        number,
        number,
      ]
      expect(drawWidth / drawHeight).toBeCloseTo(sourceAspect, 5)
      expect(drawHeight).toBeCloseTo(810, 5)
    }
  })

  it('mirrors inside the slot when mirror is requested', () => {
    const translate = vi.fn()
    const scale = vi.fn()
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate,
      scale,
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D

    drawCover(ctx, fakeImage(), { x: 60, y: 60, width: 1080, height: 810 }, true)
    expect(translate).toHaveBeenCalledWith(1140, 0)
    expect(scale).toHaveBeenCalledWith(-1, 1)
  })
})

describe('composeStrip', () => {
  it('draws once per shot and applies the session filter', () => {
    const session = makeSession(4, { filter: 'warm' })
    const layout = computeStripLayout(4)
    const drawImage = vi.fn()
    const filterHistory: string[] = []
    let currentFilter = 'none'

    const context = {
      canvas: document.createElement('canvas'),
      get filter(): string {
        return currentFilter
      },
      set filter(value: string) {
        currentFilter = value
        filterHistory.push(value)
      },
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      drawImage,
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D

    const images = Array.from({ length: 4 }, () => fakeImage())
    const canvas = withContext(context, () => composeStrip({ session, images }))

    expect(canvas.width).toBe(layout.width)
    expect(canvas.height).toBe(layout.height)
    expect(drawImage).toHaveBeenCalledTimes(4)
    expect(filterHistory).toContain(getFilterCss('warm'))
    // The last draw must leave the context unfiltered so frame layers are clean.
    expect(currentFilter).toBe('none')
  })
})

describe('exportStripPng', () => {
  it('resolves a PNG blob through toBlob', async () => {
    const canvas = document.createElement('canvas')
    const blob = await exportStripPng(canvas)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
  })

  it('rejects when the canvas cannot produce a blob', async () => {
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation((callback: BlobCallback) => callback(null))
    try {
      await expect(exportStripPng(document.createElement('canvas'))).rejects.toThrow(
        /PNG export produced no data/,
      )
    } finally {
      spy.mockRestore()
    }
  })
})

describe('composeAndExport', () => {
  it('rejects when the session shot count does not match', async () => {
    const session = makeSession(4, { shots: makeSession(3).shots })
    await expect(composeAndExport(session, [fakeImage(), fakeImage(), fakeImage()])).rejects.toThrow(
      /shotCount/,
    )
  })

  it('rejects when the image count does not match', async () => {
    const session = makeSession(3)
    await expect(composeAndExport(session, [fakeImage()])).rejects.toThrow(/images/)
  })

  it('composes and exports when counts line up', async () => {
    const session = makeSession(3)
    const images = [fakeImage(), fakeImage(), fakeImage()]
    const blob = await composeAndExport(session, images)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
  })
})

describe('loadImageFromBlob', () => {
  it('prefers createImageBitmap when available', async () => {
    const bitmap = fakeImage(10, 10)
    const createImageBitmapMock = vi.fn().mockResolvedValue(bitmap)
    vi.stubGlobal('createImageBitmap', createImageBitmapMock)

    const blob = new Blob(['image'])
    const result = await loadImageFromBlob(blob)

    expect(createImageBitmapMock).toHaveBeenCalledWith(blob)
    expect(result).toBe(bitmap)
  })
})
