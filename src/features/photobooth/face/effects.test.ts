import { describe, expect, it, vi } from 'vitest'
import { EFFECTS, drawEffect } from './effects'
import { LANDMARK, geometryFromLandmarks } from './geometry'
import type { FaceGeometry, Point } from './geometry'

function sampleGeometry(): FaceGeometry {
  const points: Point[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }))
  const set = (index: number, x: number, y: number) => {
    points[index] = { x, y }
  }
  set(LANDMARK.faceLeft, 0.3, 0.5)
  set(LANDMARK.faceRight, 0.7, 0.5)
  set(LANDMARK.forehead, 0.5, 0.2)
  set(LANDMARK.chin, 0.5, 0.85)
  set(LANDMARK.nose, 0.5, 0.55)
  set(LANDMARK.upperLip, 0.5, 0.66)
  set(LANDMARK.lowerLip, 0.5, 0.72)
  set(LANDMARK.irisA, 0.4, 0.45)
  set(LANDMARK.irisB, 0.6, 0.45)
  const geometry = geometryFromLandmarks(points, 640, 480)
  if (!geometry) throw new Error('sample geometry failed')
  return geometry
}

/** A context that accepts every canvas call and records what was drawn. */
function recordingContext() {
  const calls: string[] = []
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop: string) {
      if (prop in target) return target[prop]
      return (...args: unknown[]) => {
        calls.push(prop)
        void args
      }
    },
    set(target, prop: string, value) {
      target[prop] = value
      return true
    },
  }
  const ctx = new Proxy({}, handler) as unknown as CanvasRenderingContext2D
  return { ctx, calls }
}

describe('EFFECTS', () => {
  it('starts with "none", has unique ids and labels, and every entry has an icon', () => {
    expect(EFFECTS[0]?.id).toBe('none')
    expect(new Set(EFFECTS.map((e) => e.id)).size).toBe(EFFECTS.length)
    expect(new Set(EFFECTS.map((e) => e.label)).size).toBe(EFFECTS.length)
    for (const effect of EFFECTS) expect(effect.icon.length).toBeGreaterThan(0)
  })

  it('offers a generous set of effects', () => {
    expect(EFFECTS.length - 1).toBeGreaterThanOrEqual(10)
  })
})

describe('drawEffect', () => {
  it('draws nothing for "none"', () => {
    const { ctx, calls } = recordingContext()
    drawEffect(ctx, 'none', sampleGeometry())
    expect(calls).toHaveLength(0)
  })

  it('draws something for every real effect and leaves the context balanced', () => {
    const geometry = sampleGeometry()
    for (const effect of EFFECTS.filter((e) => e.id !== 'none')) {
      const { ctx, calls } = recordingContext()
      drawEffect(ctx, effect.id, geometry, 1234)
      const drawing = calls.filter((c) =>
        ['fill', 'stroke', 'fillText', 'fillRect'].includes(c),
      )
      expect(drawing.length, effect.id).toBeGreaterThan(0)
      expect(calls.filter((c) => c === 'save').length, effect.id).toBe(
        calls.filter((c) => c === 'restore').length,
      )
    }
  })

  it('moves into the head frame (translate to the eyes, rotate by the roll)', () => {
    const geometry = sampleGeometry()
    const translate = vi.fn()
    const rotate = vi.fn()
    const ctx = new Proxy(
      { translate, rotate },
      {
        get: (target, prop: string) =>
          prop in target ? target[prop as keyof typeof target] : () => undefined,
        set: () => true,
      },
    ) as unknown as CanvasRenderingContext2D
    drawEffect(ctx, 'crown', geometry)
    expect(translate).toHaveBeenCalledWith(geometry.origin.x, geometry.origin.y)
    expect(rotate).toHaveBeenCalledWith(geometry.roll)
  })
})
