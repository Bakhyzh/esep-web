import { ArrowLeftRight, ChartColumn, History, WalletCards } from 'lucide-react'
import { m } from 'motion/react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useMotionDisabled } from '../lib/motion'
import { Logo } from './Brand'
import { NotificationsMenu, ProfileMenu } from './HeaderMenus'

const LINKS = [
  { to: '/accounts', label: 'Accounts', icon: WalletCards },
  { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/history', label: 'History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: ChartColumn },
]

/** Desktop: header + narrow icon sidebar. Phone: header + bottom tab bar (one <nav>, restyled by CSS). */
export function Layout() {
  const location = useLocation()
  const noMotion = useMotionDisabled()
  return (
    <div className="shell">
      <header className="app-header">
        <NavLink to="/accounts" className="brand"><Logo />Esep</NavLink>
        <div className="header-actions">
          <NotificationsMenu />
          <ProfileMenu />
        </div>
      </header>
      <nav className="nav" aria-label="Main">
        {LINKS.map(({ to, label, icon: Icon }) => (
          // the transfer sheet opens over the current page, which stays rendered behind it
          <NavLink key={to} to={to} state={to === '/transfer' ? { background: location } : undefined}>
            <Icon className="nav-icon" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <m.main key={location.pathname} className="page"
              initial={noMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
        <Outlet />
      </m.main>
    </div>
  )
}
