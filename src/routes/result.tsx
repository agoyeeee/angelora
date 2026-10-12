import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/result')({
  component: ResultPage,
})

function ResultPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <h1 className="font-display text-3xl font-semibold">Result</h1>
    </main>
  )
}
