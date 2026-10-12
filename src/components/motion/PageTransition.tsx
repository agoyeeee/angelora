import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useRouterState } from '@tanstack/react-router'
import { EASE_FLUID, pageEnterDuration } from './variants'

/**
 * Wraps the router <Outlet /> and replays a short enter animation on every
 * navigation. Keyed by pathname so React remounts the wrapper per route.
 *
 * Enter only (no exit) on purpose: it keeps the router's immediate content swap
 * intact and matches the PRD §7.5 "page enter" budget. Transform animation is
 * suppressed by the root <MotionConfig reducedMotion="user"> when the OS asks
 * for reduced motion; opacity still crossfades so the transition stays legible.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0.2 : pageEnterDuration,
        ease: EASE_FLUID,
      }}
    >
      {children}
    </motion.div>
  )
}
