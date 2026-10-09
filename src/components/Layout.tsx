import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Logo } from './Brand'

const LINKS = [
  { to: '/accounts', label: 'Accounts' },
  { to: '/transfer', label: 'Transfer' },
  { to: '/history', label: 'History' },
  { to: '/analytics', label: 'Analytics' },
]

export function Layout() {
  const { user, logout } = useAuth()
  return (
    <>
      <header className="app-header">
        <NavLink to="/accounts" className="brand"><Logo />Esep</NavLink>
        <nav className="nav" aria-label="Main">
          {LINKS.map(link => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)}
        </nav>
        <div className="user-box">
          {user && (
            <span className="email" title={user.email}>
              <span className="avatar" aria-hidden="true">{user.email[0]}</span>
              <span>{user.email}{user.role === 'ADMIN' && ' (admin)'}</span>
            </span>
          )}
          <button type="button" className="secondary" onClick={() => logout('manual')}>Sign out</button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}
