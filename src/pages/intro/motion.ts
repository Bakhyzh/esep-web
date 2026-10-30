export const EASE = [0.22, 1, 0.36, 1] as const

/** Slide up and fade in; parents with `stagger` cascade their children. */
export const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}
export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
