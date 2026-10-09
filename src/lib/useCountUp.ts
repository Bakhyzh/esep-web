import { useEffectEvent, useLayoutEffect, useRef } from 'react'
import { motionDisabled } from './motion'

const DURATION = 700

/**
 * Counts the displayed number up to `value` in ~700 ms. Only the text is animated: intermediate frames are
 * display-only, and the last frame always writes format(value), the same string as without animation.
 * The hook owns the element's text: render the element without children (React would otherwise keep
 * updating a text node the hook has replaced).
 */
export function useCountUp<T extends HTMLElement>(value: number, format: (value: number) => string) {
  const ref = useRef<T>(null)
  const shown = useRef(0)
  const show = useEffectEvent((value: number) => format(value))

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const from = shown.current
    const exact = () => { element.textContent = show(value); shown.current = value }
    if (motionDisabled() || from === value) {
      exact()
      return
    }
    element.textContent = show(from)
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      if (t === 1) {
        exact()
        return
      }
      const eased = 1 - (1 - t) ** 3
      shown.current = from + (value - from) * eased
      element.textContent = show(Math.round(shown.current * 100) / 100)   // frames: 2 decimals, display only
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(frame); element.textContent = show(value) }
  }, [value])

  return ref
}
