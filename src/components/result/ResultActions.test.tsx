import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BoothSession, CapturedShot } from '../../features/photobooth/types'
import { ResultActions } from './ResultActions'
import {
  composeAndExport,
  loadImageFromBlob,
  CompositionError,
} from '../../features/photobooth/canvas-composer'
import { downloadBlob } from '../../lib/download'

vi.mock('../../features/photobooth/canvas-composer', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('../../features/photobooth/canvas-composer')
    >()
  return {
    ...actual,
    loadImageFromBlob: vi.fn(),
    composeAndExport: vi.fn(),
  }
})

vi.mock('../../lib/download', () => ({
  buildFilename: vi.fn(() => 'flashframe-test.png'),
  downloadBlob: vi.fn(),
}))

function makeShot(id: string): CapturedShot {
  return {
    id,
    blob: new Blob([id], { type: 'image/png' }),
    capturedAt: 0,
    width: 1080,
    height: 810,
  }
}

const session: BoothSession = {
  shots: [makeShot('a'), makeShot('b'), makeShot('c')],
  shotCount: 3,
  countdownSeconds: 3,
  filter: 'original',
  frame: 'clean',
  effect: 'none',
  mirrorPreview: true,
  mirrorOutput: true,
}

const pngBlob = new Blob(['png'], { type: 'image/png' })

describe('ResultActions', () => {
  beforeEach(() => {
    vi.mocked(loadImageFromBlob).mockResolvedValue(document.createElement('img'))
    vi.mocked(composeAndExport).mockResolvedValue(pngBlob)
    vi.mocked(downloadBlob).mockImplementation(() => undefined)
  })

  it('offers Download PNG and hands the composed blob to the download helper', async () => {
    const user = userEvent.setup()
    render(
      <ResultActions
        session={session}
        onRetakeLast={vi.fn()}
        onStartOver={vi.fn()}
      />,
    )

    const downloadButton = screen.getByRole('button', { name: 'Download PNG' })
    expect(downloadButton).toBeEnabled()

    await user.click(downloadButton)

    await waitFor(() => expect(downloadBlob).toHaveBeenCalledTimes(1))
    expect(loadImageFromBlob).toHaveBeenCalledTimes(session.shots.length)
    expect(composeAndExport).toHaveBeenCalledWith(session, expect.any(Array))
    expect(downloadBlob).toHaveBeenCalledWith(expect.any(Blob), 'flashframe-test.png')
    expect(await screen.findByText('Download started')).toBeInTheDocument()
  })

  it('surfaces a retryable error after a failed export and keeps the session', async () => {
    const user = userEvent.setup()
    const onRetakeLast = vi.fn()
    const onStartOver = vi.fn()
    vi.mocked(composeAndExport).mockRejectedValueOnce(
      new CompositionError('boom', 'shot-count-mismatch'),
    )

    render(
      <ResultActions
        session={session}
        onRetakeLast={onRetakeLast}
        onStartOver={onStartOver}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Download PNG' }))

    expect(await screen.findByText("We couldn't build your PNG")).toBeInTheDocument()
    expect(
      screen.getByText(
        'Some photos were missing when we put the strip together. Try again, or retake the last shot.',
      ),
    ).toBeInTheDocument()
    expect(downloadBlob).not.toHaveBeenCalled()

    // The session is untouched: the strip stays on screen and no navigation ran.
    expect(
      screen.getByRole('heading', { name: 'Download your strip' }),
    ).toBeInTheDocument()
    expect(onRetakeLast).not.toHaveBeenCalled()
    expect(onStartOver).not.toHaveBeenCalled()

    // The error action doubles as the retry.
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(composeAndExport).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Download started')).toBeInTheDocument()
  })

  it('confirms before starting over and then calls onStartOver', async () => {
    const user = userEvent.setup()
    const onStartOver = vi.fn()
    render(
      <ResultActions
        session={session}
        onRetakeLast={vi.fn()}
        onStartOver={onStartOver}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(screen.getByText('Start over?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Yes, start over' }))
    expect(onStartOver).toHaveBeenCalledTimes(1)
  })
})
