import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

/*
 * jsdom ships neither `navigator.mediaDevices` nor a working Canvas 2D context.
 * Provide baseline mocks so camera/canvas modules are testable by default.
 * Individual tests may override these with their own vi.fn() implementations.
 */
function createMockStream(): MediaStream {
  const stop = vi.fn()
  const track = { stop, kind: 'video', enabled: true } as unknown as MediaStreamTrack
  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
    getAudioTracks: () => [],
  } as unknown as MediaStream
}

Object.defineProperty(navigator, 'mediaDevices', {
  configurable: true,
  value: {
    getUserMedia: vi.fn().mockResolvedValue(createMockStream()),
    enumerateDevices: vi.fn().mockResolvedValue([
      {
        deviceId: 'fake-camera',
        kind: 'videoinput',
        label: 'Fake Camera',
        groupId: 'fake-group',
        toJSON: () => ({}),
      } satisfies Partial<MediaDeviceInfo>,
    ]),
  },
})

function createMockCanvasContext(): CanvasRenderingContext2D {
  return {
    canvas: document.createElement('canvas'),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 }) as TextMetrics),
    createLinearGradient: vi.fn(),
    getImageData: vi.fn(
      () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }) as ImageData,
    ),
    putImageData: vi.fn(),
    filter: 'none',
    globalAlpha: 1,
    fillStyle: '#000000',
    strokeStyle: '#000000',
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    shadowColor: 'transparent',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
  } as unknown as CanvasRenderingContext2D
}

HTMLCanvasElement.prototype.getContext = vi.fn(
  () => createMockCanvasContext(),
) as unknown as typeof HTMLCanvasElement.prototype.getContext

HTMLCanvasElement.prototype.toDataURL = vi.fn(
  () => 'data:image/png;base64,ZmFrZQ==',
)
