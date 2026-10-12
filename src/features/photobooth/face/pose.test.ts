import { describe, expect, it } from 'vitest'
import { Matrix4, Quaternion, Vector3 } from 'three'
import { PoseSmoother, quaternionFromDegrees } from './pose'

function poseArray(position: Vector3, rotation: Quaternion): number[] {
  return new Matrix4().compose(position, rotation, new Vector3(1, 1, 1)).toArray()
}

const identity = new Quaternion()

describe('PoseSmoother', () => {
  it('passes the first pose straight through', () => {
    const smoother = new PoseSmoother(0.5)
    const out = smoother.update(poseArray(new Vector3(1, 2, -30), identity), new Matrix4())
    const position = new Vector3().setFromMatrixPosition(out)
    expect(position.x).toBeCloseTo(1, 5)
    expect(position.y).toBeCloseTo(2, 5)
    expect(position.z).toBeCloseTo(-30, 5)
  })

  it('blends later poses towards the new value', () => {
    const smoother = new PoseSmoother(0.5)
    smoother.update(poseArray(new Vector3(0, 0, -30), identity), new Matrix4())
    const out = smoother.update(poseArray(new Vector3(10, 0, -30), identity), new Matrix4())
    expect(new Vector3().setFromMatrixPosition(out).x).toBeCloseTo(5, 5)
  })

  it('slerps rotation instead of blending matrix entries', () => {
    const smoother = new PoseSmoother(0.5)
    const yaw = (deg: number) => new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), (deg * Math.PI) / 180)
    smoother.update(poseArray(new Vector3(), yaw(0)), new Matrix4())
    const out = smoother.update(poseArray(new Vector3(), yaw(60)), new Matrix4())
    const q = new Quaternion().setFromRotationMatrix(out)
    const angle = 2 * Math.acos(Math.min(1, Math.abs(q.w)))
    expect((angle * 180) / Math.PI).toBeCloseTo(30, 3)
    // Still a proper rotation (no shear / shrink): unit scale.
    expect(new Vector3().setFromMatrixScale(out).x).toBeCloseTo(1, 5)
  })

  it('forgets history on reset so a returning face does not glide in', () => {
    const smoother = new PoseSmoother(0.5)
    smoother.update(poseArray(new Vector3(0, 0, -30), identity), new Matrix4())
    smoother.reset()
    const out = smoother.update(poseArray(new Vector3(40, 0, -30), identity), new Matrix4())
    expect(new Vector3().setFromMatrixPosition(out).x).toBeCloseTo(40, 5)
  })
})

describe('quaternionFromDegrees', () => {
  it('is the identity for no rotation', () => {
    const q = quaternionFromDegrees([0, 0, 0])
    expect(q.angleTo(identity)).toBeCloseTo(0, 6)
  })

  it('rotates about a single axis by the given angle', () => {
    const q = quaternionFromDegrees([0, 90, 0])
    const rotated = new Vector3(0, 0, 1).applyQuaternion(q)
    expect(rotated.x).toBeCloseTo(1, 5)
    expect(rotated.z).toBeCloseTo(0, 5)
  })
})
