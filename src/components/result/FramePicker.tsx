import { Eyebrow } from '../ui/Eyebrow'
import { PickerCard } from './PickerCard'
import { FRAMES, getPatternCss } from '../../features/photobooth/frames'
import type { FrameId } from '../../features/photobooth/types'
import type { FrameGroup, FrameTheme } from '../../features/photobooth/frames'

/**
 * A miniature strip drawn with the frame's real theme colours (`FrameTheme`), so
 * each option in the frame picker reads as "this is the paper you'll get"
 * (PRD §7.4 / FR-11). Slot and footer placeholders use the theme's text colour
 * at low opacity, which keeps them visible on both light and dark papers.
 */
function FrameSwatch({ theme }: { theme: FrameTheme }) {
  return (
    <span
      aria-hidden
      className="@container relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-[0.4rem] p-[9%]"
      style={{
        backgroundColor: theme.background,
        ...(theme.pattern ? getPatternCss(theme.pattern, 120) : {}),
        backgroundOrigin: 'border-box',
        boxShadow: `inset 0 0 0 1.5px ${theme.border}`,
      }}
    >
      <span
        className="block flex-1 rounded-[3px]"
        style={{ background: theme.text, opacity: 0.14 }}
      />
      <span
        className="my-[6%] block h-[4%] shrink-0 rounded-full"
        style={{ background: theme.accent }}
      />
      <span
        className="block flex-1 rounded-[3px]"
        style={{ background: theme.text, opacity: 0.14 }}
      />
      <span
        className="my-[6%] block h-[4%] shrink-0 rounded-full"
        style={{ background: theme.accent }}
      />
      <span
        className="block flex-1 rounded-[3px]"
        style={{ background: theme.text, opacity: 0.14 }}
      />
      <span
        className="mt-[6%] flex h-[9%] shrink-0 items-center justify-center rounded-[3px]"
        style={{ background: theme.text, opacity: 0.08 }}
      />
      {theme.stickers?.[0] ? (
        <span className="absolute bottom-[2%] right-[8%] text-[length:clamp(0.8rem,22cqw,1.5rem)] leading-none">
          {theme.stickers[0]}
        </span>
      ) : null}
    </span>
  )
}

export type FramePickerProps = {
  value: FrameId
  onChange: (id: FrameId) => void
}

const GROUPS: readonly { id: FrameGroup; label: string }[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'fun', label: 'Lucu-lucuan' },
]

export function FramePicker({ value, onChange }: FramePickerProps) {
  return (
    <div role="group" aria-label="Frame">
      <Eyebrow>Frame</Eyebrow>
      {GROUPS.map((group) => (
        <div key={group.id} role="group" aria-label={`${group.label} frames`}>
          <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.24em] text-fog-500">
            {group.label}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {FRAMES.filter((frame) => frame.group === group.id).map((frame) => (
              <PickerCard
                key={frame.id}
                label={frame.label}
                ariaLabel={`${frame.label} frame`}
                selected={frame.id === value}
                onSelect={() => onChange(frame.id)}
                preview={<FrameSwatch theme={frame.theme} />}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
