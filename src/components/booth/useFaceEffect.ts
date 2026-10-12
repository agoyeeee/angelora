import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { createFaceTracker } from '../../features/photobooth/face/face-tracker'
import type { FaceTracker } from '../../features/photobooth/face/face-tracker'
import type { FaceScene } from '../../features/photobooth/face/scene3d'
import type { EffectId } from '../../features/photobooth/types'

export type FaceEffectStatus = 'off' | 'loading' | 'tracking' | 'no-face' | 'error'

export type UseFaceEffectOptions = {
  videoRef: RefObject<HTMLVideoElement | null>
  effect: EffectId
  /** True once the camera is live and delivering frames. */
  active: boolean
}

/**
 * Drives a face-tracked 3D effect: tracks the head pose in the live `<video>`
 * every frame and renders the effect with three.js onto an overlay `<canvas>`
 * that sits exactly over the video. {@link drawOverlay} copies that same render
 * into each captured shot.
 *
 * MediaPipe and three.js (plus the effect's models) are only loaded once an
 * effect is actually chosen, and are released when the booth unmounts.
 */
export function useFaceEffect({ videoRef, effect, active }: UseFaceEffectOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const trackerRef = useRef<FaceTracker | null>(null)
  const trackerLoadingRef = useRef<Promise<FaceTracker> | null>(null)
  const sceneRef = useRef<FaceScene | null>(null)
  const effectRef = useRef<EffectId>(effect)
  const [status, setStatus] = useState<FaceEffectStatus>('off')

  useEffect(() => {
    effectRef.current = effect
  }, [effect])

  useEffect(
    () => () => {
      trackerRef.current?.close()
      trackerRef.current = null
      trackerLoadingRef.current = null
      sceneRef.current?.dispose()
      sceneRef.current = null
    },
    [],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const clear = () => {
      if (canvas) sceneRef.current?.render(null, canvas.width, canvas.height)
    }

    if (effect === 'none' || !active) {
      clear()
      return undefined
    }

    let cancelled = false
    let frame = 0

    const loop = (tracker: FaceTracker, scene: FaceScene) => {
      frame = requestAnimationFrame(() => loop(tracker, scene))
      const video = videoRef.current
      if (!video || video.readyState < 2 || video.videoWidth <= 0) return

      const { matrix } = tracker.detect(video)
      scene.render(matrix, video.videoWidth, video.videoHeight)
      setStatus(matrix ? 'tracking' : 'no-face')
    }

    const start = async () => {
      setStatus('loading')
      try {
        if (!trackerRef.current) {
          trackerLoadingRef.current ??= createFaceTracker()
          trackerRef.current = await trackerLoadingRef.current
        }
        if (!sceneRef.current && canvas) {
          const { createFaceScene } = await import('../../features/photobooth/face/scene3d')
          sceneRef.current ??= createFaceScene(canvas)
        }
        const scene = sceneRef.current
        if (!scene || cancelled) return
        await scene.setEffect(effect)
        if (cancelled) return
        loop(trackerRef.current, scene)
      } catch {
        trackerLoadingRef.current = null
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

  /** Copy the current effect render onto a capture canvas of `width` x `height`. */
  const drawOverlay = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const canvas = canvasRef.current
    if (!canvas || effectRef.current === 'none' || canvas.width <= 0 || canvas.height <= 0) return
    ctx.drawImage(canvas, 0, 0, width, height)
  }, [])

  // No effect / no live camera always reads as off, whatever the last state was.
  const visibleStatus: FaceEffectStatus = effect === 'none' || !active ? 'off' : status

  return { canvasRef, status: visibleStatus, drawOverlay }
}
