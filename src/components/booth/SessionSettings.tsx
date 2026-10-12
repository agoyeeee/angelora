import { Images, Timer } from 'lucide-react'
import type {
  CountdownSeconds,
  ShotCount,
} from '../../features/photobooth/types'
import { COUNTDOWN_OPTIONS, SHOT_COUNTS } from '../../features/photobooth/types'
import { Card } from '../ui/Card'
import { Chip } from '../ui/Chip'
import { Eyebrow } from '../ui/Eyebrow'
import { ToggleSwitch } from './ToggleSwitch'

export type SessionSettingsProps = {
  shotCount: ShotCount
  countdownSeconds: CountdownSeconds
  mirrorPreview: boolean
  /** Locked while a capture sequence is running. */
  disabled?: boolean
  onShotCount: (value: ShotCount) => void
  onCountdown: (value: CountdownSeconds) => void
  onMirrorPreview: (value: boolean) => void
}

/**
 * Pre-session settings (FR-05): photo count, countdown length and mirror
 * preview. Choices live in session state, so they persist across the session
 * and survive a retake — only an explicit "start over" clears the photos.
 */
export function SessionSettings({
  shotCount,
  countdownSeconds,
  mirrorPreview,
  disabled = false,
  onShotCount,
  onCountdown,
  onMirrorPreview,
}: SessionSettingsProps) {
  return (
    <Card as="section" aria-label="Session settings" className="flex flex-col gap-5 p-5">
      <div>
        <Eyebrow icon={<Images />}>Photos per strip</Eyebrow>
        <div
          role="group"
          aria-label="Number of photos"
          className="mt-3 flex flex-wrap gap-2"
        >
          {SHOT_COUNTS.map((count) => (
            <Chip
              key={count}
              label={`${count} photos`}
              icon={<Images />}
              selected={count === shotCount}
              disabled={disabled}
              onClick={() => onShotCount(count)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-white/8 pt-5">
        <Eyebrow icon={<Timer />}>Countdown</Eyebrow>
        <div
          role="group"
          aria-label="Countdown length"
          className="mt-3 flex flex-wrap gap-2"
        >
          {COUNTDOWN_OPTIONS.map((seconds) => (
            <Chip
              key={seconds}
              label={`${seconds} seconds`}
              icon={<Timer />}
              selected={seconds === countdownSeconds}
              disabled={disabled}
              onClick={() => onCountdown(seconds)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-white/8 pt-5">
        <ToggleSwitch
          label="Mirror preview"
          description="Flip the live view like a selfie mirror."
          checked={mirrorPreview}
          onChange={onMirrorPreview}
          disabled={disabled}
        />
      </div>
    </Card>
  )
}
