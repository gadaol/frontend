'use client'

import { useEffect } from 'react'

/**
 * Google Maps JS API에서 map drag 중 pointer가 이미 해제된 상태에
 * releasePointerCapture를 재호출해 발생하는 NotFoundError를 억제합니다.
 */
export function GoogleMapsPatch() {
  useEffect(() => {
    const orig = Element.prototype.releasePointerCapture
    Element.prototype.releasePointerCapture = function (pointerId: number) {
      try {
        orig.call(this, pointerId)
      } catch {
        // no-op: pointer already released
      }
    }
    return () => {
      Element.prototype.releasePointerCapture = orig
    }
  }, [])

  return null
}
