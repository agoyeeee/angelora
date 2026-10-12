import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SessionSettings, type SessionSettingsProps } from './SessionSettings'

function makeProps(
  overrides: Partial<SessionSettingsProps> = {},
): SessionSettingsProps {
  return {
    shotCount: 3,
    countdownSeconds: 3,
    mirrorPreview: false,
    onShotCount: vi.fn(),
    onCountdown: vi.fn(),
    onMirrorPreview: vi.fn(),
    ...overrides,
  }
}

describe('SessionSettings', () => {
  it('reports the chosen shot count', async () => {
    const user = userEvent.setup()
    const props = makeProps({ shotCount: 3 })
    render(<SessionSettings {...props} />)

    await user.click(screen.getByRole('button', { name: '4 photos' }))
    expect(props.onShotCount).toHaveBeenCalledWith(4)
  })

  it('reports the chosen countdown length', async () => {
    const user = userEvent.setup()
    const props = makeProps({ countdownSeconds: 3 })
    render(<SessionSettings {...props} />)

    await user.click(screen.getByRole('button', { name: '5 seconds' }))
    expect(props.onCountdown).toHaveBeenCalledWith(5)
  })

  it('reports the mirrored preview toggle', async () => {
    const user = userEvent.setup()
    const props = makeProps({ mirrorPreview: false })
    render(<SessionSettings {...props} />)

    const toggle = screen.getByRole('switch', { name: 'Mirror preview' })
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)
    expect(props.onMirrorPreview).toHaveBeenCalledWith(true)
  })

  it('locks the controls while a capture sequence is running', () => {
    const props = makeProps({ disabled: true })
    render(<SessionSettings {...props} />)

    expect(screen.getByRole('button', { name: '3 photos' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '5 seconds' })).toBeDisabled()
    expect(screen.getByRole('switch', { name: 'Mirror preview' })).toBeDisabled()
  })
})
