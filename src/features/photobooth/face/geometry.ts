/**
 * Face geometry for the AR effects.
 *
 * Turns raw MediaPipe face-mesh landmarks (normalised 0..1, 478 points) into a
 * small, pose-aware description in *pixel* units: where the face is, how big it
 * is, how far it is tilted, and where the key features sit in a frame that
 * rotates with the head. Effects draw in that local frame, so a pair of ears
 * stays glued to the forehead when the user tilts their head.
 *
 * React-free and MediaPipe-free (it only needs `{x, y}` points), so it is
 * unit-testable without a camera or a model.
 */

export type Point = { x: number; y: number }

/**
 * Key features in a head-aligned frame centred between the eyes: +x runs along
 * the eye line (towards the subject's left in the raw, unmirrored video), +y
 * points down the face. Every number is in video pixels.
 */
export type FaceGeometry = {
  /** Midpoint between the eyes, in video pixels. */
  origin: Point
  /** Head roll in radians (0 = upright). */
  roll: number
  /** Face width in pixels — the unit effects scale themselves by. */
  u: number
  /** Eye centres, local. `eyeA` has the smaller x. */
  eyeA: Point
  eyeB: Point
  nose: Point
  upperLip: Point
  lowerLip: Point
  /** Top of the forehead (negative y). */
  forehead: Point
  chin: Point
  /** Lip gap as a fraction of the face width (0 = closed). */
  mouthOpen: number
}

/** MediaPipe face-mesh landmark indices used here. */
export const LANDMARK = {
  faceLeft: 234,
  faceRight: 454,
  forehead: 10,
  chin: 152,
  nose: 1,
  upperLip: 13,
  lowerLip: 14,
  irisA: 468,
  irisB: 473,
  // Eye corners, used when the model returns no iris points.
  eyeAOuter: 33,
  eyeAInner: 133,
  eyeBInner: 362,
  eyeBOuter: 263,
} as const

const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/**
 * Build a {@link FaceGeometry} from normalised landmarks.
 *
 * @param landmarks normalised (0..1) face-mesh points
 * @param width     video width in pixels
 * @param height    video height in pixels
 * @returns the geometry, or `null` when there are too few landmarks to trust
 */
export function geometryFromLandmarks(
  landmarks: readonly Point[],
  width: number,
  height: number,
): FaceGeometry | null {
  if (landmarks.length < 468 || width <= 0 || height <= 0) return null

  const px = (index: number): Point => {
    const point = landmarks[index]
    return { x: (point?.x ?? 0) * width, y: (point?.y ?? 0) * height }
  }

  const hasIris = landmarks.length >= 478
  let eyeA = hasIris ? px(LANDMARK.irisA) : mid(px(LANDMARK.eyeAOuter), px(LANDMARK.eyeAInner))
  let eyeB = hasIris ? px(LANDMARK.irisB) : mid(px(LANDMARK.eyeBInner), px(LANDMARK.eyeBOuter))
  if (eyeA.x > eyeB.x) [eyeA, eyeB] = [eyeB, eyeA]

  const u = Math.hypot(
    px(LANDMARK.faceRight).x - px(LANDMARK.faceLeft).x,
    px(LANDMARK.faceRight).y - px(LANDMARK.faceLeft).y,
  )
  if (!(u > 1)) return null

  const origin = mid(eyeA, eyeB)
  const roll = Math.atan2(eyeB.y - eyeA.y, eyeB.x - eyeA.x)
  const cos = Math.cos(-roll)
  const sin = Math.sin(-roll)
  const toLocal = (point: Point): Point => {
    const dx = point.x - origin.x
    const dy = point.y - origin.y
    return { x: dx * cos - dy * sin, y: dx * sin + dy * cos }
  }

  const upperLip = toLocal(px(LANDMARK.upperLip))
  const lowerLip = toLocal(px(LANDMARK.lowerLip))

  return {
    origin,
    roll,
    u,
    eyeA: toLocal(eyeA),
    eyeB: toLocal(eyeB),
    nose: toLocal(px(LANDMARK.nose)),
    upperLip,
    lowerLip,
    forehead: toLocal(px(LANDMARK.forehead)),
    chin: toLocal(px(LANDMARK.chin)),
    mouthOpen: Math.max(0, (lowerLip.y - upperLip.y) / u),
  }
}

const lerp = (from: number, to: number, alpha: number): number => from + (to - from) * alpha
const lerpPoint = (from: Point, to: Point, alpha: number): Point => ({
  x: lerp(from.x, to.x, alpha),
  y: lerp(from.y, to.y, alpha),
})

/**
 * Exponential smoothing between two geometries, to hide landmark jitter.
 * `alpha` is the weight of the new sample (1 = no smoothing).
 */
export function smoothGeometry(
  previous: FaceGeometry | null,
  next: FaceGeometry,
  alpha: number,
): FaceGeometry {
  if (!previous) return next
  return {
    origin: lerpPoint(previous.origin, next.origin, alpha),
    roll: lerp(previous.roll, next.roll, alpha),
    u: lerp(previous.u, next.u, alpha),
    eyeA: lerpPoint(previous.eyeA, next.eyeA, alpha),
    eyeB: lerpPoint(previous.eyeB, next.eyeB, alpha),
    nose: lerpPoint(previous.nose, next.nose, alpha),
    upperLip: lerpPoint(previous.upperLip, next.upperLip, alpha),
    lowerLip: lerpPoint(previous.lowerLip, next.lowerLip, alpha),
    forehead: lerpPoint(previous.forehead, next.forehead, alpha),
    chin: lerpPoint(previous.chin, next.chin, alpha),
    mouthOpen: lerp(previous.mouthOpen, next.mouthOpen, alpha),
  }
}
