import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REVOKE_DELAY_MS, buildFilename, downloadBlob } from './download'

describe('buildFilename', () => {
  it('formats as flashframe-YYYY-MM-DD.png', () => {
    expect(buildFilename(new Date(2026, 9, 12))).toBe('flashframe-2026-10-12.png')
  })

  it('defaults to today', () => {
    expect(buildFilename()).toMatch(/^flashframe-\d{4}-\d{2}-\d{2}\.png$/)
  })
})

describe('downloadBlob', () => {
  let createObjectURL: ReturnType<typeof vi.fn>
  let revokeObjectURL: ReturnType<typeof vi.fn>
  let clicks: number
  let clickedHref: string
  let clickedDownload: string

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock-url')
    revokeObjectURL = vi.fn()
    URL.createObjectURL =
      createObjectURL as unknown as typeof URL.createObjectURL
    URL.revokeObjectURL =
      revokeObjectURL as unknown as typeof URL.revokeObjectURL

    clicks = 0
    clickedHref = ''
    clickedDownload = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function (this: HTMLAnchorElement) {
        clicks += 1
        clickedHref = this.getAttribute('href') ?? ''
        clickedDownload = this.download
      },
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates an object URL, clicks a download link and revokes later', () => {
    vi.useFakeTimers()
    const blob = new Blob(['data'], { type: 'image/png' })

    downloadBlob(blob, 'flashframe-2026-10-12.png')

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(clicks).toBe(1)
    expect(clickedDownload).toBe('flashframe-2026-10-12.png')
    expect(clickedHref).toBe('blob:mock-url')
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.advanceTimersByTime(REVOKE_DELAY_MS)

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
