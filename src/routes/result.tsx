import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Camera, Sparkles } from 'lucide-react'
import { useBoothSession } from '../features/photobooth/session-context'
import { useShotUrls } from '../features/photobooth/hooks/useShotUrls'
import { Card } from '../components/ui/Card'
import { Eyebrow } from '../components/ui/Eyebrow'
import { StatusMessage } from '../components/ui/StatusMessage'
import { buttonVariants } from '../components/ui/button-variants'
import { StripPreview } from '../components/result/StripPreview'
import { FilterPicker } from '../components/result/FilterPicker'
import { ResultActions } from '../components/result/ResultActions'
import { fadeRise, staggerContainer } from '../components/motion/variants'
import type { FilterId } from '../features/photobooth/types'

export const Route = createFileRoute('/result')({
  component: ResultPage,
})

/** Minimal top bar so the result page stands on its own (it is not in SiteLayout). */
function ResultHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          to="/"
          aria-label="FlashFrame — home"
          className="group inline-flex items-center gap-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lavender-400"
        >
          <span className="grid size-8 place-items-center rounded-[0.6rem] border border-white/12 bg-ink-800 text-lavender-400 transition-colors duration-200 group-hover:text-lavender-300">
            <Camera className="size-4" aria-hidden />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-fog-100">
            FlashFrame
          </span>
        </Link>
        <Eyebrow className="tracking-[0.32em]">Result</Eyebrow>
      </div>
    </header>
  )
}

/**
 * FR-18 / PRD §11: opening or refreshing `/result` without a session has to land
 * somewhere sane. We never fetch from a server — the local session is simply
 * empty, so we explain that and point back to the booth.
 */
function EmptyState() {
  return (
    <div className="mx-auto grid max-w-md place-items-center px-5 py-16 sm:py-24">
      <div className="w-full">
        <Eyebrow className="justify-center">Result</Eyebrow>
        <h1 className="mt-4 text-center text-3xl font-semibold tracking-tight text-fog-100 sm:text-4xl">
          Nothing to show yet
        </h1>
        <StatusMessage
          className="mt-6"
          tone="empty"
          title="No photos in this session"
          description="Your photos live in this browser tab only — a refresh clears them, and nothing is ever fetched from a server. Head back to the booth to take a fresh strip."
        >
          <Link to="/booth" className={buttonVariants()}>
            <Camera aria-hidden />
            Go to the booth
          </Link>
          <Link to="/" className={buttonVariants({ variant: 'ghost' })}>
            Back to home
          </Link>
        </StatusMessage>
      </div>
    </div>
  )
}

/**
 * A session that was started but never finished. Rather than claiming there are
 * no photos, we say how many shots are in hand and send the visitor back to the
 * booth to complete the strip (L3).
 */
function PartialStripState({ taken, total }: { taken: number; total: number }) {
  return (
    <div className="mx-auto grid max-w-md place-items-center px-5 py-16 sm:py-24">
      <div className="w-full">
        <Eyebrow className="justify-center">Result</Eyebrow>
        <h1 className="mt-4 text-center text-3xl font-semibold tracking-tight text-fog-100 sm:text-4xl">
          Your strip isn&rsquo;t finished
        </h1>
        <StatusMessage
          className="mt-6"
          tone="info"
          title={`${taken} of ${total} photos taken`}
          description="Head back to the booth to take the rest of your strip. Your photos stay in this browser tab only, and nothing is sent anywhere."
        >
          <Link to="/booth" className={buttonVariants()}>
            <Camera aria-hidden />
            Finish your strip
          </Link>
          <Link to="/" className={buttonVariants({ variant: 'ghost' })}>
            Back to home
          </Link>
        </StatusMessage>
      </div>
    </div>
  )
}

function ResultPage() {
  const { session, dispatch, resetSession } = useBoothSession()
  const navigate = useNavigate()
  const urls = useShotUrls(session.shots)

  // Complete = exactly the configured number of shots (FR-12 / FR-18).
  const taken = session.shots.length
  const complete = taken === session.shotCount
  const firstShot = session.shots[0]
  const firstShotUrl = firstShot ? urls[firstShot.id] : undefined

  const handleRetakeLast = () => {
    dispatch({ type: 'retakeLast' })
    void navigate({ to: '/booth' })
  }

  const handleStartOver = () => {
    resetSession()
    void navigate({ to: '/booth' })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only-focusable fixed left-4 top-4 z-50 rounded-full bg-lavender-500 px-4 py-2 text-sm font-semibold text-ink-950"
      >
        Skip to content
      </a>
      <ResultHeader />

      <main id="main" className="flex-1">
        {complete ? (
          <motion.div
            variants={staggerContainer(0.08)}
            initial="hidden"
            animate="visible"
            className="mx-auto grid max-w-6xl items-start gap-8 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-10 lg:pt-12"
          >
            <motion.section
              variants={fadeRise}
              aria-labelledby="strip-heading"
              className="min-w-0"
            >
              <Eyebrow icon={<Sparkles />}>Your strip is ready</Eyebrow>
              <h1
                id="strip-heading"
                className="mt-3 text-3xl font-semibold tracking-tight text-fog-100 sm:text-4xl"
              >
                Little moments, printed.
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-fog-400 sm:text-base">
                Pick a filter, then download your strip. Everything
                is stitched together in your browser — nothing leaves your
                device.
              </p>

              <StripPreview
                session={session}
                urls={urls}
                className="mt-6"
              />
            </motion.section>

            <motion.section
              variants={fadeRise}
              aria-label="Strip options and actions"
              className="flex min-w-0 flex-col gap-5"
            >
              <Card className="p-5 sm:p-6">
                <FilterPicker
                  value={session.filter}
                  onChange={(filter: FilterId) =>
                    dispatch({ type: 'setFilter', filter })
                  }
                  sourceUrl={firstShotUrl}
                />
              </Card>

              <ResultActions
                session={session}
                onRetakeLast={handleRetakeLast}
                onStartOver={handleStartOver}
              />
            </motion.section>
          </motion.div>
        ) : taken > 0 ? (
          <PartialStripState taken={taken} total={session.shotCount} />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  )
}
