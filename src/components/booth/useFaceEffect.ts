import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { drawEffect } from '../../features/photobooth/face/effects'
import { createFaceTracker } from '../../features/photobooth/face/face-tracker'
import type { FaceTracker } from '../../features/photobooth/face/face-tracker'
import type { FaceGeometry } from '../../features/photobooth/face/geometry'
import type { EffectId } from '../../features/photobooth/types'

export type FaceEffectStatus = 'off' | 'loading' | 'tracking' | 'no-face' | 'error'

export type UseFaceEffectOptions = {
  videoRef: RefObject<HTMLVideoElement | null>
  effect: EffectId
  /** True once the camera is live and delivering frames. */
  active: boolean
}

/**
 * Drives a face-tracked AR effect: tracks the face in the live `<video>` every
 * frame, paints the effect on an overlay `<canvas>` that sits exactly over the
 * video, and exposes {@link drawOverlay} so the same effect can be baked into
 * each captured shot.
 *
 * The tracker (MediaPipe) is only loaded once an effect is actually chosen, and
 * is closed when the booth unmounts.
 */
export function useFaceEffect({ videoRef, effect, active }: UseFaceEffectOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const trackerRef = useRef<FaceTracker | null>(null)
  const loadingRef = useRef<Promise<FaceTracker> | null>(null)
  const geometryRef = useRef<FaceGeometry | null>(null)
  const effectRef = useRef<EffectId>(effect)
  const [status, setStatus] = useState<FaceEffectStatus>('off')

  useEffect(() => {
    effectRef.current = effect
  }, [effect])

  useEffect(
    () => () => {
      trackerRef.current?.close()
      trackerRef.current = null
      loadingRef.current = null
    },
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const clear = () => {
      geometryRef.current = null
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    if (effect === 'none' || !active) {
      clear()
      return undefined
    }

    let cancelled = false
    let frame = 0

    const loop = (tracker: FaceTracker) => {
      frame = requestAnimationFrame(() => loop(tracker))
      const video = videoRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !video || !ctx || video.readyState < 2 || video.videoWidth <= 0) return

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }

      const geometry = tracker.detect(video)
      geometryRef.current = geometry
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (geometry) drawEffect(ctx, effect, geometry, performance.now())
      setStatus(geometry ? 'tracking' : 'no-face')
    }

    const start = async () => {
      setStatus(trackerRef.current ? 'no-face' : 'loading')
      try {
        if (!trackerRef.current) {
          loadingRef.current ??= createFaceTracker()
          trackerRef.current = await loadingRef.current
        }
        if (cancelled) return
        loop(trackerRef.current)
      } catch {
        loadingRef.current = null
        if (!cancelled) setStatus('error')
      }
    }
    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      clear()
    }
  }, [effect, active, videoRef])

  /** Paint the current effect onto a capture canvas of `width` x `height`. */
  const drawOverlay = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const geometry = geometryRef.current
      const video = videoRef.current
      const id = effectRef.current
      if (!geometry || !video || id === 'none' || video.videoWidth <= 0) return
      ctx.save()
      ctx.scale(width / video.videoWidth, height / video.videoHeight)
      drawEffect(ctx, id, geometry, performance.now())
      ctx.restore()
    },
    [videoRef],
  )

  // No effect / no live camera always reads as off, whatever the last state was.
  const visibleStatus: FaceEffectStatus = effect === 'none' || !active ? 'off' : status

  return { canvasRef, status: visibleStatus, drawOverlay }
}
