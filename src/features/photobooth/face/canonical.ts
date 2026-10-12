/**
 * MediaPipe's canonical face model, in centimetres.
 *
 * The tracker's pose matrix maps this canonical head into camera space, so
 * anything positioned in these coordinates rides on the user's head. Axes: +x is
 * the subject's left, +y up, +z out of the face (towards the camera).
 *
 * `canonical-face.json` is the 468-vertex canonical mesh from MediaPipe
 * (Apache-2.0, google-ai-edge/mediapipe: face_geometry/data/canonical_face_model.obj),
 * converted to a compact positions/indices JSON. It doubles as an invisible
 * depth "occluder" so accessories hide correctly behind the face.
 */

import { BufferGeometry, Float32BufferAttribute } from 'three'
import canonicalFace from './canonical-face.json'

export type Vec3 = readonly [number, number, number]

/** Key points of the canonical head, in centimetres. */
export const ANCHORS = {
  /** Midpoint between the eyes. */
  eyes: [0, 2.65, 3.5],
  eyeLeft: [-3.1, 2.65, 3.5],
  eyeRight: [3.1, 2.65, 3.5],
  noseTip: [0, -1.13, 7.48],
  mouth: [0, -4.3, 5.3],
  chin: [0, -9.4, 4.26],
  /** Top of the forehead mesh (hairline). */
  forehead: [0, 8.26, 4.48],
  /** Approximate top of the skull. */
  headTop: [0, 11.5, -0.5],
  earLeft: [-7.7, 1.5, -2.4],
  earRight: [7.7, 1.5, -2.4],
} as const satisfies Record<string, Vec3>

/** Radii/centre of the cranium approximation used as a depth occluder. */
export const CRANIUM = {
  center: [0, 1.2, -3.2],
  radii: [7.3, 10.6, 8.6],
} as const satisfies Record<string, Vec3>

/** The canonical face mesh as a three.js geometry (for the depth occluder). */
export function createCanonicalFaceGeometry(): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(canonicalFace.positions, 3))
  geometry.setIndex(canonicalFace.indices)
  return geometry
}
