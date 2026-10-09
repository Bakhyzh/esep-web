import type { ReactNode } from 'react'

export function Alert({ kind, title, children }: { kind: 'error' | 'info' | 'success'; title?: string; children?: ReactNode }) {
  return (
    <div className={`alert ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {title && <strong>{title}</strong>}
      {children}
    </div>
  )
}
