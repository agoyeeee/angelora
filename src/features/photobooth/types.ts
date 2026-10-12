/**
 * Shared, React-free type contract for the FlashFrame photobooth feature.
 * PRD §9.2. Keep this module dependency-light: other photobooth modules and the
 * UI both import from here.
 */

export type FilterId = 'original' | 'warm' | 'bw' | 'soft' | 'vivid'

export type FrameId = 'clean' | 'midnight' | 'lavender' | 'peach'

export type ShotCount = 3 | 4

export type CountdownSeconds = 3 | 5

/** Coarse camera lifecycle state surfaced to the UI. */
export type CameraStatus =
  | 'idle'
  | 'unsupported'
  | 'requesting'
  | 'ready'
  | 'denied'
  | 'no-device'
  | 'busy'
  | 'error'

/** Failure states that carry user-facing guidance (everything except idle/requesting/ready). */
export type CameraErrorStatus = Exclude<CameraStatus, 'idle' | 'requesting' | 'ready'>

export type CapturedShot = {
  id: string
  blob: Blob
  capturedAt: number
  width: number
  height: number
}

export type BoothSession = {
  shots: CapturedShot[]
  shotCount: ShotCount
  countdownSeconds: CountdownSeconds
  filter: FilterId
  frame: FrameId
  mirrorPreview: boolean
  mirrorOutput: boolean
}

export const SHOT_COUNTS: readonly ShotCount[] = [3, 4]

export const COUNTDOWN_OPTIONS: readonly CountdownSeconds[] = [3, 5]

export const DEFAULT_SESSION: BoothSession = {
  shots: [],
  shotCount: 4,
  countdownSeconds: 3,
  filter: 'original',
  frame: 'clean',
  mirrorPreview: true,
  mirrorOutput: true,
}
