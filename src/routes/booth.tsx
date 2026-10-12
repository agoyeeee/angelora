import { useEffect, useRef, useState } from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Aperture, ShieldCheck } from 'lucide-react'
import { useBoothSession } from '../features/photobooth/session-context'
import { isSessionComplete } from '../features/photobooth/session-reducer'
import { useShotUrls } from '../features/photobooth/hooks/useShotUrls'
import { CAMERA_MESSAGES, captureFrame } from '../features/photobooth/camera-service'
import type {
  CountdownSeconds,
  ShotCount,
} from '../features/photobooth/types'
import { Button } from '../components/ui/Button'
import { Eyebrow } from '../components/ui/Eyebrow'
import { StatusMessage } from '../components/ui/StatusMessage'
import {
  fadeRise,
  fadeRiseLead,
  staggerContainer,
} from '../components/motion/variants'
import { BoothHeader } from '../components/booth/BoothHeader'
import { CameraStage } from '../components/booth/CameraStage'
import { CameraStatusPanel } from '../components/booth/CameraStatusPanel'
import { ShotGrid } from '../components/booth/ShotGrid'
import { SessionSettings } from '../components/booth/SessionSettings'
import { DevicePicker } from '../components/booth/DevicePicker'
import { BoothActions } from '../components/booth/BoothActions'
import { ConfirmDialog } from '../components/booth/ConfirmDialog'
import { useCamera } from '../components/booth/useCamera'
import { useCountdown } from '../components/booth/useCountdown'

export const Route = createFileRoute('/booth')({
  component: BoothPage,
})

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })

type ConfirmRequest = {
  title: string
  description: string
  confirmLabel: string
  tone: 'default' | 'danger'
  onConfirm: () => void
}

/**
 * The booth flow (PRD §7.3): camera onboarding + live preview + session
 * settings + the countdown/capture loop. Shots and settings live in the shared
 * session context so they survive the trip to `/result`.
 */
function BoothPage() {
  const { session, dispatch } = useBoothSession()
  const navigate = useNavigate()
  const camera = useCamera()
  const countdown = useCountdown()
  const urls = useShotUrls(session.shots)

  const [capturing, setCapturing] = useState(false)
  const [flash, setFlash] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const sessionRef = useRef(session)
  const abortRef = useRef(false)
  const mountedRef = useRef(true)
  const wasCompleteRef = useRef(isSessionComplete(session))

  const complete = isSessionComplete(session)
  const ready = camera.status === 'ready' && camera.isVideoReady

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    // StrictMode runs setup -> cleanup -> setup in dev, so the flags must be
    // (re)armed here; otherwise the cleanup below would leave `abortRef` true and
    // silently disable the capture loop for the life of the page (H2).
    mountedRef.current = true
    abortRef.current = false
    return () => {
      mountedRef.current = false
      abortRef.current = true
    }
  }, [])

  // Auto-advance to the result page on the transition into "complete".
  useEffect(() => {
    const nowComplete = isSessionComplete(session)
    if (nowComplete && !wasCompleteRef.current) {
      wasCompleteRef.current = true
      const timer = window.setTimeout(() => {
        void navigate({ to: '/result' })
      }, 1200)
      return () => window.clearTimeout(timer)
    }
    wasCompleteRef.current = nowComplete
    return undefined
  }, [session, navigate])

  async function runSequence(): Promise<void> {
    if (abortRef.current) return
    const video = camera.videoRef.current
    if (!video || camera.status !== 'ready' || !camera.isVideoReady) return

    abortRef.current = false
    setCapturing(true)
    setCaptureError(null)

    try {
      let captured = sessionRef.current.shots.length
      const total = sessionRef.current.shotCount

      while (captured < total) {
        if (abortRef.current) break

        setAnnouncement(`Get ready. Shot ${captured + 1} of ${total}.`)
        await countdown.start(sessionRef.current.countdownSeconds)
        if (abortRef.current) break

        // Capture failure must not add a blank shot (PRD §11).
        const shot = await captureFrame(video, {
          mirror: sessionRef.current.mirrorOutput,
        })
        if (abortRef.current) break

        dispatch({ type: 'addShot', shot })
        captured += 1

        setFlash(true)
        window.setTimeout(() => {
          if (mountedRef.current) setFlash(false)
        }, 110)

        setAnnouncement(`Shot ${captured} of ${total} captured.`)
        await delay(430)
      }

      if (!abortRef.current) setAnnouncement('All shots captured.')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The photo could not be captured. Please try again.'
      setCaptureError(message)
      setAnnouncement('Capture failed. You can try again.')
    } finally {
      setCapturing(false)
    }
  }

  function handleStartOver(): void {
    if (capturing) return
    if (session.shots.length === 0) {
      setCaptureError(null)
      dispatch({ type: 'resetShots' })
      return
    }
    setConfirm({
      title: 'Start over?',
      description: `This clears the ${session.shots.length} ${
        session.shots.length === 1 ? 'photo' : 'photos'
      } you have taken. Your settings stay the same.`,
      confirmLabel: 'Start over',
      tone: 'danger',
      onConfirm: () => {
        countdown.cancel()
        setCaptureError(null)
        dispatch({ type: 'resetShots' })
        setAnnouncement('Session cleared.')
      },
    })
  }

  function handleShotCount(next: ShotCount): void {
    if (capturing || next === session.shotCount) return
    if (session.shots.length > next) {
      const extra = session.shots.length - next
      setConfirm({
        title: `Use ${next} photos?`,
        description: `You already captured ${session.shots.length}. Switching to ${next} removes the ${extra} extra ${
          extra === 1 ? 'photo' : 'photos'
        }.`,
        confirmLabel: `Use ${next} photos`,
        tone: 'danger',
        onConfirm: () => dispatch({ type: 'setShotCount', shotCount: next }),
      })
      return
    }
    dispatch({ type: 'setShotCount', shotCount: next })
  }

  function handleCountdown(next: CountdownSeconds): void {
    if (capturing) return
    dispatch({ type: 'setCountdown', countdownSeconds: next })
  }

  const activeDevice = camera.devices.find(
    (device) => device.deviceId === camera.activeDeviceId,
  )
  const cameraLabel = activeDevice?.label?.trim() || null

  let startHint: string | undefined
  if (camera.status === 'idle') startHint = 'Turn on the camera to begin.'
  else if (camera.status === 'requesting') startHint = 'Waiting for camera access…'
  else if (camera.status === 'ready' && !camera.isVideoReady)
    startHint = 'Getting the camera ready…'
  else if (camera.errorStatus) startHint = 'The camera is not available right now.'

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#booth-main"
        className="sr-only-focusable fixed left-4 top-4 z-50 rounded-full bg-lavender-500 px-4 py-2 text-sm font-semibold text-ink-950"
      >
        Skip to content
      </a>
      <BoothHeader />

      <main id="booth-main" className="relative flex-1">
        <div
          aria-hidden
          className="grain pointer-events-none absolute inset-0 opacity-[0.04]"
        />

        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8 sm:pt-9">
          <motion.div
            variants={staggerContainer(0.07, 0.02)}
            initial="hidden"
            animate="visible"
          >
            <motion.header variants={fadeRiseLead} className="max-w-2xl">
              <Eyebrow icon={<Aperture />}>The booth</Eyebrow>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fog-100 sm:text-4xl">
                Set up your shot
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-fog-300 sm:text-base">
                Turn on your camera, choose how many photos you want, then start
                the session. Your camera stays off until you say go, and nothing
                leaves your device.
              </p>
            </motion.header>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-8">
              <div className="flex flex-col gap-5">
                <motion.div variants={fadeRise}>
                  <CameraStage
                    videoRef={camera.videoRef}
                    status={camera.status}
                    isVideoReady={camera.isVideoReady}
                    aspect={camera.aspect}
                    mirrorPreview={session.mirrorPreview}
                    countdownValue={countdown.value}
                    flash={flash}
                    cameraLabel={cameraLabel}
                  />
                </motion.div>

                <motion.div variants={fadeRise}>
                  <CameraStatusPanel
                    status={camera.status}
                    errorStatus={camera.errorStatus}
                    canRetry={
                      camera.errorStatus
                        ? CAMERA_MESSAGES[camera.errorStatus].canRetry
                        : false
                    }
                    onTurnOn={camera.start}
                    onRetry={camera.retry}
                  />
                </motion.div>

                <motion.div variants={fadeRise}>
                  <ShotGrid
                    shotCount={session.shotCount}
                    shots={session.shots}
                    urls={urls}
                  />
                </motion.div>
              </div>

              <div className="flex flex-col gap-5 lg:sticky lg:top-24">
                <motion.div variants={fadeRise}>
                  <SessionSettings
                    shotCount={session.shotCount}
                    countdownSeconds={session.countdownSeconds}
                    mirrorPreview={session.mirrorPreview}
                    disabled={capturing}
                    onShotCount={handleShotCount}
                    onCountdown={handleCountdown}
                    onMirrorPreview={(value) =>
                      dispatch({ type: 'setMirrorPreview', mirrorPreview: value })
                    }
                  />
                </motion.div>

                {camera.devices.length > 1 ? (
                  <motion.div variants={fadeRise}>
                    <DevicePicker
                      devices={camera.devices}
                      activeDeviceId={camera.activeDeviceId}
                      disabled={capturing}
                      onSelect={camera.switchDevice}
                    />
                  </motion.div>
                ) : null}

                {captureError ? (
                  <motion.div variants={fadeRise}>
                    <StatusMessage
                      tone="error"
                      title="The photo didn't capture"
                      description={`${captureError} Your other shots are safe — try again when you're ready.`}
                    >
                      <Button
                        onClick={() => {
                          void runSequence()
                        }}
                        disabled={!ready}
                      >
                        Try again
                      </Button>
                    </StatusMessage>
                  </motion.div>
                ) : null}

                <motion.div variants={fadeRise}>
                  <BoothActions
                    ready={ready}
                    capturing={capturing}
                    captured={session.shots.length}
                    total={session.shotCount}
                    shotsExist={session.shots.length > 0}
                    complete={complete}
                    hint={startHint}
                    onStart={() => {
                      void runSequence()
                    }}
                    onRetakeLast={() => dispatch({ type: 'retakeLast' })}
                    onStartOver={handleStartOver}
                    onViewStrip={() => {
                      void navigate({ to: '/result' })
                    }}
                  />
                </motion.div>

                <motion.p
                  variants={fadeRise}
                  className="flex items-start gap-2 px-1 text-xs leading-relaxed text-fog-500"
                >
                  <ShieldCheck
                    className="mt-0.5 size-3.5 shrink-0 text-lavender-400"
                    aria-hidden
                  />
                  Photos live in this tab and are never uploaded. Reloading or
                  closing the tab discards them, so download your strip first.
                  <Link
                    to="/privacy"
                    className="ml-1 underline decoration-white/25 underline-offset-2 transition-colors duration-200 hover:text-fog-300"
                  >
                    Privacy
                  </Link>
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <ConfirmDialog
        open={confirm !== null}
        tone={confirm?.tone ?? 'default'}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        confirmLabel={confirm?.confirmLabel ?? 'Confirm'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const run = confirm?.onConfirm
          setConfirm(null)
          run?.()
        }}
      />

      {/* Announce once per shot / state change — never on every countdown tick. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  )
}
