/**
 * On-device face tracking for the 3D face filters, backed by MediaPipe's Face
 * Landmarker.
 *
 * Besides landmarks, the model returns a 4x4 *facial transformation matrix*: the
 * head's pose (rotation + translation) in camera space, in centimetres. That is
 * what the 3D scene uses to glue accessories to the user's head.
 *
 * Privacy: the WASM runtime (`/mediapipe/`, copied from node_modules at build
 * time) and the model (`/models/face_landmarker.task`) are served from this
 * site, and inference happens in the browser — no frame ever leaves the device
 * (PRD §12). The library is loaded with a dynamic import, so visitors who never
 * pick a face filter never download it.
 */

export type FaceFrame = {
  /** Column-major 4x4 head pose (canonical face space -> camera space), or null with no face. */
  matrix: Float32Array | null
}

export type FaceTracker = {
  /**
   * Run detection on the current video frame. Cheap to call every animation
   * frame: it reuses the last result when the video has not advanced.
   */
  detect(video: HTMLVideoElement): FaceFrame
  close(): void
}

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
      outputFacialTransformationMatrixes: true,
    })

  let landmarker: Awaited<ReturnType<typeof create>>
  try {
    landmarker = await create('GPU')
  } catch {
    landmarker = await create('CPU')
  }

  let lastVideoTime = -1
  let lastTimestamp = 0
  let last: FaceFrame = { matrix: null }

  return {
    detect(video) {
      if (video.readyState < 2 || video.videoWidth <= 0) return last
      // Same frame as last time: reuse the previous result.
      if (video.currentTime === lastVideoTime) return last
      lastVideoTime = video.currentTime

      // MediaPipe requires strictly increasing timestamps.
      const timestamp = Math.max(performance.now(), lastTimestamp + 1)
      lastTimestamp = timestamp

      const result = landmarker.detectForVideo(video, timestamp)
      const data = result.facialTransformationMatrixes?.[0]?.data
      last = { matrix: data ? Float32Array.from(data) : null }
      return last
    },
    close() {
      landmarker.close()
    },
  }
}
