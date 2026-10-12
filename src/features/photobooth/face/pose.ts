/**
 * Head-pose helpers for the 3D face filters. Only uses three.js *math* types, so
 * it is unit-testable without WebGL.
 */

import { Matrix4, Quaternion, Vector3 } from 'three'

/**
 * Smooths the tracker's head-pose matrix over time to hide landmark jitter:
 * position is lerped and rotation slerped (blending raw matrices would shear).
 */
export class PoseSmoother {
  private readonly position = new Vector3()
  private readonly rotation = new Quaternion()
  private readonly scale = new Vector3(1, 1, 1)
  private readonly nextPosition = new Vector3()
  private readonly nextRotation = new Quaternion()
  private readonly nextScale = new Vector3()
  private readonly alpha: number
  private initialised = false

  constructor(alpha = 0.6) {
    this.alpha = alpha
  }

  /** Feed a raw column-major 4x4 pose; writes the smoothed pose into `target`. */
  update(raw: ArrayLike<number>, target: Matrix4): Matrix4 {
    target.fromArray(raw as number[])
    target.decompose(this.nextPosition, this.nextRotation, this.nextScale)
    if (!this.initialised) {
      this.position.copy(this.nextPosition)
      this.rotation.copy(this.nextRotation)
      this.scale.copy(this.nextScale)
      this.initialised = true
    } else {
      this.position.lerp(this.nextPosition, this.alpha)
      this.rotation.slerp(this.nextRotation, this.alpha)
      this.scale.lerp(this.nextScale, this.alpha)
    }
    return target.compose(this.position, this.rotation, this.scale)
  }

  /** Forget history (call when the face is lost so the next one does not glide in). */
  reset(): void {
    this.initialised = false
  }
}

/** Euler angles in degrees -> quaternion (XYZ order), for placement specs. */
export function quaternionFromDegrees(rotation: readonly [number, number, number]): Quaternion {
  const toRad = Math.PI / 180
  const q = new Quaternion()
  // Compose X then Y then Z in the model's own axes.
  const qx = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), rotation[0] * toRad)
  const qy = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), rotation[1] * toRad)
  const qz = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), rotation[2] * toRad)
  return q.multiply(qz).multiply(qy).multiply(qx)
}
