import { describe, expect, it } from 'vitest'
import { EFFECTS } from './effects'
import { EFFECT_SPECS } from './effect-specs'
import { MODEL_CREDITS } from './credits'

// File listing and credits text come straight from `public/` via Vite globs, so
// this test needs no Node APIs.
const shipped = Object.keys(import.meta.glob('/public/models/filters/*.glb')).map(
  (path) => path.split('/').pop() ?? path,
)
const creditsFile = Object.values(
  import.meta.glob('/public/models/filters/CREDITS.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)[0] as string | undefined

const realEffects = EFFECTS.filter((effect) => effect.id !== 'none')
const specFiles = Object.values(EFFECT_SPECS)
  .flatMap((spec) => spec.parts)
  .flatMap((part) => (part.model ? [part.model] : []))

describe('effect catalogue', () => {
  it('has exactly one spec per picker entry (and none for "none")', () => {
    expect(Object.keys(EFFECT_SPECS).sort()).toEqual(realEffects.map((effect) => effect.id).sort())
  })

  it('gives every part a model or a builder and a positive size', () => {
    for (const [id, spec] of Object.entries(EFFECT_SPECS)) {
      expect(spec.parts.length, id).toBeGreaterThan(0)
      for (const part of spec.parts) {
        expect(Boolean(part.model) !== Boolean(part.build), `${id}: model xor build`).toBe(true)
        expect(part.size, id).toBeGreaterThan(0)
      }
    }
  })

  it('ships every referenced model file, and no unused ones', () => {
    for (const file of specFiles) {
      expect(shipped, file).toContain(file)
    }
    expect([...shipped].sort()).toEqual([...new Set(specFiles)].sort())
  })

  it('credits every bundled model (licence attribution)', () => {
    expect(creditsFile).toBeTruthy()
    for (const file of new Set(specFiles)) {
      expect(creditsFile, file).toContain(`\`${file}\``)
    }
    expect(MODEL_CREDITS.length).toBe(new Set(specFiles).size)
    for (const credit of MODEL_CREDITS) {
      expect(credit.author.length).toBeGreaterThan(0)
      expect(credit.sourceUrl).toMatch(/^https:\/\//)
      expect(credit.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\//)
    }
  })
})
