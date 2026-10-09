import { X } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, type ReactNode } from 'react'

interface SheetProps {
  title: ReactNode
  /** accessible name of the close button, unique on the page */
  closeLabel: string
  onClose: () => void
  children: ReactNode
  leading?: ReactNode
}

/**
 * A native modal <dialog>: focus trap, Esc and the inert background come from the browser.
 * CSS turns it into a bottom sheet on phones and a centered modal from 640 px.
 */
export function Sheet({ title, closeLabel, onClose, children, leading }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const cancel = useEffectEvent((event: Event) => { event.preventDefault(); onClose() })

  useEffect(() => {
    const dialog = ref.current!
    if (!dialog.open) dialog.showModal()
    const onCancel = (event: Event) => cancel(event)
    dialog.addEventListener('cancel', onCancel)
    return () => { dialog.removeEventListener('cancel', onCancel); dialog.close() }
  }, [])

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="sheet-title"
            onClick={event => { if (event.target === ref.current) onClose() }}>
      <div className="sheet-body">
        <span className="sheet-grip" aria-hidden="true" />
        <header className="sheet-head">
          {leading}
          <h2 id="sheet-title">{title}</h2>
          <button type="button" className="icon-button" aria-label={closeLabel} onClick={onClose}><X /></button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
