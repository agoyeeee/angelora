import { Link, createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import {
  Camera,
  CloudOff,
  Download,
  EyeOff,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SiteLayout } from '../components/layout/SiteLayout'
import { buttonVariants } from '../components/ui/button-variants'
import { Eyebrow } from '../components/ui/Eyebrow'
import { fadeRise, staggerContainer } from '../components/motion/variants'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
})

type Point = { icon: LucideIcon; title: string; body: string }

const POINTS: readonly Point[] = [
  {
    icon: Camera,
    title: 'Camera, on your terms',
    body: 'The camera only starts after you tap Start Photobooth and your browser asks for permission.',
  },
  {
    icon: LockKeyhole,
    title: 'Stays in this tab',
    body: 'Photos are captured and kept in your tab\u2019s memory while you work on a strip.',
  },
  {
    icon: CloudOff,
    title: 'Never uploaded',
    body: 'There is no photo server. Your images never leave your device.',
  },
  {
    icon: EyeOff,
    title: 'No mic, no tracking',
    body: 'We don\u2019t request your microphone, set tracking cookies, or run third-party analytics.',
  },
  {
    icon: RefreshCw,
    title: 'Gone on refresh',
    body: 'Reload or close the tab and the session is discarded, so download your strip first.',
  },
  {
    icon: Download,
    title: 'You save it yourself',
    body: 'The strip is written straight to your device when you press Download.',
  },
]

const FINE_PRINT: readonly { term: string; detail: string }[] = [
  {
    term: 'What we collect',
    detail:
      'Nothing. The MVP has no accounts, no analytics, and no cookies for tracking.',
  },
  {
    term: 'Camera access',
    detail:
      'Granted by your browser only after you tap Start Photobooth. You can revoke it at any time in your browser settings.',
  },
  {
    term: 'Session storage',
    detail:
      'Photos live in tab memory only. Images are never written to localStorage or sessionStorage.',
  },
  {
    term: 'Where it runs',
    detail:
      'Entirely in your browser. The site is served as static files over HTTPS, with no backend for photos.',
  },
  {
    term: 'Third parties',
    detail:
      'No advertising networks, no tracking scripts, and no external photo services.',
  },
]

function PointCard({ point }: { point: Point }) {
  const Icon = point.icon
  return (
    <motion.li
      variants={fadeRise}
      className="rounded-tile border border-white/10 bg-ink-850/70 p-5"
    >
      <span className="grid size-10 place-items-center rounded-tile border border-white/10 bg-ink-800 text-lavender-400">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-fog-100">
        {point.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-fog-400">{point.body}</p>
    </motion.li>
  )
}

function PrivacyPage() {
  return (
    <SiteLayout>
      <main
        id="main"
        className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20"
      >
        <header>
          <Eyebrow icon={<ShieldCheck />}>Privacy</Eyebrow>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fog-100 sm:text-5xl">
            Your photos stay on your device.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-fog-300">
            FlashFrame is a browser-only photobooth. Everything happens inside
            your tab — there is no account to create and no photo upload.
          </p>
        </header>

        {/* Coral heads-up: the one thing users must not miss (PRD §12). */}
        <div className="mt-9 flex items-start gap-4 rounded-tile border border-coral-500/35 bg-coral-500/10 p-5">
          <span
            aria-hidden
            className="grid size-10 shrink-0 place-items-center rounded-full bg-coral-500/15 text-coral-400"
          >
            <RefreshCw className="size-5" />
          </span>
          <div>
            <p className="font-display text-sm font-semibold text-fog-100">
              Download before you leave
            </p>
            <p className="mt-1 text-sm leading-relaxed text-fog-400">
              Refresh or close the tab and your results can be discarded. Save
              your photostrip while the session is open.
            </p>
          </div>
        </div>

        <section className="mt-14" aria-labelledby="plain-words">
          <h2
            id="plain-words"
            className="text-xl font-semibold tracking-tight text-fog-100 sm:text-2xl"
          >
            In plain words
          </h2>
          <motion.ul
            variants={staggerContainer(0.055)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-6 grid gap-4 sm:grid-cols-2"
          >
            {POINTS.map((point) => (
              <PointCard key={point.title} point={point} />
            ))}
          </motion.ul>
        </section>

        <section className="mt-14" aria-labelledby="fine-print">
          <h2
            id="fine-print"
            className="text-xl font-semibold tracking-tight text-fog-100 sm:text-2xl"
          >
            The fine print
          </h2>
          <dl className="mt-6 divide-y divide-white/8 overflow-hidden rounded-card border border-white/10 bg-ink-850/70">
            {FINE_PRINT.map((row) => (
              <div
                key={row.term}
                className="flex flex-col gap-1.5 p-5 sm:flex-row sm:gap-6 sm:p-6"
              >
                <dt className="w-40 shrink-0 font-mono text-xs uppercase tracking-[0.2em] text-fog-500 sm:pt-0.5">
                  {row.term}
                </dt>
                <dd className="text-sm leading-relaxed text-fog-300">
                  {row.detail}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-14 flex flex-wrap items-center gap-3">
          <Link to="/booth" className={buttonVariants()}>
            <Camera aria-hidden />
            Start Photobooth
          </Link>
          <Link
            to="/"
            className={buttonVariants({ variant: 'ghost' })}
          >
            Back to home
          </Link>
        </div>
      </main>
    </SiteLayout>
  )
}
