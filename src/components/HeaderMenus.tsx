import { Bell, LogOut } from 'lucide-react'
import { notificationsApi } from '../api/esep'
import { useAuth, useToken } from '../auth/useAuth'
import { formatDateTime } from '../lib/format'
import { useApi } from '../lib/useApi'
import { ErrorState, Skeleton } from './States'
import { usePopover } from './usePopover'

/** Latest notifications (delivered through Kafka), loaded when the menu opens. */
export function NotificationsMenu() {
  const token = useToken()
  const { open, setOpen, root } = usePopover<HTMLDivElement>()
  const list = useApi(() => open ? notificationsApi.latest(token, 5) : Promise.resolve(null), [token, open])

  return (
    <div className="popover-root" ref={root}>
      <button type="button" className="icon-button" aria-label="Notifications" aria-expanded={open}
              aria-controls="notifications-panel" onClick={() => setOpen(!open)}>
        <Bell />
      </button>
      {open && (
        <div id="notifications-panel" className="popover" role="region" aria-label="Latest notifications">
          <p className="popover-title">Notifications</p>
          {list.error ? <ErrorState error={list.error} onRetry={list.reload} />
            : !list.data ? <div className="popover-skeleton"><Skeleton /><Skeleton /><Skeleton /></div>
            : list.data.length === 0 ? <p className="muted">No notifications yet.</p>
            : (
              <ul className="notifications">
                {list.data.map(n => (
                  <li key={n.id}><span>{n.message}</span><span className="muted">{formatDateTime(n.createdAt)}</span></li>
                ))}
              </ul>
            )}
          <p className="popover-note">Delivered through Kafka, usually within a second after a transfer.</p>
        </div>
      )}
    </div>
  )
}

export function ProfileMenu() {
  const { user, logout } = useAuth()
  const { open, setOpen, root } = usePopover<HTMLDivElement>()
  const email = user?.email ?? ''

  return (
    <div className="popover-root" ref={root}>
      <button type="button" className="avatar-button" aria-label="Profile menu" aria-expanded={open}
              aria-controls="profile-panel" onClick={() => setOpen(!open)}>
        <span className="avatar" aria-hidden="true">{email[0] ?? '?'}</span>
      </button>
      {open && (
        <div id="profile-panel" className="popover profile-popover">
          <div className="profile-id">
            <span className="avatar large" aria-hidden="true">{email[0] ?? '?'}</span>
            <div>
              <p className="profile-email">{email || 'Loading…'}</p>
              <p className="muted">{user?.role === 'ADMIN' ? 'Administrator' : 'Personal account'}</p>
            </div>
          </div>
          <button type="button" className="secondary menu-item" onClick={() => logout('manual')}>
            <LogOut className="icon" aria-hidden="true" />Sign out
          </button>
        </div>
      )}
    </div>
  )
}
