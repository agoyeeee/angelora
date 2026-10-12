import { Eyebrow } from '../ui/Eyebrow'
import { PickerCard } from './PickerCard'
import { FILTERS, getFilterCss } from '../../features/photobooth/filters'
import type { FilterId } from '../../features/photobooth/types'

/**
 * Filter picker (PRD §7.4 / FR-10): one mini preview card per `FILTERS` entry,
 * each showing the first photo with that filter applied via `getFilterCss` —
 * the same string the canvas export uses, so what you see is what you download.
 *
 * When no photo is available yet we fall back to a lavender→coral gradient so
 * the filter's effect (saturation, contrast, greyscale) is still legible.
 */
const FALLBACK_GRADIENT = 'linear-gradient(135deg, #b9a6ff 0%, #ff9d7e 100%)'

export type FilterPickerProps = {
  value: FilterId
  onChange: (id: FilterId) => void
  /** Object URL of the first shot, used as the sample image. */
  sourceUrl?: string
}

export function FilterPicker({ value, onChange, sourceUrl }: FilterPickerProps) {
  return (
    <div role="group" aria-label="Filter">
      <Eyebrow>Filter</Eyebrow>
      <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
        {FILTERS.map((filter) => (
          <PickerCard
            key={filter.id}
            label={filter.label}
            ariaLabel={`${filter.label} filter`}
            selected={filter.id === value}
            onSelect={() => onChange(filter.id)}
            preview={
              sourceUrl ? (
                <img
                  src={sourceUrl}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="block aspect-[4/3] w-full object-cover"
                  style={{ filter: getFilterCss(filter.id) }}
                />
              ) : (
                <span
                  aria-hidden
                  className="block aspect-[4/3] w-full"
                  style={{
                    backgroundImage: FALLBACK_GRADIENT,
                    filter: getFilterCss(filter.id),
                  }}
                />
              )
            }
          />
        ))}
      </div>
    </div>
  )
}
