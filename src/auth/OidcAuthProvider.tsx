import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onUnauthorized, setAccessTokenProvider } from '../api/client'
import { resolveIdentity } from './identityReady'
import type { UserResponse } from '../api/types'
import { AuthContext, type LogoutReason } from './useAuth'
import { keycloak } from './oidc'

export function OidcAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(keycloak.token ?? null)
  const [user, setUser] = useState<UserResponse | null>(null)
  const [identityFailed, setIdentityFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [logoutReason, setLogoutReason] = useState<LogoutReason | null>(null)
  const logout = useCallback((reason: LogoutReason = 'manual') => {
    setToken(null)
    setUser(null)
    setLogoutReason(reason)
    if (reason === 'manual') void keycloak.logout({ redirectUri: `${location.origin}/` })
    else keycloak.clearToken()
  }, [])
  const login = useCallback(async () => {
    await keycloak.login({ redirectUri: `${location.origin}/oidc/callback` })
  }, [])
  useEffect(() => {
    const refresh = async () => {
      try {
        await keycloak.updateToken(30)
        setToken(keycloak.token ?? null)
        if (!keycloak.token) throw new Error('Session expired')
        return keycloak.token
      } catch {
        logout('expired')
        throw new Error('Session expired. Please sign in again.')
      }
    }
    setAccessTokenProvider(refresh)
    onUnauthorized(() => logout('expired'))
    keycloak.onTokenExpired = () => { void refresh().catch(() => { /* refresh clears failed sessions */ }) }
    return () => { setAccessTokenProvider(null); onUnauthorized(null); keycloak.onTokenExpired = undefined }
  }, [logout])
  useEffect(() => {
    if (!token) return
    const controller = new AbortController()
    resolveIdentity(token, controller.signal).then(me => {
      if (!controller.signal.aborted) { setUser(me); setIdentityFailed(false) }
    }).catch(() => {
      if (!controller.signal.aborted) setIdentityFailed(true)
    })
    return () => controller.abort()
  }, [token, attempt])
  const value = useMemo(() => ({ token, user, logoutReason, login, logout }), [token, user, logoutReason, login, logout])
  return <AuthContext.Provider value={value}>
    {token && (!user || identityFailed) ? <main className="auth-page"><div className="card auth-card" role={identityFailed ? 'alert' : 'status'}>
      <h1>{identityFailed ? 'Your profile is unavailable' : 'Preparing your profile…'}</h1>
      <p>{identityFailed ? 'Please try again. If this continues, contact your ESEP operator.' : 'Your accounts will be ready shortly.'}</p>
      {identityFailed && <button onClick={() => { setIdentityFailed(false); setAttempt(n => n + 1) }}>Retry</button>}
      <button onClick={() => logout()}>Sign out</button>
    </div></main> : children}
  </AuthContext.Provider>
}
