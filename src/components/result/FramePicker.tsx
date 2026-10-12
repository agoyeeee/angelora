import { Eyebrow } from '../ui/Eyebrow'
import { PickerCard } from './PickerCard'
import { FRAMES } from '../../features/photobooth/frames'
import type { FrameId } from '../../features/photobooth/types'
import type { FrameTheme } from '../../features/photobooth/frames'

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
      className="flex aspect-[3/4] w-full flex-col overflow-hidden rounded-[0.4rem] p-[9%]"
      style={{
        background: theme.background,
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
        className="mt-[6%] block h-[9%] shrink-0 rounded-[3px]"
        style={{ background: theme.text, opacity: 0.08 }}
      />
    </span>
  )
}

export type FramePickerProps = {
  value: FrameId
  onChange: (id: FrameId) => void
}

export function FramePicker({ value, onChange }: FramePickerProps) {
  return (
    <div role="group" aria-label="Frame">
      <Eyebrow>Frame</Eyebrow>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {FRAMES.map((frame) => (
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
  )
}
