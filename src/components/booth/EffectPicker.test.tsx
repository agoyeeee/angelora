import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EFFECTS } from '../../features/photobooth/face/effects'
import { EffectPicker } from './EffectPicker'

describe('EffectPicker', () => {
  it('renders every effect, with the current one pressed', () => {
    render(<EffectPicker value="cat" onChange={vi.fn()} />)

    for (const effect of EFFECTS) {
      expect(
        screen.getByRole('button', { name: `${effect.label} face filter` }),
      ).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'Kucing face filter' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('reports the selected effect id', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EffectPicker value="none" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Mahkota face filter' }))
    expect(onChange).toHaveBeenCalledWith('crown')
  })

  it('locks every option when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EffectPicker value="none" onChange={onChange} disabled />)

    const button = screen.getByRole('button', { name: 'Santa face filter' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onChange).not.toHaveBeenCalled()
  })
})
