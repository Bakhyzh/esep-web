import { Navigate } from 'react-router'
import { useAuth } from './useAuth'
import { keycloak } from './oidc'

export function OidcLoginPage() {
  const { token, login } = useAuth()
  if (token) return <Navigate to="/accounts" replace />
  return <main className="auth-page"><div className="card auth-card">
    <h1>Sign in to ESEP</h1>
    <p>Use your ESEP identity to access your accounts.</p>
    <button onClick={() => { void login('', '') }}>Continue to sign in</button>
    <p>For account activation, contact your ESEP operator.</p>
    {keycloak.authenticated && <p>Your account may need identity verification.</p>}
  </div></main>
}
