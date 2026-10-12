import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FRAMES } from '../../features/photobooth/frames'
import { FramePicker } from './FramePicker'

describe('FramePicker', () => {
  it('renders every frame option', () => {
    render(<FramePicker value="clean" onChange={vi.fn()} />)

    for (const frame of FRAMES) {
      expect(
        screen.getByRole('button', { name: `${frame.label} frame` }),
      ).toBeInTheDocument()
    }
  })

  it('reports the selected frame id', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FramePicker value="clean" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Midnight frame' }))
    expect(onChange).toHaveBeenCalledWith('midnight')
  })

  it('locks every option when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FramePicker value="clean" onChange={onChange} disabled />)

    const pizza = screen.getByRole('button', { name: 'Pizza frame' })
    expect(pizza).toBeDisabled()
    await user.click(pizza)
    expect(onChange).not.toHaveBeenCalled()
  })
})
