import { SwitchCamera } from 'lucide-react'
import { Chip } from '../ui/Chip'

export type DevicePickerProps = {
  devices: MediaDeviceInfo[]
  activeDeviceId: string | null
  onSelect: (deviceId: string) => void
  disabled?: boolean
}

/** Keep long hardware labels from pushing the row past the viewport (FR-17). */
function shortLabel(raw: string, index: number): string {
  const label = raw.trim() || `Camera ${index + 1}`
  return label.length > 26 ? `${label.slice(0, 25)}…` : label
}

/**
 * Device picker shown only when the browser exposes more than one video input
 * (FR-04). Switching stops the current stream before opening the next one.
 */
export function DevicePicker({
  devices,
  activeDeviceId,
  onSelect,
  disabled = false,
}: DevicePickerProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-fog-500">
        Camera
      </p>
      <div
        role="group"
        aria-label="Choose a camera"
        className="flex flex-wrap gap-2"
      >
        {devices.map((device, index) => (
          <Chip
            key={device.deviceId}
            label={shortLabel(device.label, index)}
            icon={<SwitchCamera />}
            selected={device.deviceId === activeDeviceId}
            disabled={disabled}
            onClick={() => onSelect(device.deviceId)}
          />
        ))}
      </div>
    </div>
  )
}
