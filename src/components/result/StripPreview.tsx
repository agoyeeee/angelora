import { AnimatePresence, motion } from 'motion/react'
import { computeStripLayout } from '../../features/photobooth/canvas-composer'
import { FILTERS, getFilterCss } from '../../features/photobooth/filters'
import {
  FRAMES,
  computeStickers,
  getFrameTheme,
  getPatternCss,
} from '../../features/photobooth/frames'
import { cn, formatDateLabel } from '../../lib/utils'
import { crossfade } from '../motion/variants'
import { LiveSlot } from '../booth/LiveSlot'
import type { LiveSource } from '../booth/LiveSlot'
import type { BoothSession } from '../../features/photobooth/types'

/**
 * The hero of the result page (PRD §7.4): the finished photostrip on a dark,
 * neutral backdrop with a light lift.
 *
 * It is drawn in CSS but uses the *real* strip geometry from
 * `computeStripLayout` (4:3 slots, padding, gap, footer) and the same
 * `getFrameTheme` colours + `getFilterCss` filter strings as the canvas export,
 * so the preview and the downloaded PNG line up (FR-10/FR-12). No per-frame
 * pixel work happens here — switching filter/frame just crossfades two copies
 * via `AnimatePresence` (PRD §7.5).
 *
 * The artwork itself is decorative to assistive tech (`role="img"` with a
 * summary label); the pickers and the visible caption carry the real state.
 */
export type StripPreviewProps = {
  session: BoothSession
  /** Object URLs keyed by shot id, from `useShotUrls`. */
  urls: Record<string, string>
  /**
   * Booth mode: empty slots show the live camera instead of a blank, so a
   * frame choice previews on the user's own face.
   */
  live?: LiveSource | null
  /** Small variant for the booth: tighter padding, narrower strip, no caption line. */
  compact?: boolean
  className?: string
}

export function StripPreview({
  session,
  urls,
  live = null,
  compact = false,
  className,
}: StripPreviewProps) {
  const layout = computeStripLayout(session.shotCount)
  const theme = getFrameTheme(session.frame)
  const filterCss = getFilterCss(session.filter)
  const caption = formatDateLabel()
  const stickers = computeStickers(layout, theme)
  const patternCss = theme.pattern ? getPatternCss(theme.pattern, layout.width) : undefined

  const filterLabel =
    FILTERS.find((option) => option.id === session.filter)?.label ?? session.filter
  const frameLabel =
    FRAMES.find((option) => option.id === session.frame)?.label ?? session.frame

  // Positions come straight from the export layout, expressed as percentages of
  // the strip so the preview scales with its box without distortion.
  const pctX = (value: number) => `${(value / layout.width) * 100}%`
  const pctY = (value: number) => `${(value / layout.height) * 100}%`

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-card border border-white/10 bg-ink-850/60 shadow-card',
        compact ? 'p-3' : 'p-5 sm:p-8',
        className,
      )}
    >
      {/* Soft lavender atmosphere + a whisper of grain, kept clear of the strip. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-12%] size-72 rounded-full bg-[radial-gradient(closest-side,rgba(159,134,255,0.20),transparent)]"
      />
      <div
        aria-hidden
        className="grain pointer-events-none absolute inset-0 opacity-[0.04]"
      />

      <div className="relative grid place-items-center">
        {/*
          Width drives the size: the strip fills its grid column up to a
          comfortable 15rem on phones, ramping to 22rem on `lg` (the responsive
          `--strip-max` custom property). The last `min()` term is a large
          absolute height ceiling expressed as a width, so an unexpectedly tall
          strip can never become absurd. Crucially we cap the *width*, so
          `aspect-ratio` still derives the height from the real export geometry —
          the very tall 4-shot strip (about 3.1× taller than wide) simply lets
          the page scroll instead of being squashed, keeping its exact 4:3 slots
          (FR-10/FR-12). The `@container` makes `cqw` units below resolve against
          the strip width, matching the canvas proportions (border ≈ 10/1200 of
          the width, caption ≈ 48/1200).
        */}
        <div
          role="img"
          aria-label={`Photostrip preview: ${session.shots.length} photos, ${filterLabel} filter, ${frameLabel} frame`}
          className={cn(
            '@container relative mx-auto',
            compact
              ? '[--strip-max:9rem] sm:[--strip-max:11rem]'
              : '[--strip-max:15rem] sm:[--strip-max:18rem] md:[--strip-max:20rem] lg:[--strip-max:22rem]',
          )}
          style={{
            width: `min(100%, var(--strip-max), calc(1400px * ${(layout.width / layout.height).toFixed(4)}))`,
            aspectRatio: `${layout.width} / ${layout.height}`,
          }}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={`${session.shotCount}-${session.filter}-${session.frame}`}
              variants={crossfade}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 shadow-panel"
              style={{
                borderRadius: '0.7rem',
                backgroundColor: theme.background,
                ...patternCss,
                backgroundOrigin: 'border-box',
                border: `0.84cqw solid ${theme.border}`,
              }}
            >
              {/* Photo slots — 4:3, cover-cropped, filter applied to each image. */}
              {layout.slots.map((slot, index) => {
                const shot = session.shots[index]
                const url = shot ? urls[shot.id] : undefined
                return (
                  <span
                    key={shot?.id ?? `slot-${index}`}
                    className="absolute block overflow-hidden bg-ink-800"
                    style={{
                      left: pctX(slot.x),
                      top: pctY(slot.y),
                      width: pctX(slot.width),
                      height: pctY(slot.height),
                    }}
                  >
                    {url ? (
                      <img
                        src={url}
                        alt=""
                        aria-hidden
                        draggable={false}
                        className="size-full object-cover"
                        style={{ filter: filterCss }}
                      />
                    ) : live ? (
                      <LiveSlot source={live} filterCss={filterCss} />
                    ) : (
                      <span
                        aria-hidden
                        className="block size-full bg-ink-800"
                      />
                    )}
                  </span>
                )
              })}

              {/* Accent separators, drawn in the gaps exactly like the composer. */}
              {layout.slots.map((slot, index) => {
                const next = layout.slots[index + 1]
                if (!next || stickers.length > 0) return null
                const gapTop = slot.y + slot.height
                const gapHeight = next.y - gapTop
                if (gapHeight <= 0) return null
                const barHeight = Math.max(4, Math.round(gapHeight * 0.4))
                const barY = gapTop + (gapHeight - barHeight) / 2
                return (
                  <span
                    key={`accent-${index}`}
                    aria-hidden
                    className="absolute block"
                    style={{
                      left: pctX(slot.x),
                      top: pctY(barY),
                      width: pctX(slot.width),
                      height: pctY(barHeight),
                      background: theme.accent,
                    }}
                  />
                )
              })}

              {/* Emoji stickers — same placements the export draws (computeStickers). */}
              {stickers.map((sticker, index) => (
                <span
                  key={`sticker-${index}`}
                  aria-hidden
                  className="pointer-events-none absolute block select-none leading-none"
                  style={{
                    left: pctX(sticker.x),
                    top: pctY(sticker.y),
                    fontSize: `${((sticker.size / layout.width) * 100).toFixed(3)}cqw`,
                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}rad)`,
                  }}
                >
                  {sticker.char}
                </span>
              ))}

              {/* Footer — optional tagline above the same date the export prints. */}
              <span
                className="absolute flex flex-col items-center justify-center gap-[1cqw]"
                style={{
                  left: pctX(layout.footer.x),
                  top: pctY(layout.footer.y),
                  width: pctX(layout.footer.width),
                  height: pctY(layout.footer.height),
                  color: theme.text,
                }}
              >
                {theme.tagline ? (
                  <span className="text-center text-[length:clamp(0.6rem,5cqw,1.25rem)] font-extrabold leading-none tracking-tight">
                    {theme.tagline}
                  </span>
                ) : null}
                <span className="font-mono text-[length:clamp(0.5rem,4cqw,1rem)] uppercase tracking-[0.32em]">
                  {caption}
                </span>
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {compact ? null : (
        <p className="relative mt-5 text-center font-mono text-xs uppercase tracking-[0.24em] text-fog-500">
          {session.shots.length} photos · {filterLabel} · {frameLabel}
        </p>
      )}
    </div>
  )
}
