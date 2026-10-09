import type { ReactNode } from 'react'
import { ErrorIcon, InfoIcon, SuccessIcon } from './icons'

const ICON = { error: ErrorIcon, info: InfoIcon, success: SuccessIcon }

export function Alert({ kind, title, children }: { kind: 'error' | 'info' | 'success'; title?: string; children?: ReactNode }) {
  const Icon = ICON[kind]
  return (
    <div className={`alert ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <Icon />
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  )
}
