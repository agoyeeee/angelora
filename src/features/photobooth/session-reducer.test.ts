import { describe, expect, it } from 'vitest'
import {
  createInitialSession,
  isSessionComplete,
  sessionReducer,
  type SessionAction,
} from './session-reducer'
import { DEFAULT_SESSION } from './types'
import type { BoothSession, CapturedShot } from './types'

function shot(id: string): CapturedShot {
  return {
    id,
    blob: new Blob(['x'], { type: 'image/png' }),
    capturedAt: 1,
    width: 10,
    height: 10,
  }
}

function sessionWith(shots: CapturedShot[]): BoothSession {
  return createInitialSession({ shots })
}

describe('createInitialSession', () => {
  it('starts from the shared defaults', () => {
    expect(createInitialSession()).toEqual(DEFAULT_SESSION)
  })

  it('applies partial overrides', () => {
    const session = createInitialSession({ filter: 'warm', shotCount: 3 })
    expect(session.filter).toBe('warm')
    expect(session.shotCount).toBe(3)
    expect(session.frame).toBe(DEFAULT_SESSION.frame)
  })

  it('does not share the default shots array', () => {
    const session = createInitialSession()
    session.shots.push(shot('a'))
    expect(DEFAULT_SESSION.shots).toHaveLength(0)
  })
})

describe('sessionReducer', () => {
  it('appends shots and preserves settings', () => {
    const configured = sessionReducer(
      createInitialSession({ filter: 'vivid' }),
      { type: 'setShotCount', shotCount: 3 },
    )
    const next = sessionReducer(configured, { type: 'addShot', shot: shot('a') })

    expect(next.shots).toHaveLength(1)
    expect(next.shots[0]?.id).toBe('a')
    expect(next.filter).toBe('vivid')
    expect(next.shotCount).toBe(3)
  })

  it('retakeLast removes only the last shot', () => {
    const state = sessionWith([shot('a'), shot('b'), shot('c')])

    const next = sessionReducer(state, { type: 'retakeLast' })

    expect(next.shots.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('retakeLast is a no-op when there are no shots', () => {
    const state = createInitialSession()
    expect(sessionReducer(state, { type: 'retakeLast' })).toBe(state)
  })

  it('resetShots clears shots but keeps settings', () => {
    const state = createInitialSession({
      shots: [shot('a')],
      filter: 'bw',
      frame: 'peach',
    })

    const next = sessionReducer(state, { type: 'resetShots' })

    expect(next.shots).toHaveLength(0)
    expect(next.filter).toBe('bw')
    expect(next.frame).toBe('peach')
  })

  it('resetSession returns a fresh default session', () => {
    const state = createInitialSession({
      shots: [shot('a')],
      filter: 'soft',
      shotCount: 3,
      mirrorPreview: false,
    })

    const next = sessionReducer(state, { type: 'resetSession' })

    expect(next).toEqual(DEFAULT_SESSION)
  })

  it('setShotCount to a smaller value trims excess shots', () => {
    const state = createInitialSession({
      shotCount: 4,
      shots: [shot('a'), shot('b'), shot('c'), shot('d')],
    })

    const next = sessionReducer(state, { type: 'setShotCount', shotCount: 3 })

    expect(next.shotCount).toBe(3)
    expect(next.shots.map((s) => s.id)).toEqual(['a', 'b', 'c'])
  })

  it('setShotCount to a larger value keeps captured shots', () => {
    const state = createInitialSession({
      shotCount: 3,
      shots: [shot('a'), shot('b')],
    })

    const next = sessionReducer(state, { type: 'setShotCount', shotCount: 4 })

    expect(next.shotCount).toBe(4)
    expect(next.shots).toHaveLength(2)
  })

  it('updates individual settings', () => {
    const base = createInitialSession()
    const actions: SessionAction[] = [
      { type: 'setCountdown', countdownSeconds: 5 },
      { type: 'setFilter', filter: 'warm' },
      { type: 'setFrame', frame: 'midnight' },
      { type: 'setMirrorPreview', mirrorPreview: false },
      { type: 'setMirrorOutput', mirrorOutput: false },
    ]

    const next = actions.reduce(sessionReducer, base)

    expect(next.countdownSeconds).toBe(5)
    expect(next.filter).toBe('warm')
    expect(next.frame).toBe('midnight')
    expect(next.mirrorPreview).toBe(false)
    expect(next.mirrorOutput).toBe(false)
  })
})

describe('isSessionComplete', () => {
  it('is false until the shotCount is reached', () => {
    const state = createInitialSession({ shotCount: 3, shots: [shot('a')] })
    expect(isSessionComplete(state)).toBe(false)
  })

  it('is true when shots match the configured count', () => {
    const state = createInitialSession({
      shotCount: 3,
      shots: [shot('a'), shot('b'), shot('c')],
    })
    expect(isSessionComplete(state)).toBe(true)
  })

  it('setEffect changes only the face effect', () => {
    const next = sessionReducer(DEFAULT_SESSION, { type: 'setEffect', effect: 'dog' })
    expect(next).toEqual({ ...DEFAULT_SESSION, effect: 'dog' })
  })
})
