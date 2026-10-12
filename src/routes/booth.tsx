import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/booth')({
  component: BoothPage,
})

function BoothPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <h1 className="font-display text-3xl font-semibold">Booth</h1>
    </main>
  )
}
