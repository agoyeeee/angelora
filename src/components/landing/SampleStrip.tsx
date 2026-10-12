import { useId } from 'react'
import { cn } from '../../lib/utils'

/**
 * A locally-drawn sample photostrip (PRD §7.1: no remote images). Each frame is
 * an abstract film-strip "portrait" — gradient backdrop + a simple silhouette —
 * so the landing reads as designed artwork rather than placeholder boxes.
 *
 * Pure SVG, theme-token colours, no network requests. Later phases can reuse
 * `tone` for consistency with the composer's frame palette.
 */

export type SampleStripTone = 'lavender' | 'coral' | 'mint' | 'rose'

type CellTheme = {
  from: string
  to: string
  tint: string
  headX: number
}

const CELL_THEMES: readonly CellTheme[] = [
  { from: '#cbb9ff', to: '#6a45d4', tint: '#241a4d', headX: 86 },
  { from: '#ffc7a8', to: '#ed5734', tint: '#4a1d11', headX: 116 },
  { from: '#b9e4ff', to: '#3f6fd0', tint: '#152c52', headX: 90 },
  { from: '#ffd4ec', to: '#d0438f', tint: '#48132f', headX: 112 },
]

const TONE_ACCENT: Record<SampleStripTone, string> = {
  lavender: '#8461f0',
  coral: '#ed5734',
  mint: '#2fb6a0',
  rose: '#d0438f',
}

const PAPER = '#f7f3ea'
const PAPER_INK = '#14121a'

export type SampleStripProps = {
  shots?: 3 | 4
  tone?: SampleStripTone
  /** Wordmark printed at the foot of the strip. */
  caption?: string
  /** Small date line under the caption. */
  date?: string
  className?: string
  /**
   * Decorative collages pass `true` so screen readers skip the artwork and read
   * only the real copy around it.
   */
  decorative?: boolean
}

export function SampleStrip({
  shots = 4,
  tone = 'lavender',
  caption = 'FLASHFRAME',
  date = '2026',
  className,
  decorative = false,
}: SampleStripProps) {
  const uid = useId().replace(/[:]/g, '')

  const width = 200
  const padX = 16
  const innerW = width - padX * 2
  const top = 44
  const cellH = 118
  const gap = 12
  const footerH = 58
  const cells = CELL_THEMES.slice(0, shots)
  const height = top + cells.length * cellH + (cells.length - 1) * gap + footerH
  const centerX = width / 2

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block h-auto w-full', className)}
      role={decorative ? undefined : 'img'}
      aria-label={
        decorative ? undefined : `Sample ${shots}-photo photostrip preview`
      }
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <defs>
        {cells.map((cell, i) => (
          <linearGradient
            key={i}
            id={`${uid}-grad-${i}`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0" stopColor={cell.from} />
            <stop offset="1" stopColor={cell.to} />
          </linearGradient>
        ))}
      </defs>

      {/* Paper body */}
      <rect
        width={width}
        height={height}
        rx={14}
        fill={PAPER}
        stroke={PAPER_INK}
        strokeOpacity={0.08}
      />

      {/* Header: small accent rule + perforation dots, editorial detail */}
      <rect
        x={padX}
        y={28}
        width={40}
        height={3}
        rx={1.5}
        fill={TONE_ACCENT[tone]}
      />
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx={width - padX - 2 - i * 9}
          cy={29.5}
          r={1.7}
          fill={PAPER_INK}
          opacity={0.22}
        />
      ))}

      {/* Frames */}
      {cells.map((cell, i) => {
        const y = top + i * (cellH + gap)
        const clipId = `${uid}-clip-${i}`
        return (
          <g key={i}>
            <clipPath id={clipId}>
              <rect
                x={padX}
                y={y}
                width={innerW}
                height={cellH}
                rx={10}
              />
            </clipPath>
            <g clipPath={`url(#${clipId})`}>
              <rect
                x={padX}
                y={y}
                width={innerW}
                height={cellH}
                fill={`url(#${uid}-grad-${i})`}
              />
              {/* soft light source */}
              <circle
                cx={padX + innerW - 30}
                cy={y + 26}
                r={26}
                fill="#ffffff"
                opacity={0.18}
              />
              {/* silhouette bust */}
              <ellipse
                cx={cell.headX}
                cy={y + cellH + 6}
                rx={42}
                ry={40}
                fill={cell.tint}
                opacity={0.82}
              />
              <circle
                cx={cell.headX}
                cy={y + cellH - 34}
                r={17}
                fill={cell.tint}
                opacity={0.9}
              />
              <rect
                x={padX}
                y={y}
                width={innerW}
                height={cellH}
                fill="none"
                stroke={PAPER_INK}
                strokeOpacity={0.12}
              />
            </g>
          </g>
        )
      })}

      {/* Footer caption */}
      <line
        x1={padX}
        y1={height - footerH + 16}
        x2={width - padX}
        y2={height - footerH + 16}
        stroke={PAPER_INK}
        strokeOpacity={0.1}
      />
      <text
        x={centerX}
        y={height - 26}
        textAnchor="middle"
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        fontSize={11}
        letterSpacing={2.4}
        fill={PAPER_INK}
        opacity={0.74}
      >
        {caption}
      </text>
      <text
        x={centerX}
        y={height - 11}
        textAnchor="middle"
        fontFamily="'JetBrains Mono', ui-monospace, monospace"
        fontSize={8}
        letterSpacing={1.4}
        fill={PAPER_INK}
        opacity={0.42}
      >
        {date}
      </text>
    </svg>
  )
}
