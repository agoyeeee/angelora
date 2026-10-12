/**
 * Face-tracked AR effects ("TikTok-style" filters).
 *
 * Each effect is a small canvas drawing in the head-aligned frame described by
 * {@link FaceGeometry}: the origin sits between the eyes, +x runs along the eye
 * line, +y points down the face, and everything scales with the face width
 * `g.u`. {@link drawEffect} sets that frame up, so effects follow the head's
 * position, size and tilt without knowing anything about the camera.
 *
 * Effects are drawn on the live preview overlay *and* onto every captured shot
 * (see `captureFrame`'s `overlay` option), so what the user sees is what ends
 * up on the strip. They never use text, so mirroring is always safe.
 *
 * React-free; only needs a 2D context.
 */

import { EMOJI_FONT_FAMILY } from '../frames'
import type { EffectId } from '../types'
import type { FaceGeometry } from './geometry'

export type EffectOption = {
  id: EffectId
  label: string
  /** Emoji shown on the picker chip. */
  icon: string
}

/** Ordered list for the picker; `none` first. */
export const EFFECTS: readonly EffectOption[] = [
  { id: 'none', label: 'Tanpa filter', icon: '🚫' },
  { id: 'dog', label: 'Anjing', icon: '🐶' },
  { id: 'cat', label: 'Kucing', icon: '🐱' },
  { id: 'bunny', label: 'Kelinci', icon: '🐰' },
  { id: 'crown', label: 'Mahkota', icon: '👑' },
  { id: 'shades', label: 'Kacamata', icon: '😎' },
  { id: 'hearts', label: 'Mata Love', icon: '😍' },
  { id: 'clown', label: 'Badut', icon: '🤡' },
  { id: 'devil', label: 'Setan', icon: '😈' },
  { id: 'halo', label: 'Malaikat', icon: '😇' },
  { id: 'mustache', label: 'Kumis', icon: '🥸' },
  { id: 'flower', label: 'Bunga', icon: '🌸' },
]

type Drawer = (ctx: CanvasRenderingContext2D, g: FaceGeometry, timeMs: number) => void

const SIDES = [-1, 1] as const

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rotation: number,
  fill: string,
  stroke?: string,
  lineWidth = 0,
): void {
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rotation, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke && lineWidth > 0) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
}

function polygon(
  ctx: CanvasRenderingContext2D,
  points: readonly (readonly [number, number])[],
  fill: string,
  stroke?: string,
  lineWidth = 0,
): void {
  ctx.beginPath()
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke && lineWidth > 0) {
    ctx.lineWidth = lineWidth
    ctx.lineJoin = 'round'
    ctx.strokeStyle = stroke
    ctx.stroke()
  }
}

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  lineWidth: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  ctx.strokeStyle = stroke
  ctx.stroke()
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

function emoji(
  ctx: CanvasRenderingContext2D,
  char: string,
  x: number,
  y: number,
  size: number,
  rotation = 0,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rotation)
  ctx.font = `${Math.max(1, Math.round(size))}px ${EMOJI_FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, 0, 0)
  ctx.restore()
}

const dog: Drawer = (ctx, g) => {
  const { u } = g
  const top = g.forehead.y
  for (const s of SIDES) {
    ellipse(ctx, s * 0.5 * u, top + 0.08 * u, 0.13 * u, 0.28 * u, -s * 0.25, '#8b5a2b', '#5a3a1a', 0.02 * u)
  }
  ellipse(ctx, 0, g.nose.y - 0.01 * u, 0.08 * u, 0.058 * u, 0, '#111111')
  ellipse(ctx, -0.025 * u, g.nose.y - 0.03 * u, 0.02 * u, 0.012 * u, 0, 'rgba(255,255,255,0.6)')
  if (g.mouthOpen > 0.05) {
    const length = 0.1 * u * Math.min(1.4, g.mouthOpen * 8)
    ellipse(ctx, 0, g.lowerLip.y + length * 0.8, 0.065 * u, length, 0, '#ff7a93', '#c2415c', 0.012 * u)
  }
}

const cat: Drawer = (ctx, g) => {
  const { u } = g
  const top = g.forehead.y
  for (const s of SIDES) {
    polygon(
      ctx,
      [
        [s * 0.1 * u, top + 0.12 * u],
        [s * 0.48 * u, top + 0.18 * u],
        [s * 0.42 * u, top - 0.3 * u],
      ],
      '#6b6b78',
      '#3f3f4a',
      0.02 * u,
    )
    polygon(
      ctx,
      [
        [s * 0.2 * u, top + 0.1 * u],
        [s * 0.4 * u, top + 0.13 * u],
        [s * 0.38 * u, top - 0.12 * u],
      ],
      '#ffb3c7',
    )
  }
  const noseY = g.nose.y - 0.015 * u
  polygon(
    ctx,
    [
      [-0.045 * u, noseY - 0.025 * u],
      [0.045 * u, noseY - 0.025 * u],
      [0, noseY + 0.03 * u],
    ],
    '#ff7f9f',
    '#c2415c',
    0.008 * u,
  )
  for (const s of SIDES) {
    for (const tilt of [-0.05, 0.02, 0.09]) {
      line(ctx, s * 0.14 * u, noseY + 0.04 * u, s * 0.55 * u, noseY + (0.04 + tilt * 2) * u, 'rgba(255,255,255,0.9)', 0.012 * u)
    }
  }
}

const bunny: Drawer = (ctx, g) => {
  const { u } = g
  const top = g.forehead.y
  for (const s of SIDES) {
    ellipse(ctx, s * 0.2 * u, top - 0.3 * u, 0.1 * u, 0.36 * u, s * 0.18, '#ffffff', '#d8d8e2', 0.015 * u)
    ellipse(ctx, s * 0.2 * u, top - 0.28 * u, 0.055 * u, 0.28 * u, s * 0.18, '#ffb3c7')
  }
  const noseY = g.nose.y - 0.015 * u
  ellipse(ctx, 0, noseY, 0.05 * u, 0.035 * u, 0, '#ff8fab', '#c2415c', 0.008 * u)
}

const crown: Drawer = (ctx, g) => {
  emoji(ctx, '👑', 0, g.forehead.y - 0.3 * g.u, 0.75 * g.u)
}

const shades: Drawer = (ctx, g) => {
  const { u } = g
  const lensW = 0.4 * u
  const lensH = 0.24 * u
  const eyes = [g.eyeA, g.eyeB]
  for (const eye of eyes) {
    roundedRect(ctx, eye.x - lensW / 2, eye.y - lensH * 0.45, lensW, lensH, 0.08 * u)
    ctx.fillStyle = 'rgba(12,12,20,0.94)'
    ctx.fill()
    ctx.lineWidth = 0.02 * u
    ctx.strokeStyle = '#000000'
    ctx.stroke()
    line(ctx, eye.x - lensW * 0.3, eye.y - lensH * 0.3, eye.x - lensW * 0.05, eye.y + lensH * 0.2, 'rgba(255,255,255,0.28)', 0.025 * u)
  }
  const y = g.eyeA.y - 0.03 * u
  line(ctx, g.eyeA.x + lensW / 2, y, g.eyeB.x - lensW / 2, y, '#000000', 0.025 * u)
  line(ctx, g.eyeA.x - lensW / 2, y, g.eyeA.x - 0.52 * u, y - 0.03 * u, '#000000', 0.025 * u)
  line(ctx, g.eyeB.x + lensW / 2, y, g.eyeB.x + 0.52 * u, y - 0.03 * u, '#000000', 0.025 * u)
}

const hearts: Drawer = (ctx, g, timeMs) => {
  const pulse = 1 + 0.12 * Math.sin(timeMs / 150)
  for (const eye of [g.eyeA, g.eyeB]) {
    emoji(ctx, '❤️', eye.x, eye.y, 0.32 * g.u * pulse)
  }
}

const clown: Drawer = (ctx, g) => {
  const { u } = g
  const top = g.forehead.y
  const colors = ['#ff3d81', '#3dd6ff', '#ffd23d']
  for (const s of SIDES) {
    ellipse(ctx, s * 0.55 * u, top + 0.2 * u, 0.17 * u, 0.17 * u, 0, colors[0] ?? '#ff3d81')
    ellipse(ctx, s * 0.45 * u, top + 0.02 * u, 0.15 * u, 0.15 * u, 0, colors[1] ?? '#3dd6ff')
    ellipse(ctx, s * 0.28 * u, top - 0.1 * u, 0.13 * u, 0.13 * u, 0, colors[2] ?? '#ffd23d')
  }
  const noseY = g.nose.y - 0.01 * u
  ellipse(ctx, 0, noseY, 0.1 * u, 0.1 * u, 0, '#e0102c', '#8f0a1d', 0.01 * u)
  ellipse(ctx, -0.035 * u, noseY - 0.035 * u, 0.025 * u, 0.018 * u, -0.5, 'rgba(255,255,255,0.7)')
}

const devil: Drawer = (ctx, g) => {
  const { u } = g
  const top = g.forehead.y
  for (const s of SIDES) {
    ctx.beginPath()
    ctx.moveTo(s * 0.14 * u, top + 0.14 * u)
    ctx.quadraticCurveTo(s * 0.12 * u, top - 0.12 * u, s * 0.36 * u, top - 0.3 * u)
    ctx.quadraticCurveTo(s * 0.34 * u, top - 0.04 * u, s * 0.34 * u, top + 0.16 * u)
    ctx.closePath()
    ctx.fillStyle = '#d62828'
    ctx.fill()
    ctx.lineWidth = 0.02 * u
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#7a0f0f'
    ctx.stroke()
  }
}

const halo: Drawer = (ctx, g) => {
  const { u } = g
  ctx.save()
  ctx.shadowColor = 'rgba(255, 214, 90, 0.9)'
  ctx.shadowBlur = 0.08 * u
  ellipse(ctx, 0, g.forehead.y - 0.2 * u, 0.28 * u, 0.07 * u, 0, 'rgba(0,0,0,0)', '#ffd23d', 0.05 * u)
  ctx.restore()
}

const mustache: Drawer = (ctx, g) => {
  const { u } = g
  const y = (g.nose.y + g.upperLip.y) / 2 + 0.01 * u
  ctx.beginPath()
  ctx.moveTo(0, y + 0.02 * u)
  // Right lobe out, then back along the underside to the left lobe and home.
  ctx.bezierCurveTo(0.1 * u, y - 0.05 * u, 0.28 * u, y - 0.03 * u, 0.34 * u, y - 0.1 * u)
  ctx.bezierCurveTo(0.3 * u, y + 0.06 * u, 0.1 * u, y + 0.08 * u, 0, y + 0.045 * u)
  ctx.bezierCurveTo(-0.1 * u, y + 0.08 * u, -0.3 * u, y + 0.06 * u, -0.34 * u, y - 0.1 * u)
  ctx.bezierCurveTo(-0.28 * u, y - 0.03 * u, -0.1 * u, y - 0.05 * u, 0, y + 0.02 * u)
  ctx.closePath()
  ctx.fillStyle = '#3b2412'
  ctx.fill()
}

const flower: Drawer = (ctx, g) => {
  const { u } = g
  const radiusX = 0.52 * u
  const radiusY = Math.abs(g.forehead.y) + 0.04 * u
  const count = 7
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1)
    const angle = Math.PI + 0.35 + t * (Math.PI - 0.7)
    emoji(
      ctx,
      index % 2 === 0 ? '🌸' : '🌼',
      Math.cos(angle) * radiusX,
      Math.sin(angle) * radiusY,
      0.22 * u,
      angle + Math.PI / 2,
    )
  }
}

const DRAWERS: Readonly<Record<Exclude<EffectId, 'none'>, Drawer>> = {
  dog,
  cat,
  bunny,
  crown,
  shades,
  hearts,
  clown,
  devil,
  halo,
  mustache,
  flower,
}

/**
 * Draw `id` on top of a face. `ctx` must be in video-pixel space (no extra
 * transforms other than a possible capture mirror) — this sets up the
 * head-aligned frame itself and restores the context afterwards.
 */
export function drawEffect(
  ctx: CanvasRenderingContext2D,
  id: EffectId,
  geometry: FaceGeometry,
  timeMs = 0,
): void {
  if (id === 'none') return
  ctx.save()
  ctx.translate(geometry.origin.x, geometry.origin.y)
  ctx.rotate(geometry.roll)
  DRAWERS[id](ctx, geometry, timeMs)
  ctx.restore()
}
