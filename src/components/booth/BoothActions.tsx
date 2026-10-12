import { ArrowRight, Camera, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { StatusMessage } from '../ui/StatusMessage'

export type BoothActionsProps = {
  /** Camera ready and frames available. */
  ready: boolean
  capturing: boolean
  captured: number
  total: number
  shotsExist: boolean
  complete: boolean
  /** Inline explanation for a disabled start button. */
  hint?: string
  onStart: () => void
  onRetakeLast: () => void
  onStartOver: () => void
  onViewStrip: () => void
}

/**
 * Primary actions for the booth: start/continue the session, retake the last
 * shot, or start over (FR-05, FR-09). The whole capture loop runs from the one
 * primary button — it counts down and fires each remaining shot in turn.
 */
export function BoothActions({
  ready,
  capturing,
  captured,
  total,
  shotsExist,
  complete,
  hint,
  onStart,
  onRetakeLast,
  onStartOver,
  onViewStrip,
}: BoothActionsProps) {
  return (
    <Card as="section" aria-label="Session actions" className="flex flex-col gap-4 p-5">
      {complete ? (
        <StatusMessage
          tone="success"
          title="Your strip is ready"
          description="All shots are captured. Open the result to pick a filter and frame, then download."
        >
          <Button onClick={onViewStrip} rightIcon={<ArrowRight aria-hidden />}>
            View strip
          </Button>
        </StatusMessage>
      ) : capturing ? (
        <StatusMessage
          tone="loading"
          title={`Taking shot ${captured + 1} of ${total}`}
          description="Hold still and look at the camera."
        />
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            fullWidth
            size="lg"
            onClick={onStart}
            disabled={!ready}
            leftIcon={<Camera aria-hidden />}
          >
            {captured > 0 ? 'Continue session' : 'Start session'}
          </Button>
          {hint ? (
            <p className="text-center text-xs text-fog-500">{hint}</p>
          ) : null}
        </div>
      )}

      {shotsExist && !capturing && !complete ? (
        <div className="flex flex-col gap-3 border-t border-white/8 pt-4 sm:flex-row">
          <Button
            variant="secondary"
            fullWidth
            onClick={onRetakeLast}
            leftIcon={<RotateCcw aria-hidden />}
          >
            Retake last
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={onStartOver}
            leftIcon={<Trash2 aria-hidden />}
          >
            Start over
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
