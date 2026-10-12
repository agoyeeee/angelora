/**
 * Canvas composition + PNG export for FlashFrame photostrips.
 *
 * PRD §9.4 principles honoured here:
 * - fixed output dimensions (derived from the shot count),
 * - `cover` cropping that preserves aspect (never stretches, FR-12),
 * - filters applied during the final draw so the export matches the preview
 *   (FR-10), reusing `filters.ts` as the single source of truth,
 * - explicit layer order: frame background → photos → frame foreground,
 * - PNG export via `canvas.toBlob('image/png')`, never a large base64 data URL.
 *
 * React-free by design (PRD §10).
 */

import { applyFilter, resetFilter } from './filters'
import { drawFrameBackground, drawFrameForeground } from './frames'
import { formatDateLabel } from '../../lib/utils'
import type { BoothSession, ShotCount } from './types'

/** Anything canvas can draw that has intrinsic pixel dimensions. */
export type ComposerImage = ImageBitmap | HTMLImageElement

export type Rect = { x: number; y: number; width: number; height: number }

export type StripLayout = {
  width: number
  height: number
  slots: Rect[]
  footer: Rect
}

/** Fixed strip width in pixels (PRD §9.4). */
export const STRIP_WIDTH = 1200

const STRIP_PADDING = 60
const SLOT_GAP = 40
const FOOTER_HEIGHT = 220
const SLOT_ASPECT = 4 / 3

/**
 * Deterministic strip layout.
 *
 * Slot aspect is exactly 4:3. With `STRIP_WIDTH = 1200`, padding 60, gap 40 and
 * footer 220, each slot is 1080 x 810 and the strip measures:
 * - 3-shot: 1200 x 2890 px
 * - 4-shot: 1200 x 3740 px
 *
 * All coordinates are even numbers and every slot sits fully inside the strip
 * with an even gap between slots and above the footer.
 */
export function computeStripLayout(shotCount: ShotCount): StripLayout {
  const slotWidth = STRIP_WIDTH - STRIP_PADDING * 2
  const slotHeight = Math.round(slotWidth / SLOT_ASPECT)
  const stride = slotHeight + SLOT_GAP

  const slots: Rect[] = []
  for (let index = 0; index < shotCount; index += 1) {
    slots.push({
      x: STRIP_PADDING,
      y: STRIP_PADDING + index * stride,
      width: slotWidth,
      height: slotHeight,
    })
  }

  const footerY = STRIP_PADDING + shotCount * stride
  return {
    width: STRIP_WIDTH,
    height: footerY + FOOTER_HEIGHT + STRIP_PADDING,
    slots,
    footer: {
      x: STRIP_PADDING,
      y: footerY,
      width: slotWidth,
      height: FOOTER_HEIGHT,
    },
  }
}

function sourceSize(source: ComposerImage): { width: number; height: number } {
  if ('naturalWidth' in source && source.naturalWidth > 0) {
    return { width: source.naturalWidth, height: source.naturalHeight }
  }
  return { width: source.width, height: source.height }
}

/**
 * Draw `source` into `rect` using an object-fit `cover` crop: the source is
 * scaled uniformly until it fills the rect, then centre-cropped and clipped.
 * Aspect is always preserved — the image is never stretched (PRD §9.4/FR-12).
 */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  source: ComposerImage,
  rect: Rect,
  mirror = false,
): void {
  const size = sourceSize(source)
  if (size.width <= 0 || size.height <= 0) return

  const scale = Math.max(rect.width / size.width, rect.height / size.height)
  const drawWidth = size.width * scale
  const drawHeight = size.height * scale
  const drawX = rect.x + (rect.width - drawWidth) / 2
  const drawY = rect.y + (rect.height - drawHeight) / 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(rect.x, rect.y, rect.width, rect.height)
  ctx.clip()
  if (mirror) {
    // Mirror around the slot's vertical axis, then draw normally.
    ctx.translate(rect.x + rect.width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, drawX, drawY, drawWidth, drawHeight)
  ctx.restore()
}

/**
 * Decode a captured Blob into something canvas can draw. Prefers
 * `createImageBitmap` and falls back to an `<img>` backed by an object URL,
 * revoking the URL as soon as the image loads or fails (no leaked URLs).
 */
export async function loadImageFromBlob(blob: Blob): Promise<ComposerImage> {
  if (typeof createImageBitmap === 'function') {
    return await createImageBitmap(blob)
  }
  return await loadImageViaObjectUrl(blob)
}

function loadImageViaObjectUrl(blob: Blob): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new CompositionError('Could not decode the captured image.', 'image-load-failed'))
    }
    image.src = url
  })
}

/**
 * Compose a photostrip canvas. Layer order is explicit:
 *   1. frame background,
 *   2. each photo drawn with `drawCover` + the session filter + mirroring,
 *   3. frame foreground (border/ornaments + date caption).
 */
export function composeStrip(input: {
  session: BoothSession
  images: readonly ComposerImage[]
}): HTMLCanvasElement {
  const { session, images } = input
  const layout = computeStripLayout(session.shotCount)

  const canvas = document.createElement('canvas')
  canvas.width = layout.width
  canvas.height = layout.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new CompositionError('Canvas 2D context unavailable.', 'no-context')
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Layer 1 — background (unfiltered).
  resetFilter(ctx)
  drawFrameBackground(ctx, layout, session.frame)

  // Layer 2 — photos, cropped with cover, filtered.
  //
  // Mirror note (single mirror owner): the booth already applies the output
  // mirror at capture time (`captureFrame(video, { mirror: session.mirrorOutput })`),
  // so the captured blob is stored pre-mirrored and the on-screen preview shows
  // it as-is. Re-mirroring here would cancel that and make the exported PNG the
  // opposite orientation of the preview (FR-10/FR-12 parity). Do NOT mirror here.
  const count = Math.min(images.length, layout.slots.length)
  for (let index = 0; index < count; index += 1) {
    const image = images[index]
    const slot = layout.slots[index]
    if (!image || !slot) continue
    applyFilter(ctx, session.filter)
    drawCover(ctx, image, slot)
    resetFilter(ctx)
  }

  // Layer 3 — foreground/caption, never over the slots.
  resetFilter(ctx)
  drawFrameForeground(ctx, layout, session.frame, { caption: formatDateLabel() })

  return canvas
}

/** Export a composed canvas as a PNG Blob (PRD FR-13 / §9.4). */
export function exportStripPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new CompositionError('PNG export produced no data.', 'export-failed'))
      }
    }, 'image/png')
  })
}

/**
 * Convenience path used by the result page: validate the session/images, then
 * compose and export in one call. Throws a typed {@link CompositionError} when
 * the shot count or image count do not line up, so the UI can offer retry
 * without forcing the user to recapture (PRD §9.4).
 */
export async function composeAndExport(
  session: BoothSession,
  images: readonly ComposerImage[],
): Promise<Blob> {
  if (session.shots.length !== session.shotCount) {
    throw new CompositionError(
      `Cannot compose: session has ${session.shots.length} shots but shotCount is ${session.shotCount}.`,
      'shot-count-mismatch',
    )
  }
  if (images.length !== session.shotCount) {
    throw new CompositionError(
      `Cannot compose: expected ${session.shotCount} images but received ${images.length}.`,
      'image-count-mismatch',
    )
  }
  const canvas = composeStrip({ session, images })
  return exportStripPng(canvas)
}

/** Typed composition/export failure with a stable `code` for the UI. */
export class CompositionError extends Error {
  readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'CompositionError'
    this.code = code
  }
}
