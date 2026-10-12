import { Link, Outlet, ScrollRestoration, createRootRoute } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'

function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-md rounded-card border border-white/10 bg-ink-850 p-8 text-center shadow-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-fog-500">
          Error 404
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-fog-100">
          This frame is empty
        </h1>
        <p className="mt-3 text-sm text-fog-500">
          The page you were looking for does not exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-lavender-500 px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-lavender-400"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}

function RootLayout() {
  return (
    <MotionConfig reducedMotion="user">
      <Outlet />
      <ScrollRestoration />
    </MotionConfig>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})
