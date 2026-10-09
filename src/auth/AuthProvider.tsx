import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onUnauthorized } from '../api/client'
import { authApi } from '../api/esep'
import type { UserResponse } from '../api/types'
import { isExpired, tokenExpiresAt } from '../lib/jwt'
import { AuthContext, type LogoutReason } from './useAuth'

const STORAGE_KEY = 'esep.accessToken'

function readStoredToken(): string | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY)
    return token && !isExpired(token) ? token : null
  } catch {
    return null
  }
}

/**
 * Keeps the JWT and logs out when it expires: by a timer at the token's "exp",
 * and on any 401 from the API (e.g. the server's key was rotated).
 * Trade-off: the token lives in localStorage (survives reloads, readable by injected scripts);
 * an httpOnly cookie would need CSRF protection and a cookie-based backend flow.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken)
  const [user, setUser] = useState<UserResponse | null>(null)
  const [logoutReason, setLogoutReason] = useState<LogoutReason | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) && !readStoredToken() ? 'expired' : null
    } catch {
      return null
    }
  })

  const logout = useCallback((reason: LogoutReason = 'manual') => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // storage may be unavailable (private mode): the in-memory state is still cleared
    }
    setToken(null)
    setUser(null)
    setLogoutReason(reason)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    try {
      localStorage.setItem(STORAGE_KEY, response.accessToken)
    } catch {
      // keep the session in memory only
    }
    setLogoutReason(null)
    setToken(response.accessToken)
  }, [])

  // any 401 on an authenticated call ends the session
  useEffect(() => {
    onUnauthorized(() => logout('expired'))
    return () => onUnauthorized(null)
  }, [logout])

  // log out exactly when the token expires, even if the user is idle on a page
  useEffect(() => {
    if (!token) {
      return
    }
    const expiresAt = tokenExpiresAt(token)
    if (expiresAt === null) {
      return
    }
    const timer = window.setTimeout(() => logout('expired'), Math.max(0, expiresAt - Date.now()))
    return () => window.clearTimeout(timer)
  }, [token, logout])

  useEffect(() => {
    if (!token) {
      return
    }
    let cancelled = false
    authApi.me(token).then(me => { if (!cancelled) setUser(me) }).catch(() => { /* 401 handled globally */ })
    return () => { cancelled = true }
  }, [token])

  const value = useMemo(() => ({ token, user, logoutReason, login, logout }), [token, user, logoutReason, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
