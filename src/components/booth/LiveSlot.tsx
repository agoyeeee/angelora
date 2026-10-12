import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

export type LiveSource = {
  videoRef: RefObject<HTMLVideoElement | null>
  /** The face-effect overlay canvas (same pixel size as the video), if any. */
  overlayRef?: RefObject<HTMLCanvasElement | null>
  mirror: boolean
}

type CoverSource = HTMLVideoElement | HTMLCanvasElement

function sizeOf(source: CoverSource): { width: number; height: number } {
  return source instanceof HTMLVideoElement
    ? { width: source.videoWidth, height: source.videoHeight }
    : { width: source.width, height: source.height }
}

/** Draw `source` into the whole canvas with an object-fit: cover crop. */
function drawCover(ctx: CanvasRenderingContext2D, source: CoverSource, width: number, height: number) {
  const size = sizeOf(source)
  if (size.width <= 0 || size.height <= 0) return
  const scale = Math.max(width / size.width, height / size.height)
  const drawWidth = size.width * scale
  const drawHeight = size.height * scale
  ctx.drawImage(source, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
}

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 240

/**
 * One photo slot of the strip preview, filled with the live camera (plus the
 * active face effect) so a frame choice shows how *you* will look inside it.
 * Purely visual: it copies pixels from the booth's own `<video>` — it never
 * opens a second camera stream.
 */
export function LiveSlot({
  source,
  filterCss,
}: {
  source: LiveSource
  filterCss: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { videoRef, overlayRef, mirror } = source

  useEffect(() => {
    let frame = 0
    const draw = () => {
      frame = requestAnimationFrame(draw)
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !video || !ctx || video.readyState < 2) return
      drawCover(ctx, video, canvas.width, canvas.height)
      const overlay = overlayRef?.current
      if (overlay && overlay.width > 0 && overlay.height > 0) {
        drawCover(ctx, overlay, canvas.width, canvas.height)
      }
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [videoRef, overlayRef])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      aria-hidden
      className="size-full bg-ink-800"
      style={{
        transform: mirror ? 'scaleX(-1)' : undefined,
        filter: filterCss,
      }}
    />
  )
}
