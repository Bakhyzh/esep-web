import { domAnimation, LazyMotion } from 'motion/react'
import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, type Location } from 'react-router'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { Toaster } from './components/Toaster'
import { DataVersionContext } from './lib/dataVersion'
import { AccountsPage } from './pages/AccountsPage'
import { HistoryPage } from './pages/HistoryPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { TransferPage } from './pages/TransferPage'

// charts (recharts) are the heaviest dependency: load them only when the analytics page is opened
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))

const ACCOUNTS = { pathname: '/accounts', search: '', hash: '', state: null, key: 'accounts' } as Location

export default function App() {
  const location = useLocation()
  const [version, setVersion] = useState(0)
  const bump = useCallback(() => setVersion(v => v + 1), [])
  const dataVersion = useMemo(() => ({ version, bump }), [version, bump])

  // /transfer is a sheet over another page: the page it was opened from, or Accounts on a direct visit
  const isTransfer = location.pathname === '/transfer'
  const background = isTransfer ? (location.state as { background?: Location } | null)?.background ?? ACCOUNTS : null

  return (
    <LazyMotion features={domAnimation} strict>
      <DataVersionContext value={dataVersion}>
        <Toaster>
          <Routes location={background ?? location}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<RequireAuth><Layout /></RequireAuth>}>
              <Route index element={<Navigate to="/accounts" replace />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/analytics" element={<Suspense fallback={<p className="spinner">Loading charts…</p>}><AnalyticsPage /></Suspense>} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          {isTransfer && (
            <Routes>
              <Route path="/transfer" element={<RequireAuth><TransferPage /></RequireAuth>} />
            </Routes>
          )}
        </Toaster>
      </DataVersionContext>
    </LazyMotion>
  )
}
