import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { CapturedShot } from './types'
import { SessionProvider } from './session-provider'
import { useBoothSession } from './session-context'

const shot: CapturedShot = {
  id: 'shot-1',
  blob: new Blob(['x'], { type: 'image/png' }),
  capturedAt: 0,
  width: 10,
  height: 10,
}

/** Reads the context from the provider and exposes it through the DOM. */
function SessionProbe() {
  const { session, dispatch, resetSession } = useBoothSession()

  return (
    <div>
      <span data-testid="shots">{session.shots.length}</span>
      <span data-testid="shotCount">{session.shotCount}</span>
      <button onClick={() => dispatch({ type: 'addShot', shot })}>add shot</button>
      <button onClick={() => dispatch({ type: 'setShotCount', shotCount: 3 })}>
        use three
      </button>
      <button onClick={resetSession}>reset session</button>
    </div>
  )
}

describe('session-context', () => {
  it('throws a clear error when used outside the provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    function Outside() {
      useBoothSession()
      return null
    }

    expect(() => render(<Outside />)).toThrow(
      'useBoothSession must be used within <SessionProvider>.',
    )

    consoleError.mockRestore()
  })

  it('exposes the session, dispatch and resetSession from the provider', async () => {
    const user = userEvent.setup()
    render(
      <SessionProvider>
        <SessionProbe />
      </SessionProvider>,
    )

    expect(screen.getByTestId('shots')).toHaveTextContent('0')
    expect(screen.getByTestId('shotCount')).toHaveTextContent('4')

    await user.click(screen.getByRole('button', { name: 'add shot' }))
    expect(screen.getByTestId('shots')).toHaveTextContent('1')

    await user.click(screen.getByRole('button', { name: 'use three' }))
    expect(screen.getByTestId('shotCount')).toHaveTextContent('3')

    await user.click(screen.getByRole('button', { name: 'reset session' }))
    expect(screen.getByTestId('shots')).toHaveTextContent('0')
    expect(screen.getByTestId('shotCount')).toHaveTextContent('4')
  })
})
