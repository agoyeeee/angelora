import { describe, expect, it, vi } from 'vitest'
import { mockVideoReady } from '../../test/setup'
import {
  CAMERA_MESSAGES,
  CameraAccessError,
  captureFrame,
  isCameraSupported,
  listVideoInputs,
  mapCameraError,
  startCamera,
  stopStream,
  waitForVideoReady,
} from './camera-service'
import type { CameraErrorStatus } from './types'

function createMockStream(): MediaStream {
  const stop = vi.fn()
  const track = { stop, kind: 'video', enabled: true } as unknown as MediaStreamTrack
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
    getAudioTracks: () => [],
  } as unknown as MediaStream
}

describe('mapCameraError', () => {
  const cases: Array<[string, CameraErrorStatus]> = [
    ['NotAllowedError', 'denied'],
    ['PermissionDeniedError', 'denied'],
    ['NotFoundError', 'no-device'],
    ['OverconstrainedError', 'no-device'],
    ['DevicesNotFoundError', 'no-device'],
    ['NotReadableError', 'busy'],
    ['TrackStartError', 'busy'],
    ['AbortError', 'busy'],
    ['SecurityError', 'unsupported'],
    ['SomeUnexpectedError', 'error'],
  ]

  it.each(cases)('maps %s to %s', (name, expected) => {
    expect(mapCameraError({ name })).toBe(expected)
  })

  it('maps a DOMException by its name', () => {
    expect(mapCameraError(new DOMException('no', 'NotAllowedError'))).toBe('denied')
  })

  it('maps an unknown value to a generic error', () => {
    expect(mapCameraError(undefined)).toBe('error')
    expect(mapCameraError('boom')).toBe('error')
  })

  it('maps a TypeError to error when getUserMedia exists', () => {
    expect(mapCameraError(new TypeError('bad call'))).toBe('error')
  })
})

describe('isCameraSupported', () => {
  it('is true when getUserMedia exists in a secure context', () => {
    expect(isCameraSupported()).toBe(true)
  })

  it('is false when the getUserMedia API is unavailable', () => {
    const original = navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    })
    try {
      expect(isCameraSupported()).toBe(false)
    } finally {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: original,
      })
    }
  })

  it('is false in an insecure context', () => {
    const original = window.isSecureContext
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    })
    try {
      expect(isCameraSupported()).toBe(false)
    } finally {
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: original,
      })
    }
  })
})

describe('CAMERA_MESSAGES', () => {
  it('provides friendly, stack-trace-free copy for every status', () => {
    for (const message of Object.values(CAMERA_MESSAGES)) {
      expect(message.title.length).toBeGreaterThan(0)
      expect(message.guidance.length).toBeGreaterThan(0)
      expect(message.guidance).not.toMatch(/Error:|at \w/)
    }
  })

  it('marks recoverable failures as retryable', () => {
    expect(CAMERA_MESSAGES.denied.canRetry).toBe(true)
    expect(CAMERA_MESSAGES.busy.canRetry).toBe(true)
    expect(CAMERA_MESSAGES['no-device'].canRetry).toBe(true)
    expect(CAMERA_MESSAGES.unsupported.canRetry).toBe(false)
  })
})

describe('startCamera', () => {
  it('requests a video-only stream and never audio', async () => {
    const getUserMedia = vi.mocked(navigator.mediaDevices.getUserMedia)
    getUserMedia.mockResolvedValueOnce(createMockStream())

    const stream = await startCamera()

    expect(getUserMedia).toHaveBeenCalledTimes(1)
    const constraints = getUserMedia.mock.calls[0]?.[0]
    expect(constraints).toBeDefined()
    expect(constraints?.audio).toBe(false)
    expect(constraints?.video).toBeTruthy()
    expect(stream.getVideoTracks()).toHaveLength(1)
  })

  it('targets a specific device by id when provided', async () => {
    const getUserMedia = vi.mocked(navigator.mediaDevices.getUserMedia)
    getUserMedia.mockResolvedValueOnce(createMockStream())

    await startCamera({ deviceId: 'cam-back' })

    const constraints = getUserMedia.mock.calls[0]?.[0]
    expect(constraints?.video).toEqual({ deviceId: { exact: 'cam-back' } })
  })

  it('maps a rejected getUserMedia to a CameraAccessError status', async () => {
    const getUserMedia = vi.mocked(navigator.mediaDevices.getUserMedia)
    getUserMedia.mockRejectedValueOnce(
      new DOMException('denied', 'NotAllowedError'),
    )

    const error = await startCamera().catch((err: unknown) => err)

    expect(error).toBeInstanceOf(CameraAccessError)
    expect((error as CameraAccessError).status).toBe('denied')
  })

  it('rejects with unsupported when the API is missing', async () => {
    const original = navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    })
    try {
      const error = await startCamera().catch((err: unknown) => err)
      expect((error as CameraAccessError).status).toBe('unsupported')
    } finally {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: original,
      })
    }
  })
})

describe('stopStream', () => {
  it('stops every track in the stream', () => {
    const stopA = vi.fn()
    const stopB = vi.fn()
    const stream = {
      getTracks: () => [{ stop: stopA }, { stop: stopB }],
    } as unknown as MediaStream

    stopStream(stream)

    expect(stopA).toHaveBeenCalledTimes(1)
    expect(stopB).toHaveBeenCalledTimes(1)
  })

  it('is a no-op for null or undefined', () => {
    expect(() => stopStream(null)).not.toThrow()
    expect(() => stopStream(undefined)).not.toThrow()
  })
})

describe('listVideoInputs', () => {
  it('returns only video input devices', async () => {
    const enumerateDevices = vi.mocked(navigator.mediaDevices.enumerateDevices)
    enumerateDevices.mockResolvedValueOnce([
      { deviceId: 'cam', kind: 'videoinput', label: 'Cam', groupId: 'g' },
      { deviceId: 'mic', kind: 'audioinput', label: 'Mic', groupId: 'g' },
    ] as unknown as MediaDeviceInfo[])

    const inputs = await listVideoInputs()

    expect(inputs).toHaveLength(1)
    expect(inputs[0]?.deviceId).toBe('cam')
  })
})

describe('waitForVideoReady', () => {
  it('resolves when the video reports dimensions', async () => {
    const video = document.createElement('video')
    const promise = waitForVideoReady(video, 1000)

    mockVideoReady(video, 640, 480)

    await expect(promise).resolves.toBeUndefined()
  })

  it('rejects when the video never becomes ready', async () => {
    vi.useFakeTimers()
    try {
      const video = document.createElement('video')
      const promise = waitForVideoReady(video, 500)
      const assertion = expect(promise).rejects.toThrow(/not ready within 500ms/)

      await vi.advanceTimersByTimeAsync(600)
      await assertion
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('captureFrame', () => {
  it('captures a scaled PNG shot', async () => {
    const video = document.createElement('video')
    mockVideoReady(video, 1280, 720)

    const shot = await captureFrame(video, { maxWidth: 640 })

    expect(shot.width).toBe(640)
    expect(shot.height).toBe(360)
    expect(shot.blob).toBeInstanceOf(Blob)
    expect(shot.blob.type).toBe('image/png')
    expect(typeof shot.capturedAt).toBe('number')
    expect(shot.id.length).toBeGreaterThan(0)
  })

  it('never upscales beyond the source width', async () => {
    const video = document.createElement('video')
    mockVideoReady(video, 640, 480)

    const shot = await captureFrame(video, { maxWidth: 1200 })

    expect(shot.width).toBe(640)
    expect(shot.height).toBe(480)
  })

  it('mirrors horizontally when requested', async () => {
    const ctx = {
      save: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      restore: vi.fn(),
      drawImage: vi.fn(),
    }
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(ctx as unknown as CanvasRenderingContext2D)

    const video = document.createElement('video')
    mockVideoReady(video, 320, 240)

    await captureFrame(video, { mirror: true })

    expect(ctx.translate).toHaveBeenCalledWith(320, 0)
    expect(ctx.scale).toHaveBeenCalledWith(-1, 1)
    getContext.mockRestore()
  })

  it('throws instead of returning an empty shot when the video is not ready', async () => {
    const video = document.createElement('video')

    await expect(captureFrame(video)).rejects.toThrow()
  })
})
