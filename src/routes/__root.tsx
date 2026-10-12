import {
  Link,
  Outlet,
  ScrollRestoration,
  createRootRoute,
} from '@tanstack/react-router'
import { motion, MotionConfig } from 'motion/react'
import { Camera, Home } from 'lucide-react'
import { PageTransition } from '../components/motion/PageTransition'
import { buttonVariants } from '../components/ui/button-variants'
import { Eyebrow } from '../components/ui/Eyebrow'
import { fadeRise } from '../components/motion/variants'
import { SessionProvider } from '../features/photobooth/session-provider'

function FilmPerforations({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={
        'flex items-center justify-center gap-2.5 px-6 ' + (className ?? '')
      }
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="size-2.5 rounded-[3px] bg-white/8"
        />
      ))}
    </div>
  )
}

function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <motion.div
        variants={fadeRise}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md overflow-hidden rounded-card border border-white/10 bg-ink-850 py-4 text-center shadow-panel"
      >
        <FilmPerforations className="opacity-70" />

        <div className="px-8 py-9">
          <div className="mx-auto grid size-12 place-items-center rounded-tile border border-white/10 bg-ink-800 text-lavender-400">
            <Camera className="size-6" aria-hidden />
          </div>

          <Eyebrow className="mt-6 justify-center">Error 404</Eyebrow>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fog-100">
            This frame is empty
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-fog-400">
            The page you were looking for does not exist. Check the address, or
            head back and take a strip instead.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/" className={buttonVariants()}>
              <Home aria-hidden />
              Back to home
            </Link>
            <Link
              to="/booth"
              className={buttonVariants({ variant: 'secondary' })}
            >
              <Camera aria-hidden />
              Start Photobooth
            </Link>
          </div>
        </div>

        <FilmPerforations className="opacity-70" />
      </motion.div>
    </main>
  )
}

function RootLayout() {
  return (
    <MotionConfig reducedMotion="user">
      {/* Shared in-memory booth session: survives /booth <-> /result navigation
          and resets on a full reload (PRD §1.2 / FR-04). */}
      <SessionProvider>
        <PageTransition>
          <Outlet />
        </PageTransition>
        <ScrollRestoration />
      </SessionProvider>
    </MotionConfig>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})
