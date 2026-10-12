import { useCallback, useRef, useState } from 'react'
import { Download, RotateCcw, Undo2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Eyebrow } from '../ui/Eyebrow'
import { StatusMessage } from '../ui/StatusMessage'
import {
  CompositionError,
  composeAndExport,
  loadImageFromBlob,
} from '../../features/photobooth/canvas-composer'
import { buildFilename, downloadBlob } from '../../lib/download'
import type { BoothSession } from '../../features/photobooth/types'
import type { ComposerImage } from '../../features/photobooth/canvas-composer'

type ExportState = 'idle' | 'composing' | 'success' | 'error'

/**
 * Free the decoded images once composition is done. `ImageBitmap` holds a GPU
 * surface that must be released explicitly via `close()`; the `<img>` fallback
 * (used when `createImageBitmap` is unavailable) has no such method, so the
 * capability check keeps that path safe. Without this, repeated exports pin
 * memory on low-RAM phones (L4).
 */
function releaseComposerImages(images: readonly ComposerImage[]): void {
  for (const image of images) {
    if ('close' in image && typeof image.close === 'function') {
      image.close()
    }
  }
}

/** Plain, non-technical copy for each composition failure (PRD §11). */
function describeExportError(error: unknown): string {
  if (error instanceof CompositionError) {
    switch (error.code) {
      case 'shot-count-mismatch':
      case 'image-count-mismatch':
        return 'Some photos were missing when we put the strip together. Try again, or retake the last shot.'
      case 'image-load-failed':
        return 'One of your photos could not be read. Try again, or retake the last shot.'
      default:
        return 'Something went wrong while building the PNG. Your photos are still here — try again.'
    }
  }
  return 'Something went wrong while building the PNG. Your photos are still here — try again.'
}

/**
 * Export pipeline for the primary action (FR-13 / PRD §9.4):
 * decode every captured blob → `composeAndExport` → hand the PNG to the browser
 * via `downloadBlob`. A ref guard stops double-clicks from stacking runs, and a
 * failure keeps the session untouched so the button doubles as the retry.
 */
function usePngExport(session: BoothSession) {
  const [state, setState] = useState<ExportState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const runningRef = useRef(false)

  const download = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    setState('composing')
    setErrorMessage(null)
    try {
      const images = await Promise.all(
        session.shots.map((shot) => loadImageFromBlob(shot.blob)),
      )
      try {
        const blob = await composeAndExport(session, images)
        downloadBlob(blob, buildFilename())
        setState('success')
      } finally {
        // Release the decoded bitmaps whether composition succeeded or failed.
        releaseComposerImages(images)
      }
    } catch (error) {
      setState('error')
      setErrorMessage(describeExportError(error))
    } finally {
      runningRef.current = false
    }
  }, [session])

  return { state, errorMessage, download }
}

export type ResultActionsProps = {
  session: BoothSession
  onRetakeLast: () => void
  onStartOver: () => void
}

export function ResultActions({
  session,
  onRetakeLast,
  onStartOver,
}: ResultActionsProps) {
  const { state, errorMessage, download } = usePngExport(session)
  const [confirming, setConfirming] = useState(false)
  const composing = state === 'composing'

  return (
    <Card className="p-5 sm:p-6">
      <Eyebrow>Save it</Eyebrow>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-fog-100">
        Download your strip
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-fog-400">
        One PNG file, written straight to your device.
      </p>

      <Button
        className="mt-4"
        size="lg"
        fullWidth
        leftIcon={<Download aria-hidden />}
        onClick={download}
        disabled={composing}
        aria-busy={composing}
      >
        {composing ? 'Building PNG…' : 'Download PNG'}
      </Button>

      {/* `StatusMessage` owns role + aria-live, so export status is announced. */}
      {state === 'composing' ? (
        <StatusMessage
          className="mt-3"
          tone="loading"
          title="Building your PNG"
          description="Stitching your photos into one strip — this all happens on your device."
        />
      ) : null}

      {state === 'success' ? (
        <StatusMessage
          className="mt-3"
          tone="success"
          title="Download started"
          description="Check your browser's downloads for the PNG. It was built on your device, and no copy was saved to a gallery."
        />
      ) : null}

      {state === 'error' ? (
        <StatusMessage
          className="mt-3"
          tone="error"
          title="We couldn't build your PNG"
          description={errorMessage ?? undefined}
        >
          <Button variant="secondary" size="sm" onClick={download}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
        </StatusMessage>
      ) : null}

      <div className="mt-5 border-t border-white/8 pt-5">
        <Eyebrow>Not quite right?</Eyebrow>

        {confirming ? (
          <StatusMessage
            className="mt-3"
            tone="info"
            title="Start over?"
            description="This clears every photo in your strip. You can't undo it."
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirming(false)}
              autoFocus
            >
              Keep my strip
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onStartOver}
              className="text-coral-400 hover:bg-coral-500/12 hover:text-coral-400"
            >
              <RotateCcw aria-hidden />
              Yes, start over
            </Button>
          </StatusMessage>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
            <Button
              variant="secondary"
              fullWidth
              leftIcon={<Undo2 aria-hidden />}
              onClick={onRetakeLast}
            >
              Retake last
            </Button>
            <Button
              variant="ghost"
              fullWidth
              leftIcon={<RotateCcw aria-hidden />}
              onClick={() => setConfirming(true)}
            >
              Start over
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
