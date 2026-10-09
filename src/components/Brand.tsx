import { useId } from 'react'

/** The Esep mark: a gradient rounded square with two opposite arrows (a transfer). Same drawing as public/favicon.svg. */
export function Logo({ className = 'logo' }: { className?: string }) {
  const gradient = useId()
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff2d78" />
          <stop offset="0.55" stopColor="#ff4a3d" />
          <stop offset="1" stopColor="#ff8a1f" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradient})`} />
      <path d="M8.5 12h15m-4-4 4 4-4 4M23.5 20h-15m4-4-4 4 4 4" fill="none" stroke="#0b0b0f" strokeWidth="2.6"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Decorative ascending blocks (login and the accounts home page only). */
export function Stairs() {
  return <div className="stairs" aria-hidden="true"><i /><i /><i /><i /></div>
}
