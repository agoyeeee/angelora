/**
 * Shared booth session store (owned by the orchestrator as part of the frozen
 * contract between the booth and result routes).
 *
 * The captured shots and the chosen settings must survive navigation between
 * `/booth` and `/result`, so the store lives above both routes (wired into the
 * root layout via {@link SessionProvider}). It is intentionally thin: a
 * `useReducer` over the React-free `sessionReducer`, plus a reset convenience.
 *
 * PRD §8.2: use `useReducer` for session state; no global store library.
 */

import { createContext, useContext } from 'react'
import type { Dispatch } from 'react'
import type { SessionAction } from './session-reducer'
import type { BoothSession } from './types'

export type SessionContextValue = {
  /** Current in-memory session (shots + settings). */
  session: BoothSession
  /** Dispatch a session transition (see SessionAction). */
  dispatch: Dispatch<SessionAction>
  /** Reset shots and settings back to defaults (PRD §11 "Start over"). */
  resetSession: () => void
}

/**
 * `null` when consumed outside the provider; {@link useBoothSession} turns that
 * into a clear developer error rather than a silent crash.
 */
export const SessionContext = createContext<SessionContextValue | null>(null)

/** Access the shared booth session. Must be called under `<SessionProvider>`. */
export function useBoothSession(): SessionContextValue {
  const value = useContext(SessionContext)
  if (!value) {
    throw new Error('useBoothSession must be used within <SessionProvider>.')
  }
  return value
}
