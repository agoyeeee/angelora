import { useEffect, useRef, useState } from 'react'
import type { CapturedShot } from '../types'

/**
 * Map captured shots to object URLs for rendering, keeping exactly one URL per
 * shot id.
 *
 * Used by the booth (thumbnail grid) and the result page (strip preview). URLs
 * are created lazily for new shots and revoked when a shot leaves the session
 * (retake / reset) or the component unmounts, so nothing leaks (PRD §9.4).
 */
export function useShotUrls(
  shots: readonly CapturedShot[],
): Record<string, string> {
  const urlsRef = useRef(new Map<string, string>())
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    const map = urlsRef.current
    const liveIds = new Set(shots.map((shot) => shot.id))

    // Revoke URLs whose shot is gone (retake last / reset).
    for (const [id, url] of map) {
      if (!liveIds.has(id)) {
        URL.revokeObjectURL(url)
        map.delete(id)
      }
    }

    // Create a URL for each newly captured shot.
    for (const shot of shots) {
      if (!map.has(shot.id)) {
        map.set(shot.id, URL.createObjectURL(shot.blob))
      }
    }

    setUrls(Object.fromEntries(map))
  }, [shots])

  // Revoke everything on unmount only.
  useEffect(
    () => () => {
      for (const url of urlsRef.current.values()) {
        URL.revokeObjectURL(url)
      }
      urlsRef.current.clear()
    },
    [],
  )

  return urls
}
