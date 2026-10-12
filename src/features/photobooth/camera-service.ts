/**
 * Camera service — React-free (PRD §10).
 *
 * Wraps `navigator.mediaDevices.getUserMedia()` and Canvas capture so the UI can
 * stay thin and this module stays unit-testable. No React / router / motion
 * imports here on purpose (ESLint enforces it).
 *
 * Camera principles honoured here (PRD §9.3):
 * - only request a video track, never audio;
 * - error names are mapped to friendly, retryable statuses (no raw stack traces);
 * - every track is stopped on cleanup;
 * - capture waits until the video reports real dimensions.
 */

import type { CameraErrorStatus, CapturedShot } from './types'

/** Options for {@link startCamera}. */
export type StartCameraOptions = {
  deviceId?: string
  facingMode?: 'user' | 'environment'
}

/** Friendly, actionable copy keyed by camera status (PRD §11). */
export type CameraMessage = {
  title: string
  guidance: string
  canRetry: boolean
}

export type CameraMessageKey = 'idle' | 'requesting' | 'ready' | CameraErrorStatus

/**
 * Error thrown by {@link startCamera}. Carries the mapped {@link CameraErrorStatus}
 * so callers can branch without parsing messages or leaking raw browser errors.
 */
export class CameraAccessError extends Error {
  readonly status: CameraErrorStatus

  constructor(status: CameraErrorStatus, options?: { cause?: unknown }) {
    super(`Camera access failed: ${status}`, options)
    this.name = 'CameraAccessError'
    this.status = status
  }
}

function hasGetUserMedia(): boolean {
  if (typeof navigator === 'undefined') return false
  const mediaDevices = navigator.mediaDevices
  return typeof mediaDevices?.getUserMedia === 'function'
}

/**
 * True only when the browser exposes `getUserMedia` and the page runs in a
 * secure context. `isSecureContext === false` means insecure; an undefined value
 * (some test/legacy environments) is treated as secure.
 */
export function isCameraSupported(): boolean {
  const secure =
    typeof window === 'undefined' ? true : window.isSecureContext !== false
  return hasGetUserMedia() && secure
}

function errorName(err: unknown): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const { name } = err as { name?: unknown }
    if (typeof name === 'string') return name
  }
  return ''
}

/**
 * Map a `getUserMedia`/DOM failure to a coarse, user-facing status.
 * Known browser error names win over the insecure-context heuristic.
 */
export function mapCameraError(err: unknown): CameraErrorStatus {
  const name = errorName(err)

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'denied'
    case 'NotFoundError':
    case 'OverconstrainedError':
    case 'DevicesNotFoundError':
      return 'no-device'
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'busy'
    case 'SecurityError':
      return 'unsupported'
    case 'TypeError':
      // `getUserMedia` being absent (insecure context / old browser) throws a
      // TypeError at call time.
      return hasGetUserMedia() ? 'error' : 'unsupported'
    default:
      break
  }

  // Insecure context (e.g. plain HTTP origin) blocks camera access entirely.
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return 'unsupported'
  }

  return 'error'
}

export const CAMERA_MESSAGES: Record<CameraMessageKey, CameraMessage> = {
  idle: {
    title: 'Camera is off',
    guidance:
      'Start a session when you are ready. Your camera stays off until you allow it.',
    canRetry: false,
  },
  requesting: {
    title: 'Requesting camera access',
    guidance:
      'Approve the browser prompt so FlashFrame can use your camera. Nothing leaves your device.',
    canRetry: false,
  },
  ready: {
    title: 'Camera ready',
    guidance: 'Your camera is live. Find your light and strike a pose.',
    canRetry: false,
  },
  unsupported: {
    title: "Camera isn't available in this browser",
    guidance:
      'This browser cannot access the camera, or the page is not served over a secure (HTTPS) connection. Try the latest Chrome, Safari, or Firefox over HTTPS.',
    canRetry: false,
  },
  denied: {
    title: 'Camera permission is blocked',
    guidance:
      'Open your browser settings via the lock or camera icon in the address bar, set Camera to Allow, then choose Try again.',
    canRetry: true,
  },
  'no-device': {
    title: 'No camera found',
    guidance:
      'We could not find a camera on this device. Connect a webcam or try another device, then choose Try again.',
    canRetry: true,
  },
  busy: {
    title: 'Camera is busy',
    guidance:
      'Another app or tab is using the camera. Close it, then choose Try again.',
    canRetry: true,
  },
  error: {
    title: 'Something went wrong with the camera',
    guidance:
      'We could not start the camera. Make sure no other app is using it, then choose Try again.',
    canRetry: true,
  },
}

function buildVideoConstraints(
  opts: StartCameraOptions,
): MediaTrackConstraints | true {
  if (opts.deviceId) {
    return { deviceId: { exact: opts.deviceId } }
  }
  if (opts.facingMode) {
    return { facingMode: { ideal: opts.facingMode } }
  }
  return true
}

/**
 * Request a video-only stream. Rejects with {@link CameraAccessError} carrying a
 * mapped status when the browser denies or cannot start the camera.
 */
export async function startCamera(
  opts: StartCameraOptions = {},
): Promise<MediaStream> {
  if (!isCameraSupported()) {
    throw new CameraAccessError('unsupported')
  }

  const constraints: MediaStreamConstraints = {
    video: buildVideoConstraints(opts),
    audio: false,
  }

  try {
    return await navigator.mediaDevices.getUserMedia(constraints)
  } catch (err) {
    throw new CameraAccessError(mapCameraError(err), { cause: err })
  }
}

/** Stop every track of a stream so the camera indicator turns off (PRD §9.3). */
export function stopStream(stream?: MediaStream | null): void {
  if (!stream) return
  for (const track of stream.getTracks()) {
    track.stop()
  }
}

/** List available video input devices. Returns `[]` when enumeration is unavailable. */
export async function listVideoInputs(): Promise<MediaDeviceInfo[]> {
  if (typeof navigator === 'undefined') return []
  const mediaDevices = navigator.mediaDevices
  if (typeof mediaDevices?.enumerateDevices !== 'function') return []

  const devices = await mediaDevices.enumerateDevices()
  return devices.filter((device) => device.kind === 'videoinput')
}

function hasVideoDimensions(video: HTMLVideoElement): boolean {
  return video.videoWidth > 0 && video.videoHeight > 0
}

/**
 * Resolve once the video element reports real frame dimensions, so capture never
 * draws a 0×0 frame (PRD §9.3 / FR-07).
 *
 * Resolves immediately when dimensions are already available, otherwise on the
 * `loadedmetadata` event. Rejects on the media `error` event or after
 * `timeoutMs`.
 */
export function waitForVideoReady(
  video: HTMLVideoElement,
  timeoutMs = 8000,
): Promise<void> {
  if (hasVideoDimensions(video)) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    let settled = false

    const cleanup = (): void => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('error', onError)
      clearTimeout(timer)
    }

    const finish = (fn: () => void): void => {
      if (settled) return
      settled = true
      cleanup()
      fn()
    }

    function onLoadedMetadata(): void {
      finish(resolve)
    }

    function onError(): void {
      finish(() =>
        reject(new Error('The video element reported an error before it was ready.')),
      )
    }

    const timer = setTimeout(() => {
      finish(() =>
        reject(
          new Error(
            `The camera video was not ready within ${timeoutMs}ms. It may still be waking up; try again.`,
          ),
        ),
      )
    }, timeoutMs)

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('error', onError)
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type)
  })
}

/** Generate a shot id, preferring `crypto.randomUUID` with a safe fallback. */
export function createShotId(): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    try {
      return cryptoApi.randomUUID()
    } catch {
      // Fall through to the manual id below.
    }
  }
  const random = Math.random().toString(36).slice(2, 10)
  return `shot-${Date.now().toString(36)}-${random}`
}

/**
 * Capture the current video frame to a PNG Blob.
 *
 * Scales down to `maxWidth` when given (never upscales), preserving aspect ratio,
 * and applies an optional horizontal mirror. Throws instead of returning an empty
 * shot when the video is not ready or `toBlob` yields null (PRD §11: capture
 * failure must not add a blank shot).
 */
export async function captureFrame(
  video: HTMLVideoElement,
  opts: {
    mirror?: boolean
    maxWidth?: number
    /**
     * Paints extra content (e.g. a face effect) over the video frame. Called in
     * the canvas' own pixel space before any mirror is undone, so the overlay
     * is mirrored together with the video.
     */
    overlay?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
  } = {},
): Promise<CapturedShot> {
  const sourceWidth = video.videoWidth
  const sourceHeight = video.videoHeight

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error(
      'Cannot capture: the video has no frame dimensions yet. Wait for the camera to be ready and try again.',
    )
  }

  const maxWidth = opts.maxWidth
  const scale =
    maxWidth && maxWidth > 0 && sourceWidth > maxWidth ? maxWidth / sourceWidth : 1

  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Cannot capture: a 2D canvas context is unavailable.')
  }

  if (opts.mirror) {
    ctx.save()
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, 0, 0, width, height)
  opts.overlay?.(ctx, width, height)
  if (opts.mirror) {
    ctx.restore()
  }

  const blob = await canvasToBlob(canvas)
  if (!blob) {
    throw new Error('Cannot capture: encoding the frame to PNG failed.')
  }

  return {
    id: createShotId(),
    blob,
    capturedAt: Date.now(),
    width,
    height,
  }
}
