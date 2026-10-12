import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-6 py-16">
      <h1 className="font-display text-3xl font-semibold">Privacy</h1>
      <p className="mt-3 text-fog-500">Privacy page placeholder.</p>
    </main>
  )
}
