import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { Field } from '../components/Field'
import { errorMessage } from '../lib/errors'

export function LoginPage() {
  const { token, login, logoutReason } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { from?: string; registered?: string } | null
  const [email, setEmail] = useState(state?.registered ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  if (token) {
    return <Navigate to={state?.from ?? '/accounts'} replace />
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      navigate(state?.from ?? '/accounts', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const fieldErrors = error instanceof ApiError ? error.fieldErrors : {}
  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="brand"><img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />Esep</div>
        <h1>Sign in</h1>
        {logoutReason === 'expired' && <Alert kind="info">Your session has expired. Please sign in again.</Alert>}
        {state?.registered && <Alert kind="success">Account created. You can sign in now.</Alert>}
        {error !== null && <Alert kind="error">{errorMessage(error)}</Alert>}
        <form onSubmit={submit} noValidate>
          <Field label="Email" error={fieldErrors.email}>
            <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </Field>
          <Field label="Password" error={fieldErrors.password}>
            <input type="password" autoComplete="current-password" required value={password}
                   onChange={e => setPassword(e.target.value)} />
          </Field>
          <button type="submit" disabled={busy || !email || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="secondary">No account yet? <Link to="/register">Create one</Link></p>
        <p className="muted">Demo users: alice@esep.dev, bob@esep.dev · password <code>password123</code></p>
      </div>
    </div>
  )
}
