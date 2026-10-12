import { motion } from 'motion/react'
import { Images } from 'lucide-react'
import type { CapturedShot } from '../../features/photobooth/types'
import { cn } from '../../lib/utils'
import { Eyebrow } from '../ui/Eyebrow'
import { ShotThumbnail } from '../ui/ShotThumbnail'
import { thumbnailPopVariants } from '../motion/variants'

export type ShotGridProps = {
  shotCount: number
  shots: readonly CapturedShot[]
  urls: Record<string, string>
}

/**
 * The strip being built: `shotCount` slots, empty until each capture lands
 * (FR-08). Newly captured slots remount on a new key so the shared
 * `thumbnailPopVariants` spring plays once per photo, not on every render.
 */
export function ShotGrid({ shotCount, shots, urls }: ShotGridProps) {
  const indices = Array.from({ length: shotCount }, (_, index) => index)
  const captured = shots.length

  return (
    <section aria-label="Your strip" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow icon={<Images />}>Your strip</Eyebrow>
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-fog-500">
          {captured} / {shotCount}
        </span>
      </div>

      <ul
        className={cn(
          'grid gap-3',
          shotCount === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4',
        )}
      >
        {indices.map((index) => {
          const shot = shots[index]
          return (
            <motion.li
              key={shot ? shot.id : `empty-${index}`}
              variants={thumbnailPopVariants}
              initial="hidden"
              animate="visible"
            >
              <ShotThumbnail
                state={shot ? 'captured' : 'empty'}
                src={shot ? urls[shot.id] : undefined}
                index={index + 1}
              />
            </motion.li>
          )
        })}
      </ul>

      {captured === 0 ? (
        <p className="text-xs leading-relaxed text-fog-500">
          Photos appear here as you take them. You can retake the last one or
          start over any time.
        </p>
      ) : null}
    </section>
  )
}
