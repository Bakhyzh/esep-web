import { createContext, useContext } from 'react'
import type { UserResponse } from '../api/types'

export type LogoutReason = 'manual' | 'expired'

export interface AuthState {
  token: string | null
  user: UserResponse | null
  logoutReason: LogoutReason | null
  login: (email: string, password: string) => Promise<void>
  logout: (reason?: LogoutReason) => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}

/** For pages behind RequireAuth: the token is guaranteed to be present there. */
export function useToken(): string {
  const { token } = useAuth()
  if (!token) {
    throw new Error('useToken used outside of an authenticated route')
  }
  return token
}
