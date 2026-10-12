import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="font-display text-4xl font-semibold">FlashFrame</h1>
        <p className="mt-3 text-fog-500">Modern web photobooth — landing placeholder.</p>
        <Link
          to="/booth"
          className="mt-6 inline-flex rounded-full bg-lavender-500 px-6 py-3 text-sm font-semibold text-ink-950"
        >
          Start Photobooth
        </Link>
      </div>
    </main>
  )
}
