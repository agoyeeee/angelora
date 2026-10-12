import { Chip } from '../ui/Chip'
import { Eyebrow } from '../ui/Eyebrow'
import { EFFECTS } from '../../features/photobooth/face/effects'
import type { EffectId } from '../../features/photobooth/types'

export type EffectPickerProps = {
  value: EffectId
  onChange: (id: EffectId) => void
  /** Locked while a capture sequence is running. */
  disabled?: boolean
}

/**
 * Face-filter chooser (the "TikTok filter" row). The effect follows the user's
 * face on the live preview and is baked into every shot, so it is picked here,
 * before the session starts.
 */
export function EffectPicker({ value, onChange, disabled = false }: EffectPickerProps) {
  return (
    <div role="group" aria-label="Face filter">
      <Eyebrow>Filter wajah</Eyebrow>
      <div className="mt-3 flex flex-wrap gap-2">
        {EFFECTS.map((effect) => (
          <Chip
            key={effect.id}
            label={effect.label}
            aria-label={`${effect.label} face filter`}
            icon={
              <span aria-hidden className="text-base leading-none">
                {effect.icon}
              </span>
            }
            selected={effect.id === value}
            disabled={disabled}
            onClick={() => onChange(effect.id)}
          />
        ))}
      </div>
    </div>
  )
}
