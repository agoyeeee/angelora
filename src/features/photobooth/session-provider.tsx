/**
 * Session provider component (see session-context.ts for the contract).
 * Kept in its own file so the only export is a component (React Fast Refresh),
 * while the context object + hook live in the React-heavy-free module.
 */

import { useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { createInitialSession, sessionReducer } from './session-reducer'
import { SessionContext, type SessionContextValue } from './session-context'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () =>
    createInitialSession(),
  )

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      dispatch,
      resetSession: () => dispatch({ type: 'resetSession' }),
    }),
    [session],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}
