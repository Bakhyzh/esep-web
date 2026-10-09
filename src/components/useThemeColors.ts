import { useEffect, useState } from 'react'

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
    grid: value('--grid'),
    text: value('--text-secondary'),
    muted: value('--text-muted'),
    surface: value('--surface-1'),
    animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  }
}

/**
 * SVG presentation attributes (fill="...") cannot use CSS variables, so chart colors are read from the
 * design tokens and re-read when the OS switches between light and dark mode.
 */
export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(read)
  useEffect(() => {
    const queries = ['(prefers-color-scheme: dark)', '(prefers-reduced-motion: reduce)'].map(q => window.matchMedia(q))
    const update = () => setColors(read())
    queries.forEach(media => media.addEventListener('change', update))
    return () => queries.forEach(media => media.removeEventListener('change', update))
  }, [])
  return colors
}
