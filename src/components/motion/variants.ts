import type { Transition, Variants } from 'motion/react'

/**
 * FlashFrame motion system (PRD §7.5).
 *
 * Budget:
 *  - page enter: opacity 0 -> 1, translateY 12px -> 0, 320ms
 *  - list stagger: 40-70ms (we use 55ms)
 *  - hover: translateY -2px / scale ~1.01 (do not exaggerate)
 *  - countdown (Phase 2, reserved): 180-260ms
 *  - capture flash (Phase 2, reserved): 80-120ms
 *
 * All variants are transform/opacity only — no animated blur.
 */

/** Shared easing curve (mirrors --ease-fluid in globals.css). */
export const EASE_FLUID = [0.32, 0.72, 0, 1] as const

export const pageEnterDuration = 0.32

/** Page-level enter animation (opacity + translateY only). */
export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: pageEnterDuration, ease: EASE_FLUID },
  },
}

/** Neutral fade + rise for content blocks. */
export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: EASE_FLUID },
  },
}

/** Slightly heavier rise for hero elements. */
export const fadeRiseLead: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_FLUID },
  },
}

/** Container that staggers its children on enter. */
export function staggerContainer(
  stagger = 0.055,
  delayChildren = 0.04,
): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  }
}

/** Crossfade used when switching filters / frames (PRD §7.5). */
export const crossfade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: EASE_FLUID } },
  exit: { opacity: 0, transition: { duration: 0.16, ease: EASE_FLUID } },
}

/**
 * Thumbnail entrance after a capture. Reserved for Phase 2/3 but exported now
 * so the motion language stays in one place.
 */
export const thumbnailPop: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 30,
  mass: 0.7,
}

export const thumbnailPopVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: thumbnailPop },
}
