import { useSyncExternalStore } from 'react'

const REDUCED = '(prefers-reduced-motion: reduce)'

/**
 * Animations are off when the OS asks for reduced motion or when <html> has the class "no-motion"
 * (set by ?motion=off or localStorage esep.motion=off, see main.tsx; e2e runs use reducedMotion: 'reduce').
 */
export function motionDisabled(): boolean {
  return document.documentElement.classList.contains('no-motion') || window.matchMedia(REDUCED).matches
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(REDUCED)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

export function useMotionDisabled(): boolean {
  return useSyncExternalStore(subscribe, motionDisabled)
}

/** Cascade for lists and sections: children slide up 16px and fade in, 60 ms apart. */
export const cascade = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.06 } } },
  item: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  },
} as const
