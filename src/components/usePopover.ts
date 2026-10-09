import { useEffect, useRef, useState } from 'react'

/** Open/close state for a small menu: closes on Esc (focus back to the trigger) and on a click outside. */
export function usePopover<T extends HTMLElement>() {
  const [open, setOpen] = useState(false)
  const root = useRef<T>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        root.current?.querySelector<HTMLElement>('[aria-expanded]')?.focus()
      }
    }
    const onClick = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick) }
  }, [open])

  return { open, setOpen, root }
}
