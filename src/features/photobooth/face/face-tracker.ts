/**
 * On-device face tracking for the AR effects, backed by MediaPipe's Face
 * Landmarker.
 *
 * Privacy: the WASM runtime (`/mediapipe/`, copied from node_modules at build
 * time) and the model (`/models/face_landmarker.task`) are served from this
 * site, and inference happens in the browser — no frame ever leaves the device
 * (PRD §12). The library is loaded with a dynamic import, so visitors who never
 * pick a face filter never download it.
 */

import { geometryFromLandmarks, smoothGeometry } from './geometry'
import type { FaceGeometry } from './geometry'

export type FaceTracker = {
  /**
   * Run detection on the current video frame. Returns the (smoothed) face
   * geometry, or `null` when no face is visible. Cheap to call every frame; it
   * skips work when the video has not advanced.
   */
  detect(video: HTMLVideoElement): FaceGeometry | null
  close(): void
}

const SMOOTHING_ALPHA = 0.55

const baseUrl = (): string => {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base : `${base}/`
}

/**
 * Load MediaPipe and create a single-face video tracker. Tries the GPU
 * delegate first and falls back to CPU, since GPU init fails on some devices.
 */
export async function createFaceTracker(): Promise<FaceTracker> {
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks(`${baseUrl()}mediapipe`)
  const modelAssetPath = `${baseUrl()}models/face_landmarker.task`

  const create = (delegate: 'GPU' | 'CPU') =>
    FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath, delegate },
      runningMode: 'VIDEO',
      numFaces: 1,
    })

  let landmarker: Awaited<ReturnType<typeof create>>
  try {
    landmarker = await create('GPU')
  } catch {
    landmarker = await create('CPU')
  }

  let lastVideoTime = -1
  let lastTimestamp = 0
  let smoothed: FaceGeometry | null = null

  return {
    detect(video) {
      if (video.readyState < 2 || video.videoWidth <= 0) return smoothed
      // Same frame as last time: reuse the previous result.
      if (video.currentTime === lastVideoTime) return smoothed
      lastVideoTime = video.currentTime

      // MediaPipe requires strictly increasing timestamps.
      const timestamp = Math.max(performance.now(), lastTimestamp + 1)
      lastTimestamp = timestamp

      const result = landmarker.detectForVideo(video, timestamp)
      const landmarks = result.faceLandmarks[0]
      const geometry = landmarks
        ? geometryFromLandmarks(landmarks, video.videoWidth, video.videoHeight)
        : null

      smoothed = geometry ? smoothGeometry(smoothed, geometry, SMOOTHING_ALPHA) : null
      return smoothed
    },
    close() {
      landmarker.close()
    },
  }
}
