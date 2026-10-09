import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './useAuth'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const location = useLocation()
  if (!token) {
    // remember where the user wanted to go, so login can bring them back
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}
