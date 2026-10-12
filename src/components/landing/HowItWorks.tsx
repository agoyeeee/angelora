import { motion } from 'motion/react'
import { Camera, Download, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card } from '../ui/Card'
import { Eyebrow } from '../ui/Eyebrow'
import { fadeRise, staggerContainer } from '../motion/variants'

type Step = {
  number: string
  icon: LucideIcon
  title: string
  body: string
}

const STEPS: readonly Step[] = [
  {
    number: '01',
    icon: Camera,
    title: 'Start camera',
    body: 'Tap Start Photobooth and allow camera access in the browser. Nothing turns on until you say yes.',
  },
  {
    number: '02',
    icon: Sparkles,
    title: 'Pose',
    body: 'Choose 3 or 4 shots and a countdown. The booth snaps each frame for you.',
  },
  {
    number: '03',
    icon: Download,
    title: 'Save your strip',
    body: 'Pick a look, then download your photostrip as a PNG. It stays on your device.',
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-t border-white/8"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="max-w-2xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-fog-100 sm:text-4xl">
            Three simple steps.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-fog-400">
            No account, no app install, no waiting on uploads. Open the booth,
            strike a pose, and walk away with a strip.
          </p>
        </div>

        <motion.ol
          variants={staggerContainer(0.06)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5"
        >
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <motion.li key={step.number} variants={fadeRise}>
                <Card className="h-full p-5 sm:p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-tile border border-white/10 bg-ink-800 text-lavender-400">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="font-mono text-xs tracking-[0.3em] text-fog-600">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-fog-100">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog-400">
                    {step.body}
                  </p>
                </Card>
              </motion.li>
            )
          })}
        </motion.ol>
      </div>
    </section>
  )
}
