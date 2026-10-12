/**
 * Small 3D props built in code (no asset download) with glossy PBR materials —
 * used for accessories that are simple solids: halo, clown nose, heart eyes,
 * mustache. They share the scene's environment lighting, so they pick up the
 * same reflections as the loaded models.
 */

import {
  ExtrudeGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import type { Object3D } from 'three'

/** A gold ring that floats above the head. */
export function buildHalo(): Object3D {
  const ring = new Mesh(
    new TorusGeometry(1, 0.13, 32, 128),
    new MeshStandardMaterial({
      color: 0xffc933,
      metalness: 1,
      roughness: 0.22,
      emissive: 0xffa800,
      emissiveIntensity: 0.35,
    }),
  )
  // Lie flat (ring plane = horizontal), like a halo seen from the front.
  ring.rotation.x = Math.PI / 2
  return ring
}

/** A glossy red clown nose. */
export function buildClownNose(): Object3D {
  return new Mesh(
    new SphereGeometry(0.5, 48, 32),
    new MeshPhysicalMaterial({
      color: 0xe3112d,
      roughness: 0.25,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
    }),
  )
}

function heartShape(): Shape {
  const shape = new Shape()
  shape.moveTo(0, -0.5)
  shape.bezierCurveTo(-0.15, -0.35, -0.6, -0.1, -0.6, 0.2)
  shape.bezierCurveTo(-0.6, 0.55, -0.2, 0.62, 0, 0.32)
  shape.bezierCurveTo(0.2, 0.62, 0.6, 0.55, 0.6, 0.2)
  shape.bezierCurveTo(0.6, -0.1, 0.15, -0.35, 0, -0.5)
  return shape
}

/** A puffy glossy 3D heart. */
export function buildHeart(): Object3D {
  const geometry = new ExtrudeGeometry(heartShape(), {
    depth: 0.35,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.16,
    bevelSegments: 10,
    curveSegments: 32,
  })
  geometry.center()
  return new Mesh(
    geometry,
    new MeshPhysicalMaterial({
      color: 0xff2b55,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: 0x8a0020,
      emissiveIntensity: 0.25,
    }),
  )
}

function mustacheShape(): Shape {
  const shape = new Shape()
  shape.moveTo(0, 0.02)
  shape.bezierCurveTo(0.1, -0.05, 0.28, -0.03, 0.34, -0.1)
  shape.bezierCurveTo(0.3, 0.06, 0.1, 0.08, 0, 0.045)
  shape.bezierCurveTo(-0.1, 0.08, -0.3, 0.06, -0.34, -0.1)
  shape.bezierCurveTo(-0.28, -0.03, -0.1, -0.05, 0, 0.02)
  return shape
}

/** A chunky handlebar mustache with rounded edges. */
export function buildMustache(): Object3D {
  const geometry = new ExtrudeGeometry(mustacheShape(), {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.025,
    bevelSegments: 6,
    curveSegments: 24,
  })
  geometry.center()
  return new Mesh(
    geometry,
    new MeshStandardMaterial({ color: 0x2f1a0c, roughness: 0.85, metalness: 0 }),
  )
}
