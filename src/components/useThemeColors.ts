import { useEffect, useState } from 'react'
import { motionDisabled } from '../lib/motion'

export interface ThemeColors {
  series1: string
  series2: string
  grid: string
  text: string
  muted: string
  surface: string
  /** false when the user asked the OS for reduced motion: charts then render without animation */
  animate: boolean
}

function read(): ThemeColors {
  const style = getComputedStyle(document.documentElement)
  const value = (name: string) => style.getPropertyValue(name).trim()
  return {
    series1: value('--series-1'),
    series2: value('--series-2'),
    grid: value('--border'),
    text: value('--text'),
    muted: value('--text-muted'),
    surface: value('--bg-elevated'),
    animate: !motionDisabled(),
  }
}

/**
 * SVG presentation attributes (fill="...") cannot use CSS variables, so chart colors are read from the
 * design tokens (src/styles/tokens.css); the reduced-motion preference is re-read when the OS setting changes.
 */
export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(read)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setColors(read())
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return colors
}
