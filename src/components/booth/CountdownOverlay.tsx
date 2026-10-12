import { AnimatePresence, motion } from 'motion/react'
import { EASE_FLUID } from '../motion/variants'

/**
 * Large countdown number drawn over the preview (FR-06 / PRD §7.5).
 *
 * Transform + opacity only, ~220ms. The root <MotionConfig reducedMotion="user">
 * drops the scale animation for users who ask for less motion; the number still
 * crossfades. Visually decorative for screen readers — the once-per-shot
 * announcement lives in a separate live region on the page.
 */
export function CountdownOverlay({ value }: { value: number | null }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid place-items-center"
    >
      <AnimatePresence>
        {value !== null ? (
          <motion.span
            key={value}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.22 }}
            transition={{ duration: 0.22, ease: EASE_FLUID }}
            className="grid size-32 place-items-center rounded-full border border-lavender-400/35 bg-ink-950/45 backdrop-blur-sm sm:size-40"
          >
            <span className="font-display text-7xl font-semibold tabular-nums text-fog-100 drop-shadow-[0_10px_34px_rgba(0,0,0,0.65)] sm:text-8xl">
              {value}
            </span>
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
