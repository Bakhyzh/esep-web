import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onUnauthorized, setAccessTokenProvider } from '../api/client'
import { authApi } from '../api/esep'
import type { UserResponse } from '../api/types'
import { AuthContext, type LogoutReason } from './useAuth'
import { keycloak } from './oidc'

export function OidcAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(keycloak.token ?? null)
  const [user, setUser] = useState<UserResponse | null>(null)
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
    let cancelled = false
    authApi.me(token).then(me => { if (!cancelled) setUser(me) }).catch(() => {
      // Keep the valid session so a denied/unlinked identity cannot cause a redirect loop.
    })
    return () => { cancelled = true }
  }, [token])
  const value = useMemo(() => ({ token, user, logoutReason, login, logout }), [token, user, logoutReason, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
