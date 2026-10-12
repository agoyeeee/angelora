import { useEffect } from 'react'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCountdown, type UseCountdownResult } from './useCountdown'

/**
 * Renders the hook and reports each fresh API object to the test. The report
 * happens in an effect (not during render) so no refs are mutated mid-render.
 */
function CountdownProbe({
  onApi,
}: {
  onApi: (api: UseCountdownResult) => void
}) {
  const api = useCountdown()
  useEffect(() => {
    onApi(api)
  })
  return (
    <output data-testid="countdown">
      {api.value === null ? 'idle' : String(api.value)}
    </output>
  )
}

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ticks down one second at a time and resolves after n seconds', async () => {
    let api!: UseCountdownResult
    render(<CountdownProbe onApi={(next) => (api = next)} />)

    expect(screen.getByTestId('countdown')).toHaveTextContent('idle')
    expect(api.running).toBe(false)

    let settled = false
    let started!: Promise<void>
    await act(async () => {
      started = api.start(3)
      void started.then(() => {
        settled = true
      })
    })

    expect(api.running).toBe(true)
    expect(screen.getByTestId('countdown')).toHaveTextContent('3')
    expect(settled).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(screen.getByTestId('countdown')).toHaveTextContent('2')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(screen.getByTestId('countdown')).toHaveTextContent('1')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })
    expect(screen.getByTestId('countdown')).toHaveTextContent('idle')
    expect(api.running).toBe(false)

    await started
    expect(settled).toBe(true)
  })

  it('resolves after a single second when started with 1', async () => {
    let api!: UseCountdownResult
    render(<CountdownProbe onApi={(next) => (api = next)} />)

    let settled = false
    let started!: Promise<void>
    await act(async () => {
      started = api.start(1)
      void started.then(() => {
        settled = true
      })
    })

    expect(screen.getByTestId('countdown')).toHaveTextContent('1')
    expect(settled).toBe(false)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(settled).toBe(true)
    expect(screen.getByTestId('countdown')).toHaveTextContent('idle')
    await started
  })

  it('cancel stops the countdown and resolves the pending wait', async () => {
    let api!: UseCountdownResult
    render(<CountdownProbe onApi={(next) => (api = next)} />)

    let settled = false
    let started!: Promise<void>
    await act(async () => {
      started = api.start(5)
      void started.then(() => {
        settled = true
      })
    })

    await act(async () => {
      api.cancel()
    })

    await started
    expect(settled).toBe(true)
    expect(api.running).toBe(false)
    expect(screen.getByTestId('countdown')).toHaveTextContent('idle')
  })
})
