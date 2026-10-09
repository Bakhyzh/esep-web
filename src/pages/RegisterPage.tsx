import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { authApi } from '../api/esep'
import { Alert } from '../components/Alert'
import { Logo } from '../components/Brand'
import { Field } from '../components/Field'
import { errorMessage } from '../lib/errors'

export function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  const localErrors: Record<string, string> = {}
  if (password && password.length < 8) localErrors.password = 'At least 8 characters'
  if (confirm && confirm !== password) localErrors.confirm = 'Passwords do not match'

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await authApi.register(email, password)
      navigate('/login', { replace: true, state: { registered: email.trim().toLowerCase() } })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const serverErrors = error instanceof ApiError ? error.fieldErrors : {}
  const canSubmit = email && password.length >= 8 && confirm === password && !busy
  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="brand"><Logo />Esep</div>
        <h1>Create an account</h1>
        {error !== null && <Alert kind="error">{errorMessage(error)}</Alert>}
        <form onSubmit={submit} noValidate>
          <Field label="Email" error={serverErrors.email}>
            <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" error={localErrors.password ?? serverErrors.password} hint="8 to 72 characters">
            <input type="password" autoComplete="new-password" required value={password}
                   onChange={e => setPassword(e.target.value)} />
          </Field>
          <Field label="Repeat password" error={localErrors.confirm}>
            <input type="password" autoComplete="new-password" required value={confirm}
                   onChange={e => setConfirm(e.target.value)} />
          </Field>
          <button type="submit" disabled={!canSubmit}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="secondary">Already registered? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
