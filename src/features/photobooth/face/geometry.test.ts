import { describe, expect, it } from 'vitest'
import { LANDMARK, geometryFromLandmarks, smoothGeometry } from './geometry'
import type { Point } from './geometry'

const W = 640
const H = 480

/** 478 landmarks, all at the centre, with the features we read placed explicitly. */
function makeLandmarks(overrides: Partial<Record<keyof typeof LANDMARK, Point>> = {}): Point[] {
  const points: Point[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }))
  const place: Record<keyof typeof LANDMARK, Point> = {
    faceLeft: { x: 0.3, y: 0.5 },
    faceRight: { x: 0.7, y: 0.5 },
    forehead: { x: 0.5, y: 0.2 },
    chin: { x: 0.5, y: 0.85 },
    nose: { x: 0.5, y: 0.55 },
    upperLip: { x: 0.5, y: 0.66 },
    lowerLip: { x: 0.5, y: 0.7 },
    irisA: { x: 0.4, y: 0.45 },
    irisB: { x: 0.6, y: 0.45 },
    eyeAOuter: { x: 0.36, y: 0.45 },
    eyeAInner: { x: 0.44, y: 0.45 },
    eyeBInner: { x: 0.56, y: 0.45 },
    eyeBOuter: { x: 0.64, y: 0.45 },
    ...overrides,
  }
  for (const [key, index] of Object.entries(LANDMARK)) {
    points[index] = place[key as keyof typeof LANDMARK]
  }
  return points
}

describe('geometryFromLandmarks', () => {
  it('reads an upright face in pixel units', () => {
    const g = geometryFromLandmarks(makeLandmarks(), W, H)
    expect(g).not.toBeNull()
    if (!g) return
    expect(g.u).toBeCloseTo(0.4 * W, 5)
    expect(g.roll).toBeCloseTo(0, 5)
    expect(g.origin.x).toBeCloseTo(0.5 * W, 5)
    expect(g.origin.y).toBeCloseTo(0.45 * H, 5)
    // Eyes sit on the local x axis, symmetric about the origin.
    expect(g.eyeA.x).toBeCloseTo(-0.1 * W, 5)
    expect(g.eyeB.x).toBeCloseTo(0.1 * W, 5)
    expect(g.eyeA.y).toBeCloseTo(0, 5)
    // Forehead above the eyes (negative), nose and chin below (positive).
    expect(g.forehead.y).toBeLessThan(0)
    expect(g.nose.y).toBeGreaterThan(0)
    expect(g.chin.y).toBeGreaterThan(g.nose.y)
  })

  it('keeps eyeA on the smaller x even if the iris points come swapped', () => {
    const g = geometryFromLandmarks(
      makeLandmarks({ irisA: { x: 0.6, y: 0.45 }, irisB: { x: 0.4, y: 0.45 } }),
      W,
      H,
    )
    expect(g?.eyeA.x).toBeLessThan(g?.eyeB.x ?? 0)
  })

  it('reports head roll and keeps features aligned to the tilted frame', () => {
    // Tilt the eye line by moving the right eye lower.
    const g = geometryFromLandmarks(
      makeLandmarks({ irisA: { x: 0.4, y: 0.4 }, irisB: { x: 0.6, y: 0.5 } }),
      W,
      H,
    )
    expect(g).not.toBeNull()
    if (!g) return
    const expected = Math.atan2(0.1 * H, 0.2 * W)
    expect(g.roll).toBeCloseTo(expected, 5)
    // In the head frame both eyes lie on the x axis again.
    expect(g.eyeA.y).toBeCloseTo(0, 5)
    expect(g.eyeB.y).toBeCloseTo(0, 5)
  })

  it('measures mouth opening as a fraction of the face width', () => {
    const closed = geometryFromLandmarks(
      makeLandmarks({ upperLip: { x: 0.5, y: 0.66 }, lowerLip: { x: 0.5, y: 0.66 } }),
      W,
      H,
    )
    const open = geometryFromLandmarks(makeLandmarks(), W, H)
    expect(closed?.mouthOpen).toBeCloseTo(0, 5)
    // 0.04 of the frame height (19.2px) over a 256px-wide face.
    expect(open?.mouthOpen).toBeCloseTo((0.04 * H) / (0.4 * W), 5)
  })

  it('falls back to eye corners when there are no iris points', () => {
    const g = geometryFromLandmarks(makeLandmarks().slice(0, 468), W, H)
    expect(g).not.toBeNull()
    expect(g?.origin.x).toBeCloseTo(0.5 * W, 5)
  })

  it('returns null for too few landmarks or an empty frame', () => {
    expect(geometryFromLandmarks(makeLandmarks().slice(0, 100), W, H)).toBeNull()
    expect(geometryFromLandmarks(makeLandmarks(), 0, H)).toBeNull()
  })
})

describe('smoothGeometry', () => {
  it('passes the first sample through and blends later ones', () => {
    const a = geometryFromLandmarks(makeLandmarks(), W, H)
    const b = geometryFromLandmarks(
      makeLandmarks({ faceLeft: { x: 0.2, y: 0.5 }, faceRight: { x: 0.8, y: 0.5 } }),
      W,
      H,
    )
    if (!a || !b) throw new Error('geometry missing')
    expect(smoothGeometry(null, a, 0.5)).toBe(a)
    const mid = smoothGeometry(a, b, 0.5)
    expect(mid.u).toBeCloseTo((a.u + b.u) / 2, 5)
    expect(smoothGeometry(a, b, 1).u).toBeCloseTo(b.u, 5)
  })
})
