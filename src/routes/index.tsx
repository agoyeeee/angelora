import { Link, createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import {
  Aperture,
  ArrowDown,
  Camera,
  CloudOff,
  Download,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SiteLayout } from '../components/layout/SiteLayout'
import { HeroCollage } from '../components/landing/HeroCollage'
import { HowItWorks } from '../components/landing/HowItWorks'
import { buttonVariants } from '../components/ui/button-variants'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Card } from '../components/ui/Card'
import {
  fadeRise,
  fadeRiseLead,
  staggerContainer,
} from '../components/motion/variants'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function Fact({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-lavender-400" aria-hidden />
      <span>{children}</span>
    </li>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Static grain, kept very light for legibility (PRD §7.1) */}
      <div
        aria-hidden
        className="grain pointer-events-none absolute inset-0 opacity-[0.05]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-24 lg:pt-20">
        <motion.div
          variants={staggerContainer(0.06, 0.04)}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeRiseLead}>
            <Eyebrow icon={<Aperture />}>
              Web photobooth · runs in your browser
            </Eyebrow>
          </motion.div>

          <motion.h1
            variants={fadeRiseLead}
            className="mt-5 text-4xl font-semibold leading-[1.03] tracking-tight text-fog-100 sm:text-5xl lg:text-6xl"
          >
            Little moments.{' '}
            <span className="text-lavender-400">Iconic strips.</span>
          </motion.h1>

          <motion.p
            variants={fadeRise}
            className="mt-5 max-w-xl text-base leading-relaxed text-fog-300 sm:text-lg"
          >
            Turn your camera into a photobooth. Pick a vibe, strike a pose, and
            save the strip.
          </motion.p>

          <motion.div
            variants={fadeRise}
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link to="/booth" className={buttonVariants({ size: 'lg' })}>
              <Camera aria-hidden />
              Start Photobooth
            </Link>
            <a
              href="#how-it-works"
              className={buttonVariants({ variant: 'ghost', size: 'lg' })}
            >
              <ArrowDown aria-hidden />
              See how it works
            </a>
          </motion.div>

          <motion.ul
            variants={fadeRise}
            className="mt-9 flex flex-col gap-3 text-sm text-fog-400 sm:flex-row sm:flex-wrap sm:gap-x-6"
          >
            <Fact icon={ShieldCheck}>Camera starts only when you tap Start</Fact>
            <Fact icon={CloudOff}>Nothing is uploaded</Fact>
            <Fact icon={Download}>Save the strip as a PNG</Fact>
          </motion.ul>
        </motion.div>

        <motion.div variants={fadeRiseLead} className="lg:justify-self-end">
          <HeroCollage />
        </motion.div>
      </div>
    </section>
  )
}

function ClosingCta() {
  return (
    <section className="border-t border-white/8">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
        <Card className="relative overflow-hidden p-7 sm:p-10">
          {/* Warm counter-accent so the landing is not purely lavender. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-[radial-gradient(closest-side,rgba(255,122,89,0.24),transparent)]"
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-lg">
              <Eyebrow>Ready when you are</Eyebrow>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fog-100 sm:text-3xl">
                Your camera, your vibe, your strip.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-fog-400">
                You&apos;ll pick your shot count and countdown inside the booth.
                Nothing is uploaded, and you can start over any time.
              </p>
            </div>
            <Link
              to="/booth"
              className={buttonVariants({ size: 'lg', className: 'shrink-0' })}
            >
              <Camera aria-hidden />
              Start Photobooth
            </Link>
          </div>
        </Card>
      </div>
    </section>
  )
}

function LandingPage() {
  return (
    <SiteLayout>
      <main id="main">
        <Hero />
        <HowItWorks />
        <ClosingCta />
      </main>
    </SiteLayout>
  )
}
