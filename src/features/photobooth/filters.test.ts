import { describe, expect, it } from 'vitest'
import { FILTERS, applyFilter, getFilterCss, resetFilter } from './filters'

describe('FILTERS', () => {
  it('lists the five PRD filter presets in order', () => {
    expect(FILTERS.map((filter) => filter.id)).toEqual([
      'original',
      'warm',
      'bw',
      'soft',
      'vivid',
    ])
    expect(FILTERS.map((filter) => filter.label)).toEqual([
      'Original',
      'Warm',
      'B&W',
      'Soft',
      'Vivid',
    ])
  })

  it('maps every id to a non-empty css filter value', () => {
    for (const filter of FILTERS) {
      const css = getFilterCss(filter.id)
      expect(typeof css).toBe('string')
      expect(css.length).toBeGreaterThan(0)
    }
    expect(getFilterCss('original')).toBe('none')
  })

  it('is deterministic', () => {
    for (const filter of FILTERS) {
      expect(getFilterCss(filter.id)).toBe(getFilterCss(filter.id))
    }
  })

  it('produces distinct, non-none values for the styled filters', () => {
    const values = FILTERS.filter((filter) => filter.id !== 'original').map((filter) =>
      getFilterCss(filter.id),
    )
    expect(new Set(values).size).toBe(values.length)
    for (const value of values) {
      expect(value).not.toBe('none')
    }
  })

  it('applies and resets the canvas filter', () => {
    const ctx = { filter: 'none' } as unknown as CanvasRenderingContext2D
    applyFilter(ctx, 'warm')
    expect(ctx.filter).toBe(getFilterCss('warm'))
    resetFilter(ctx)
    expect(ctx.filter).toBe('none')
  })
})
