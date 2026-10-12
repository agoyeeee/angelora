import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type {
  CameraErrorStatus,
  CameraStatus,
} from '../../features/photobooth/types'
import {
  CameraAccessError,
  isCameraSupported,
  listVideoInputs,
  startCamera,
  stopStream,
  waitForVideoReady,
  type StartCameraOptions,
} from '../../features/photobooth/camera-service'

/**
 * Owns the camera device lifecycle for the booth (PRD §9.3 / Stage 2).
 *
 * Responsibilities, kept out of the route so the UI stays declarative:
 * - never touches `getUserMedia` until `start()` is called from a user action (FR-02);
 * - reports a coarse `status` and the matching error status for `CAMERA_MESSAGES`;
 * - attaches the stream to the `<video>` via `srcObject` and only flips
 *   `isVideoReady` after `waitForVideoReady` resolves, so capture never draws a
 *   0×0 frame (FR-07);
 * - stops the outgoing stream *before* requesting a new one when switching
 *   cameras, so the camera indicator never stays lit (FR-04);
 * - tears the stream down (and clears `srcObject`) on unmount.
 */

export type FacingMode = 'user' | 'environment'

/** Fixed preview frame ratio chosen from the live video orientation. */
export type CameraAspect = '4 / 3' | '3 / 4'

export type UseCameraResult = {
  status: CameraStatus
  errorStatus: CameraErrorStatus | null
  stream: MediaStream | null
  /** Attach to the preview `<video>` element. */
  videoRef: RefObject<HTMLVideoElement | null>
  /** True once the video reports real frame dimensions. */
  isVideoReady: boolean
  aspect: CameraAspect
  devices: MediaDeviceInfo[]
  activeDeviceId: string | null
  facingMode: FacingMode
  /** Start (or restart) the camera using the last known selection. */
  start: () => void
  /** Re-attempt after a failure without a page reload (FR-15). */
  retry: () => void
  /** Switch to another video input; stops the old stream first (FR-04). */
  switchDevice: (deviceId: string) => void
}

export function useCamera(): UseCameraResult {
  // Support is checked once up front so an insecure/legacy browser shows the
  // unsupported message without ever prompting for permission (PRD §9.3).
  const [status, setStatus] = useState<CameraStatus>(() =>
    isCameraSupported() ? 'idle' : 'unsupported',
  )
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [aspect, setAspect] = useState<CameraAspect>('4 / 3')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<FacingMode>('user')

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const selectionRef = useRef<StartCameraOptions>({ facingMode: 'user' })
  // Guards against a stream that resolves after the booth unmounts (H3): the
  // teardown effect flips this off, and runStart stops any late stream.
  const aliveRef = useRef(true)

  // Re-enumerate when the OS reports a device change while the booth is open.
  useEffect(() => {
    const mediaDevices =
      typeof navigator === 'undefined' ? undefined : navigator.mediaDevices
    if (!mediaDevices?.addEventListener) return

    const onChange = (): void => {
      void listVideoInputs().then((list) => setDevices(list))
    }
    mediaDevices.addEventListener('devicechange', onChange)
    return () => mediaDevices.removeEventListener('devicechange', onChange)
  }, [])

  // Teardown on unmount / route change: every track stops, no dangling stream.
  useEffect(() => {
    // Armed here (not just at init) so StrictMode's setup -> cleanup -> setup
    // cycle does not leave the guard stuck off.
    aliveRef.current = true
    return () => {
      aliveRef.current = false
      stopStream(streamRef.current)
      streamRef.current = null
      const el = videoRef.current
      if (el) el.srcObject = null
    }
  }, [])

  async function runStart(opts: StartCameraOptions): Promise<void> {
    selectionRef.current = opts

    if (!isCameraSupported()) {
      setStatus('unsupported')
      return
    }

    setStatus('requesting')
    setIsVideoReady(false)

    try {
      const next = await startCamera(opts)

      // The booth may have unmounted while the permission prompt was open: stop
      // the freshly granted stream instead of leaking a live camera (PRD §9.3).
      if (!aliveRef.current) {
        stopStream(next)
        return
      }

      // Only swap in the new stream once it is live, then stop the old one.
      stopStream(streamRef.current)
      streamRef.current = next
      setStream(next)

      const el = videoRef.current
      if (el) {
        el.srcObject = next
        const playback = el.play()
        if (playback) void playback.catch(() => undefined)
      }

      const settings = next.getVideoTracks()[0]?.getSettings()
      if (settings?.deviceId) setActiveDeviceId(settings.deviceId)
      if (settings?.facingMode === 'user' || settings?.facingMode === 'environment') {
        setFacingMode(settings.facingMode)
      }

      setStatus('ready')

      // Labels are only available after permission is granted.
      void listVideoInputs().then((list) => setDevices(list))

      if (el) {
        try {
          await waitForVideoReady(el)
          if (!aliveRef.current) {
            stopStream(next)
            return
          }
          setIsVideoReady(true)
          setAspect(el.videoHeight > el.videoWidth ? '3 / 4' : '4 / 3')
        } catch {
          // Stream is live but frames are not ready yet: keep capture disabled.
          setIsVideoReady(false)
        }
      }
    } catch (error) {
      stopStream(streamRef.current)
      streamRef.current = null
      setStream(null)
      setIsVideoReady(false)
      setStatus(error instanceof CameraAccessError ? error.status : 'error')
    }
  }

  function start(): void {
    void runStart(selectionRef.current)
  }

  function retry(): void {
    void runStart(selectionRef.current)
  }

  function switchDevice(deviceId: string): void {
    // Stop the outgoing stream before requesting the new one (FR-04).
    stopStream(streamRef.current)
    streamRef.current = null
    setStream(null)
    setIsVideoReady(false)
    const el = videoRef.current
    if (el) el.srcObject = null
    setActiveDeviceId(deviceId)
    void runStart({ deviceId })
  }

  const errorStatus: CameraErrorStatus | null =
    status === 'idle' || status === 'requesting' || status === 'ready'
      ? null
      : status

  return {
    status,
    errorStatus,
    stream,
    videoRef,
    isVideoReady,
    aspect,
    devices,
    activeDeviceId,
    facingMode,
    start,
    retry,
    switchDevice,
  }
}
