import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FILTERS } from '../../features/photobooth/filters'
import { FilterPicker } from './FilterPicker'

describe('FilterPicker', () => {
  it('renders every filter option', () => {
    render(<FilterPicker value="original" onChange={vi.fn()} />)

    for (const filter of FILTERS) {
      expect(
        screen.getByRole('button', { name: `${filter.label} filter` }),
      ).toBeInTheDocument()
    }
  })

  it('reports the selected filter id', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<FilterPicker value="original" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'Warm filter' }))
    expect(onChange).toHaveBeenCalledWith('warm')
  })
})
