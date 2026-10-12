/**
 * Where each 3D face filter sits on the head. Coordinates are canonical-face
 * centimetres (see `canonical.ts`); the scene fits each model to `size` and
 * attaches it to the tracked head pose.
 *
 * Model credits and licences: `public/models/filters/CREDITS.md`.
 */

import type { Object3D } from 'three'
import { ANCHORS } from './canonical'
import type { Vec3 } from './canonical'
import { buildClownNose, buildHalo, buildHeart, buildMustache } from './procedural'
import type { EffectId } from '../types'

export type PartSpec = {
  /** File name under `public/models/filters/`. */
  model?: string
  /** Procedural alternative to `model`. */
  build?: () => Object3D
  /** Position in canonical face space (cm). */
  position: Vec3
  /** Euler rotation in degrees (applied about the pivot). */
  rotation?: Vec3
  /** Real-world size in cm of the model's bounding box along `fit`. */
  size: number
  /** Axis `size` refers to, measured on the model as authored. Default 'x'. */
  fit?: 'x' | 'y' | 'z'
  /** Extra per-axis stretch on top of `size` (e.g. to squash a tall model). */
  scale?: Vec3
  /** Pivot as a fraction of the bounding box from its centre (e.g. [0,-0.5,0] = bottom-centre). */
  pivot?: Vec3
}

export type EffectSpec = {
  parts: PartSpec[]
  /** Set false to disable head occlusion (e.g. for things floating in front). */
  occlude?: boolean
}

/** Front-centre of the bounding box: glasses sit with their lens plane at `position`. */
const FRONT: Vec3 = [0, 0, 0.5]
/** Bottom-centre of the bounding box: hats sit on `position`. */
const BOTTOM: Vec3 = [0, -0.5, 0]

/** Glasses: lens plane just in front of the eyes, arms running back to the ears. */
const glasses = (model: string, size: number, extra: Partial<PartSpec> = {}): EffectSpec => ({
  parts: [{ model, position: [0, 2.7, 5.6], size, pivot: FRONT, ...extra }],
})

/** Hats: base resting on the head, tilted back a little. */
const hat = (model: string, size: number, extra: Partial<PartSpec> = {}): EffectSpec => ({
  parts: [{ model, position: [0, 8.2, -0.8], rotation: [-8, 0, 0], size, pivot: BOTTOM, ...extra }],
})

export const EFFECT_SPECS: Record<Exclude<EffectId, 'none'>, EffectSpec> = {
  shades: glasses('shades.glb', 14.5),
  wayfarer: glasses('wayfarer.glb', 14.5),
  pixel: glasses('pixel.glb', 14.5),
  // Authored facing +X, so fit the width on z and turn it to face the camera.
  heartglasses: glasses('heartglasses.glb', 14.5, {
    fit: 'z',
    pivot: [0.5, 0, 0],
    rotation: [0, -90, 0],
  }),

  crown: hat('crown.glb', 13.5, { position: [0, 9.2, 0.4] }),
  cat: hat('cat.glb', 15.5, { position: [0, 9.2, 0.6] }),
  bunny: hat('bunny.glb', 14, { position: [0, 9.2, 0.2] }),
  antlers: hat('antlers.glb', 22, { position: [0, 6.9, -0.4] }),

  halo: {
    occlude: false,
    parts: [{ build: buildHalo, position: [0, 13.6, -0.5], rotation: [-8, 0, 0], size: 11 }],
  },
  clown: {
    parts: [{ build: buildClownNose, position: [0, -0.9, 8.1], size: 3.4 }],
  },
  mustache: {
    parts: [{ build: buildMustache, position: [0, -3.2, 6.6], size: 7.2 }],
  },
  hearts: {
    occlude: false,
    parts: [ANCHORS.eyeLeft, ANCHORS.eyeRight].map((eye) => ({
      build: buildHeart,
      position: [eye[0], eye[1], 5.6] as const,
      size: 3.8,
    })),
  },

  santa: hat('santa.glb', 18),
  // Tipped forward so the brim reads as a brim instead of an edge-on line.
  cowboy: hat('cowboy.glb', 25, { position: [0, 7.8, -0.6], rotation: [14, 0, 0] }),
  pirate: hat('pirate.glb', 24),
  viking: hat('viking.glb', 21, { position: [0, 8, -0.8] }),
  fox: hat('fox.glb', 16, { position: [0, 6.2, -0.8], scale: [1, 0.7, 1] }),
  gradcap: hat('gradcap.glb', 18, { position: [0, 5.8, -0.8] }),
  tophat: hat('tophat.glb', 20),
  wizard: hat('wizard.glb', 17, { scale: [1, 1.7, 1] }),

  // The model is taller than a real head, so squash it and skip head occlusion
  // (the band would otherwise vanish inside the cranium approximation).
  headphones: {
    occlude: false,
    parts: [{ model: 'headphones.glb', position: [0, 6, -2.4], size: 18, scale: [1, 0.85, 1] }],
  },
}
