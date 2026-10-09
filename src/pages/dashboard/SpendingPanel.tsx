import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { analyticsApi } from '../../api/esep'
import type { MovingAveragePoint } from '../../api/types'
import { useToken } from '../../auth/useAuth'
import { ErrorState, SectionHead, Skeleton } from '../../components/States'
import { useDataVersion } from '../../lib/dataVersion'
import { sumAmounts } from '../../lib/decimal'
import { daysAgo, formatDateTime, formatDay, formatMoney } from '../../lib/format'
import { useApi } from '../../lib/useApi'

const DAYS = 30

/** Right column on desktop: 30-day spending sparkline and the 3 largest transfers, from the analytics API. */
export function SpendingPanel({ currency }: { currency: string }) {
  const token = useToken()
  const { version } = useDataVersion()
  const query = { currency, from: daysAgo(DAYS - 1), to: daysAgo(0) }
  const daily = useApi(s => analyticsApi.movingAverage(token, query, 7, s), [token, currency, version, query.to])
  const top = useApi(s => analyticsApi.top(token, query, 3, s), [token, currency, version, query.to])

  return (
    <>
      <section className="panel" aria-labelledby="spend-title">
        <SectionHead id="spend-title" title={`Spent in ${DAYS} days`} />
        {daily.error ? <ErrorState error={daily.error} onRetry={daily.reload} />
          : !daily.data ? <><Skeleton className="big" /><Skeleton className="spark" /></>
          : <Sparkline points={daily.data} currency={currency} />}
      </section>
      <section className="panel" aria-labelledby="top-title">
        <SectionHead id="top-title" title="Top 3 transfers">
          <Link to="/analytics" className="text-link" aria-label="Open analytics">Analytics<ChevronRight className="icon" aria-hidden="true" /></Link>
        </SectionHead>
        {top.error ? <ErrorState error={top.error} onRetry={top.reload} />
          : !top.data ? <><Skeleton /><Skeleton /><Skeleton /></>
          : top.data.length === 0 ? <p className="muted">No outgoing transfers in {DAYS} days.</p>
          : (
            <ol className="top-list">
              {top.data.map((t, index) => (
                <li key={t.transactionId}>
                  <span className="top-rank" aria-hidden="true">{index + 1}</span>
                  <span className="op-text">
                    <span className="op-title">To #{t.toAccountId}</span>
                    <span className="op-sub">{formatDateTime(t.createdAt)}</span>
                  </span>
                  <span className="op-amount">{formatMoney(t.amount, currency)}</span>
                </li>
              ))}
            </ol>
          )}
      </section>
    </>
  )
}

function Sparkline({ points, currency }: { points: MovingAveragePoint[]; currency: string }) {
  const total = formatMoney(sumAmounts(points.map(p => p.total)), currency)   // exact decimal sum
  const max = Math.max(...points.map(p => p.total), 0)
  // geometry only: floats are fine for pixels
  const xy = points.map((p, i) => [
    points.length > 1 ? (i / (points.length - 1)) * 300 : 150,
    max > 0 ? 74 - (p.total / max) * 66 : 74,
  ])
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <>
      <p className="spend-total">{total}</p>
      <svg className={`sparkline ${max === 0 ? 'flat' : ''}`} viewBox="0 0 300 80" preserveAspectRatio="none" role="img"
           aria-label={`Daily spending over the last ${DAYS} days, ${total} in total`}>
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--brand-2)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--brand-2)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" x2="300" y1="74.5" y2="74.5" stroke="var(--border)" vectorEffect="non-scaling-stroke" />
        {xy.length > 0 && <path d={`${line} L300 80 L0 80 Z`} fill="url(#spark-fill)" />}
        {xy.length > 0 && <path className="spark-line" d={line} fill="none" stroke="var(--brand-2)" strokeWidth="2" vectorEffect="non-scaling-stroke"
                                strokeLinejoin="round" strokeLinecap="round" />}
      </svg>
      {points.length > 0 && (
        <div className="spark-axis"><span>{formatDay(points[0].day)}</span><span>Today</span></div>
      )}
    </>
  )
}
