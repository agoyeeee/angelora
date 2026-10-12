/**
 * The face-filter catalogue shown in the booth's picker. The actual 3D look and
 * placement of each effect lives in `effect-specs.ts` (kept apart so the picker
 * never pulls three.js into the main bundle).
 */

import type { EffectId } from '../types'

export type EffectOption = {
  id: EffectId
  label: string
  /** Emoji shown on the picker chip. */
  icon: string
}

/** Ordered list for the picker; `none` first. */
export const EFFECTS: readonly EffectOption[] = [
  { id: 'none', label: 'Tanpa filter', icon: '🚫' },
  { id: 'shades', label: 'Kacamata', icon: '😎' },
  { id: 'wayfarer', label: 'Wayfarer', icon: '👓' },
  { id: 'pixel', label: 'Deal With It', icon: '🆒' },
  { id: 'heartglasses', label: 'Kacamata Love', icon: '💘' },
  { id: 'crown', label: 'Mahkota', icon: '👑' },
  { id: 'cat', label: 'Kucing', icon: '🐱' },
  { id: 'bunny', label: 'Kelinci', icon: '🐰' },
  { id: 'halo', label: 'Malaikat', icon: '😇' },
  { id: 'clown', label: 'Badut', icon: '🤡' },
  { id: 'mustache', label: 'Kumis', icon: '🥸' },
  { id: 'hearts', label: 'Mata Love', icon: '😍' },
  { id: 'santa', label: 'Santa', icon: '🎅' },
  { id: 'cowboy', label: 'Koboi', icon: '🤠' },
  { id: 'pirate', label: 'Bajak Laut', icon: '🏴‍☠️' },
  { id: 'headphones', label: 'Headphone', icon: '🎧' },
  { id: 'viking', label: 'Viking', icon: '⚔️' },
  { id: 'antlers', label: 'Rusa', icon: '🦌' },
  { id: 'fox', label: 'Rubah', icon: '🦊' },
  { id: 'gradcap', label: 'Wisuda', icon: '🎓' },
  { id: 'tophat', label: 'Topi Tinggi', icon: '🎩' },
  { id: 'wizard', label: 'Penyihir', icon: '🧙' },
]
