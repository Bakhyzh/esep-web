import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { useCallback, useState, type ReactNode } from 'react'
import { ToastContext, type Toast, type ToastKind } from './toast'

const ICON = { success: CircleCheck, info: Info, error: CircleAlert }
const HIDE_AFTER = 4000

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random()
    setToasts(list => [...list.slice(-2), { id, kind, text }])
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), HIDE_AFTER)
  }, [])

  return (
    <ToastContext value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map(toast => {
          const Icon = ICON[toast.kind]
          return (
            <div key={toast.id} className={`toast ${toast.kind}`}>
              <Icon className="icon" aria-hidden="true" />
              <span>{toast.text}</span>
            </div>
          )
        })}
      </div>
    </ToastContext>
  )
}
