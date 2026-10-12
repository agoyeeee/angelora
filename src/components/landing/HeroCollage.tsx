import { SampleStrip } from './SampleStrip'

/**
 * Tilted sample-strip collage for the hero (PRD §7.2). Three overlapping strips
 * with a gentle, low-cost float; the centre strip lifts on hover. All motion is
 * `motion-safe:`-gated so reduced-motion users get a still collage.
 *
 * Decorative: entirely hidden from assistive tech.
 */
export function HeroCollage() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] px-3 sm:px-4">
      {/* Static lavender halo — no animated blur. */}
      <div
        aria-hidden
        className="absolute inset-x-2 inset-y-8 -z-10 rounded-[50%] bg-[radial-gradient(closest-side,rgba(159,134,255,0.32),transparent)]"
      />

      <div
        aria-hidden
        className="flex items-center justify-center"
      >
        {/* Left strip */}
        <div className="group/strip relative z-10 -mr-[9%] w-[36%] motion-safe:animate-float-slow">
          <div className="rotate-[-9deg] rounded-[1.1rem] shadow-panel transition-transform duration-500 ease-[var(--ease-fluid)] motion-safe:group-hover/strip:-translate-y-2">
            <SampleStrip shots={3} tone="coral" date="2026" decorative />
          </div>
        </div>

        {/* Centre strip */}
        <div className="group/strip relative z-30 w-[46%]">
          <div className="rotate-[2deg] rounded-[1.25rem] shadow-panel transition-transform duration-500 ease-[var(--ease-fluid)] motion-safe:group-hover/strip:-translate-y-2.5">
            <SampleStrip shots={4} tone="lavender" date="2026" decorative />
          </div>
        </div>

        {/* Right strip */}
        <div className="group/strip relative z-20 -ml-[9%] w-[34%] motion-safe:animate-float-delayed">
          <div className="rotate-[9deg] rounded-[1.1rem] shadow-panel transition-transform duration-500 ease-[var(--ease-fluid)] motion-safe:group-hover/strip:-translate-y-2">
            <SampleStrip shots={3} tone="rose" date="2026" decorative />
          </div>
        </div>
      </div>
    </div>
  )
}
