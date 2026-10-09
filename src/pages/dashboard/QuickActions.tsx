import { ArrowLeftRight, ChartColumn, History, Plus } from 'lucide-react'
import { Link, useLocation } from 'react-router'

export function QuickActions({ onTopUp }: { onTopUp: () => void }) {
  const location = useLocation()
  return (
    <nav className="quick-actions" aria-label="Quick actions">
      <Link to="/transfer" state={{ background: location }} className="quick-action">
        <span className="quick-icon" aria-hidden="true"><ArrowLeftRight /></span>Transfer
      </Link>
      <button type="button" className="quick-action" onClick={onTopUp}>
        <span className="quick-icon" aria-hidden="true"><Plus /></span>Top up
      </button>
      <Link to="/history" className="quick-action">
        <span className="quick-icon" aria-hidden="true"><History /></span>History
      </Link>
      <Link to="/analytics" className="quick-action">
        <span className="quick-icon" aria-hidden="true"><ChartColumn /></span>Analytics
      </Link>
    </nav>
  )
}
