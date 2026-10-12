/**
 * Session state — React-free (PRD §10).
 *
 * Pure reducer for the in-memory {@link BoothSession}. The UI wires this into
 * `useReducer`; keeping it here makes the transitions trivially unit-testable.
 */

import type {
  BoothSession,
  CapturedShot,
  CountdownSeconds,
  FilterId,
  EffectId,
  FrameId,
  ShotCount,
} from './types'
import { DEFAULT_SESSION } from './types'

/** All transitions the booth UI can dispatch. */
export type SessionAction =
  | { type: 'addShot'; shot: CapturedShot }
  | { type: 'retakeLast' }
  | { type: 'resetShots' }
  | { type: 'setShotCount'; shotCount: ShotCount }
  | { type: 'setCountdown'; countdownSeconds: CountdownSeconds }
  | { type: 'setFilter'; filter: FilterId }
  | { type: 'setFrame'; frame: FrameId }
  | { type: 'setEffect'; effect: EffectId }
  | { type: 'setMirrorPreview'; mirrorPreview: boolean }
  | { type: 'setMirrorOutput'; mirrorOutput: boolean }
  | { type: 'resetSession' }

/**
 * Build a session from defaults, optionally overriding fields. The `shots` array
 * is always cloned so callers never share the module-level default array.
 */
export function createInitialSession(
  partial: Partial<BoothSession> = {},
): BoothSession {
  return {
    ...DEFAULT_SESSION,
    ...partial,
    shots: partial.shots ? [...partial.shots] : [],
  }
}

/** True once the session holds at least the configured number of shots. */
export function isSessionComplete(session: BoothSession): boolean {
  return session.shots.length >= session.shotCount
}

/**
 * Pure session reducer.
 *
 * Notable rules:
 * - `retakeLast` removes only the final shot and never touches the others (FR-09).
 * - `setShotCount` to a smaller value trims excess shots so `shots.length` stays
 *   within the new count; enlarging keeps everything already captured.
 * - Settings (count, countdown, filter, frame, mirror) persist across the session
 *   (FR-05): only `resetShots`/`resetSession` clear captured shots.
 */
export function sessionReducer(
  state: BoothSession,
  action: SessionAction,
): BoothSession {
  switch (action.type) {
    case 'addShot':
      return { ...state, shots: [...state.shots, action.shot] }

    case 'retakeLast': {
      if (state.shots.length === 0) return state
      return { ...state, shots: state.shots.slice(0, -1) }
    }

    case 'resetShots':
      return { ...state, shots: [] }

    case 'setShotCount': {
      const { shotCount } = action
      return {
        ...state,
        shotCount,
        shots: state.shots.slice(0, shotCount),
      }
    }

    case 'setCountdown':
      return { ...state, countdownSeconds: action.countdownSeconds }

    case 'setFilter':
      return { ...state, filter: action.filter }

    case 'setFrame':
      return { ...state, frame: action.frame }

    case 'setEffect':
      return { ...state, effect: action.effect }

    case 'setMirrorPreview':
      return { ...state, mirrorPreview: action.mirrorPreview }

    case 'setMirrorOutput':
      return { ...state, mirrorOutput: action.mirrorOutput }

    case 'resetSession':
      return createInitialSession()

    default:
      return state
  }
}
