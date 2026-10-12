import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CapturedShot } from '../../features/photobooth/types'
import { ShotGrid } from './ShotGrid'

function makeShot(id: string): CapturedShot {
  return {
    id,
    blob: new Blob([id], { type: 'image/png' }),
    capturedAt: 0,
    width: 10,
    height: 10,
  }
}

describe('ShotGrid', () => {
  it('renders one slot per configured shot and marks captured slots', () => {
    const shots = [makeShot('a'), makeShot('b')]
    render(
      <ShotGrid
        shotCount={4}
        shots={shots}
        urls={{ a: 'blob:a', b: 'blob:b' }}
      />,
    )

    const list = screen.getByRole('list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(4)

    // One rendered image per captured shot; the rest stay empty.
    expect(screen.getAllByRole('img')).toHaveLength(2)
    expect(screen.getByAltText('Shot 1')).toHaveAttribute('src', 'blob:a')
    expect(screen.getByAltText('Shot 2')).toHaveAttribute('src', 'blob:b')
    expect(screen.getByText('2 / 4')).toBeInTheDocument()
  })

  it('renders an empty grid when nothing has been captured', () => {
    render(<ShotGrid shotCount={3} shots={[]} urls={{}} />)

    expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3)
    expect(screen.queryAllByRole('img')).toHaveLength(0)
    expect(screen.getByText('0 / 3')).toBeInTheDocument()
  })
})
