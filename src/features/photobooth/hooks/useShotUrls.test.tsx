import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CapturedShot } from '../types'
import { useShotUrls } from './useShotUrls'

function makeShot(id: string): CapturedShot {
  return {
    id,
    blob: new Blob([id], { type: 'image/png' }),
    capturedAt: 0,
    width: 10,
    height: 10,
  }
}

function ShotUrlsProbe({
  shots,
  onUrls,
}: {
  shots: readonly CapturedShot[]
  onUrls: (urls: Record<string, string>) => void
}) {
  const urls = useShotUrls(shots)
  useEffect(() => {
    onUrls(urls)
  })
  return <output data-testid="urls">{Object.keys(urls).sort().join(',')}</output>
}

describe('useShotUrls', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL

  beforeEach(() => {
    let counter = 0
    createObjectURL = vi.fn(() => `blob:mock-${counter++}`)
    revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL
  })

  afterEach(() => {
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
  })

  it('creates exactly one object URL per shot and revokes removed/unmounted URLs', () => {
    let latest: Record<string, string> = {}
    const { rerender, unmount } = render(
      <ShotUrlsProbe
        shots={[makeShot('a'), makeShot('b')]}
        onUrls={(urls) => (latest = urls)}
      />,
    )

    expect(createObjectURL).toHaveBeenCalledTimes(2)
    expect(Object.keys(latest).sort()).toEqual(['a', 'b'])
    expect(screen.getByTestId('urls')).toHaveTextContent('a,b')

    const urlB = latest.b

    // Removing a shot revokes its URL (retake / reset).
    rerender(
      <ShotUrlsProbe shots={[makeShot('a')]} onUrls={(urls) => (latest = urls)} />,
    )
    expect(revokeObjectURL).toHaveBeenCalledWith(urlB)
    expect(Object.keys(latest)).toEqual(['a'])
    expect(createObjectURL).toHaveBeenCalledTimes(2)

    // Unmount revokes whatever is still live.
    const urlA = latest.a
    unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith(urlA)
  })
})
