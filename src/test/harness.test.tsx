import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

function Greeting() {
  return <p>FlashFrame ready</p>
}

describe('test harness', () => {
  it('renders with Testing Library + jsdom', () => {
    render(<Greeting />)
    expect(screen.getByText('FlashFrame ready')).toBeInTheDocument()
  })

  it('provides a mocked camera stream from navigator.mediaDevices', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    expect(stream.getVideoTracks()).toHaveLength(1)
  })
})
