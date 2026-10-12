import { Link } from '@tanstack/react-router'
import { RefreshCw, ShieldCheck, Video } from 'lucide-react'
import type {
  CameraErrorStatus,
  CameraStatus,
} from '../../features/photobooth/types'
import { CAMERA_MESSAGES } from '../../features/photobooth/camera-service'
import { Button } from '../ui/Button'
import { buttonVariants } from '../ui/button-variants'
import { StatusMessage } from '../ui/StatusMessage'

export type CameraStatusPanelProps = {
  status: CameraStatus
  errorStatus: CameraErrorStatus | null
  /** Whether the current failure offers a retry (from CAMERA_MESSAGES). */
  canRetry: boolean
  onTurnOn: () => void
  onRetry: () => void
}

/**
 * Human-readable camera state, built on the shared StatusMessage so loading,
 * success and error states stay consistent with the rest of the app (FR-02,
 * FR-15). Copy comes from CAMERA_MESSAGES; the idle state adds short permission
 * onboarding before the browser prompt appears.
 */
export function CameraStatusPanel({
  status,
  errorStatus,
  canRetry,
  onTurnOn,
  onRetry,
}: CameraStatusPanelProps) {
  if (status === 'idle') {
    return (
      <StatusMessage
        tone="info"
        title="Turn on your camera"
        description={
          <div className="space-y-2">
            <p>
              FlashFrame needs camera access to take your photos. Your browser
              will ask for permission first — the camera stays off until you say
              go.
            </p>
            <p className="flex items-center gap-2 text-xs text-fog-500">
              <ShieldCheck className="size-3.5 shrink-0 text-lavender-400" aria-hidden />
              Only a video track is requested. No microphone, nothing uploaded.
            </p>
          </div>
        }
      >
        <Button
          onClick={onTurnOn}
          leftIcon={<Video aria-hidden />}
        >
          Turn on camera
        </Button>
      </StatusMessage>
    )
  }

  if (status === 'requesting') {
    const message = CAMERA_MESSAGES.requesting
    return (
      <StatusMessage
        tone="loading"
        title={message.title}
        description={message.guidance}
      />
    )
  }

  if (status === 'ready') {
    const message = CAMERA_MESSAGES.ready
    return (
      <StatusMessage
        tone="success"
        title={message.title}
        description={message.guidance}
      />
    )
  }

  // Failure states (errorStatus is non-null here).
  const message = errorStatus ? CAMERA_MESSAGES[errorStatus] : CAMERA_MESSAGES.error
  const showRetry = errorStatus !== 'unsupported' && canRetry

  return (
    <StatusMessage
      tone="error"
      title={message.title}
      description={message.guidance}
    >
      {showRetry ? (
        <Button
          onClick={onRetry}
          variant="secondary"
          leftIcon={<RefreshCw aria-hidden />}
        >
          Try again
        </Button>
      ) : null}
      {errorStatus === 'unsupported' ? (
        <>
          <Link to="/" className={buttonVariants({ variant: 'secondary' })}>
            Back to home
          </Link>
          <Link
            to="/privacy"
            className={buttonVariants({ variant: 'ghost' })}
          >
            How camera access works
          </Link>
        </>
      ) : null}
    </StatusMessage>
  )
}
