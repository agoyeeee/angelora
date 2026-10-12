import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  CameraStatusPanel,
  type CameraStatusPanelProps,
} from './CameraStatusPanel'

// The unsupported state renders TanStack <Link>s; stub them as plain anchors so
// the panel can be tested without a router.
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    className,
  }: {
    to?: string
    children?: ReactNode
    className?: string
  }) => (
    <a href={to ?? '#'} className={className}>
      {children}
    </a>
  ),
}))

function makeProps(
  overrides: Partial<CameraStatusPanelProps> = {},
): CameraStatusPanelProps {
  return {
    status: 'idle',
    errorStatus: null,
    canRetry: false,
    onTurnOn: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  }
}

describe('CameraStatusPanel', () => {
  it('renders the idle onboarding title', () => {
    render(<CameraStatusPanel {...makeProps({ status: 'idle' })} />)
    expect(screen.getByText('Turn on your camera')).toBeInTheDocument()
  })

  it('renders the requesting title', () => {
    render(<CameraStatusPanel {...makeProps({ status: 'requesting' })} />)
    expect(screen.getByText('Requesting camera access')).toBeInTheDocument()
  })

  it('renders the ready title', () => {
    render(<CameraStatusPanel {...makeProps({ status: 'ready' })} />)
    expect(screen.getByText('Camera ready')).toBeInTheDocument()
  })

  it('renders the denied title and a retry action when the failure is retryable', async () => {
    const user = userEvent.setup()
    const props = makeProps({
      status: 'denied',
      errorStatus: 'denied',
      canRetry: true,
    })
    render(<CameraStatusPanel {...props} />)

    expect(screen.getByText('Camera permission is blocked')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(props.onRetry).toHaveBeenCalledTimes(1)
  })

  it('hides the retry action when the failure is not retryable', () => {
    render(
      <CameraStatusPanel
        {...makeProps({ status: 'denied', errorStatus: 'denied', canRetry: false })}
      />,
    )

    expect(screen.getByText('Camera permission is blocked')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
  })

  it('renders the unsupported title with navigation links and no retry', () => {
    render(
      <CameraStatusPanel
        {...makeProps({
          status: 'unsupported',
          errorStatus: 'unsupported',
          canRetry: true,
        })}
      />,
    )

    expect(
      screen.getByText("Camera isn't available in this browser"),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Back to home' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'How camera access works' }),
    ).toBeInTheDocument()
  })
})
