import { CircleAlert, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { errorMessage } from '../lib/errors'

/** Error with an icon, plain words and a retry button (never only a red color: the brand is red). */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="state error-state" role="alert">
      <CircleAlert className="state-icon" aria-hidden="true" />
      <p>{errorMessage(error)}</p>
      <button type="button" className="secondary" onClick={onRetry}><RefreshCw className="icon" aria-hidden="true" />Retry</button>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />
}

export function EmptyIllustration() {
  return (
    <svg className="empty-art" viewBox="0 0 220 140" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="empty-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff2d78" /><stop offset=".55" stopColor="#ff4a3d" /><stop offset="1" stopColor="#ff8a1f" />
        </linearGradient>
      </defs>
      <rect x="38" y="30" width="150" height="94" rx="16" fill="#1b1b23" stroke="#24242c" transform="rotate(-8 113 77)" />
      <rect x="32" y="22" width="150" height="94" rx="16" fill="url(#empty-card)" opacity=".9" />
      <rect x="48" y="40" width="26" height="18" rx="5" fill="#0b0b0f" opacity=".35" />
      <rect x="48" y="90" width="70" height="7" rx="3.5" fill="#0b0b0f" opacity=".35" />
      <circle cx="176" cy="112" r="20" fill="#0b0b0f" stroke="#f4f4f5" strokeWidth="2" />
      <path d="M176 104v16M168 112h16" stroke="#f4f4f5" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function SectionHead({ title, id, children }: { title: string; id: string; children?: ReactNode }) {
  return <div className="section-head"><h2 id={id}>{title}</h2>{children}</div>
}
