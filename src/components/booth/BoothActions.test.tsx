import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { BoothActions, type BoothActionsProps } from './BoothActions'

function makeProps(overrides: Partial<BoothActionsProps> = {}): BoothActionsProps {
  return {
    ready: false,
    capturing: false,
    captured: 0,
    total: 4,
    shotsExist: false,
    complete: false,
    onStart: vi.fn(),
    onRetakeLast: vi.fn(),
    onStartOver: vi.fn(),
    onViewStrip: vi.fn(),
    ...overrides,
  }
}

describe('BoothActions', () => {
  it('disables the primary start control until the camera is ready', () => {
    const props = makeProps({ ready: false })
    const { rerender } = render(<BoothActions {...props} />)

    expect(screen.getByRole('button', { name: 'Start session' })).toBeDisabled()

    rerender(<BoothActions {...props} ready />)
    expect(screen.getByRole('button', { name: 'Start session' })).toBeEnabled()
  })

  it('calls onStart when the primary control is activated', async () => {
    const user = userEvent.setup()
    const props = makeProps({ ready: true })
    render(<BoothActions {...props} />)

    await user.click(screen.getByRole('button', { name: 'Start session' }))
    expect(props.onStart).toHaveBeenCalledTimes(1)
  })

  it('relabels the primary control once shots already exist', () => {
    const props = makeProps({ ready: true, captured: 1, shotsExist: true })
    render(<BoothActions {...props} />)

    expect(
      screen.getByRole('button', { name: 'Continue session' }),
    ).toBeInTheDocument()
  })

  it('shows capture progress text while a sequence is running', () => {
    const props = makeProps({ ready: true, capturing: true, captured: 1, total: 3 })
    render(<BoothActions {...props} />)

    expect(screen.getByText('Taking shot 2 of 3')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start session' })).toBeNull()
  })

  it('calls the retake and start-over callbacks', async () => {
    const user = userEvent.setup()
    const props = makeProps({ ready: true, captured: 2, shotsExist: true })
    render(<BoothActions {...props} />)

    await user.click(screen.getByRole('button', { name: 'Retake last' }))
    expect(props.onRetakeLast).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(props.onStartOver).toHaveBeenCalledTimes(1)
  })

  it('offers View strip and calls onViewStrip once complete', async () => {
    const user = userEvent.setup()
    const props = makeProps({ ready: true, captured: 4, total: 4, complete: true })
    render(<BoothActions {...props} />)

    expect(screen.getByText('Your strip is ready')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'View strip' }))
    expect(props.onViewStrip).toHaveBeenCalledTimes(1)
  })
})
