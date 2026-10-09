import { Link } from 'react-router'

export function NotFoundPage() {
  return <div className="empty">Page not found. <Link to="/accounts">Go to accounts</Link></div>
}
