import type { RefObject } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CameraOff, FlipHorizontal, LoaderCircle } from 'lucide-react'
import type { CameraStatus } from '../../features/photobooth/types'
import { cn } from '../../lib/utils'
import { EASE_FLUID } from '../motion/variants'
import { CountdownOverlay } from './CountdownOverlay'

export type CameraStageProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  status: CameraStatus
  isVideoReady: boolean
  /** Fixed frame ratio derived from the live video orientation. */
  aspect: '4 / 3' | '3 / 4'
  mirrorPreview: boolean
  countdownValue: number | null
  /** White capture flash flag (80–120ms). */
  flash: boolean
  cameraLabel: string | null
}

/** Decorative corner brackets that read as viewfinder marks (PRD §7.1). */
function CornerBrackets() {
  const corner = 'pointer-events-none absolute size-6 border-lavender-300/45'
  return (
    <div aria-hidden className="pointer-events-none absolute inset-3">
      <span className={cn(corner, 'left-0 top-0 rounded-tl-md border-l-2 border-t-2')} />
      <span className={cn(corner, 'right-0 top-0 rounded-tr-md border-r-2 border-t-2')} />
      <span className={cn(corner, 'bottom-0 left-0 rounded-bl-md border-b-2 border-l-2')} />
      <span className={cn(corner, 'bottom-0 right-0 rounded-br-md border-b-2 border-r-2')} />
    </div>
  )
}

/** Short white flash confirming a capture (FR-08 / PRD §7.5, 80–120ms). */
function CaptureFlash({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="capture-flash"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.88 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.09, ease: EASE_FLUID }}
          className="pointer-events-none absolute inset-0 bg-white"
        />
      ) : null}
    </AnimatePresence>
  )
}

/**
 * The live preview surface: a fixed-ratio frame with the `<video>` element,
 * a camera-off / warming-up placeholder, viewfinder brackets, a live badge,
 * the countdown overlay and the capture flash.
 *
 * The `<video>` is always mounted so the stream can be attached the moment a
 * session starts; state layers sit on top of it.
 */
export function CameraStage({
  videoRef,
  status,
  isVideoReady,
  aspect,
  mirrorPreview,
  countdownValue,
  flash,
  cameraLabel,
}: CameraStageProps) {
  const live = status === 'ready'

  return (
    <div className="relative overflow-hidden rounded-card border border-white/10 bg-ink-950 shadow-panel">
      <div className="relative" style={{ aspectRatio: aspect }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="Live camera preview"
          className="absolute inset-0 size-full object-cover"
          style={mirrorPreview ? { transform: 'scaleX(-1)' } : undefined}
        />

        {!live ? (
          <div className="absolute inset-0 grid place-items-center bg-ink-950">
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <span className="grid size-12 place-items-center rounded-full border border-white/10 bg-ink-900 text-fog-500">
                <CameraOff className="size-6" aria-hidden />
              </span>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-fog-500">
                Camera off
              </p>
            </div>
          </div>
        ) : null}

        {live && !isVideoReady ? (
          <div className="absolute inset-0 grid place-items-center bg-ink-950/70">
            <div className="flex items-center gap-3 text-fog-300">
              <LoaderCircle
                className="size-5 motion-safe:animate-spin"
                aria-hidden
              />
              <span className="text-sm font-medium">
                Getting the camera ready…
              </span>
            </div>
          </div>
        ) : null}

        <CornerBrackets />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-lavender-400/40 bg-ink-950/60 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-lavender-300 backdrop-blur-sm transition-opacity duration-300 ease-[var(--ease-fluid)]',
              live && isVideoReady ? 'opacity-100' : 'opacity-0',
            )}
          >
            <span className="size-1.5 rounded-full bg-lavender-400 motion-safe:animate-pulse" />
            Live
          </span>

          {live && cameraLabel ? (
            <span className="rounded-full border border-white/10 bg-ink-950/60 px-3 py-1 text-xs text-fog-300 backdrop-blur-sm">
              {cameraLabel}
            </span>
          ) : null}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink-950/85 to-transparent p-4">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-fog-400">
            Live preview
          </span>
          {mirrorPreview ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-fog-300">
              <FlipHorizontal className="size-3.5" aria-hidden />
              Mirrored
            </span>
          ) : null}
        </div>

        <CountdownOverlay value={countdownValue} />
        <CaptureFlash active={flash} />
      </div>
    </div>
  )
}
