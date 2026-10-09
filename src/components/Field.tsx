import { useId, type ReactElement, cloneElement } from 'react'
import { ErrorIcon } from './icons'

interface FieldProps {
  label: string
  error?: string
  hint?: string
  children: ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>
}

/** Label + control + hint/error, wired together for screen readers. */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId()
  const messageId = `${id}-message`
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error || hint ? messageId : undefined,
      })}
      {error ? <span id={messageId} className="error-text"><ErrorIcon />{error}</span>
        : hint ? <span id={messageId} className="hint">{hint}</span> : null}
    </div>
  )
}
