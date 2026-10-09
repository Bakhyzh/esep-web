import { ArrowDownLeft, ArrowUpRight, ChevronRight, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { historyApi } from '../../api/esep'
import type { Operation } from '../../api/types'
import { useToken } from '../../auth/useAuth'
import { ErrorState, SectionHead, Skeleton } from '../../components/States'
import { useDataVersion } from '../../lib/dataVersion'
import { daysAgo, formatDay, formatMoney } from '../../lib/format'
import { useApi } from '../../lib/useApi'

const LIMIT = 8

const localDay = (iso: string) => new Date(iso).toLocaleDateString('en-CA')   // yyyy-MM-dd in the browser zone
const time = (iso: string) => new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(iso))

function dayLabel(day: string): string {
  if (day === daysAgo(0)) return 'Today'
  if (day === daysAgo(1)) return 'Yesterday'
  return formatDay(day, day.slice(0, 4) !== daysAgo(0).slice(0, 4))
}

function describe(op: Operation): { title: string; Icon: typeof Plus } {
  if (op.type === 'DEPOSIT') return { title: 'Top-up', Icon: Plus }
  if (op.direction === 'CREDIT') return { title: `Transfer from #${op.counterpartyAccountId}`, Icon: ArrowDownLeft }
  return { title: op.type === 'WITHDRAWAL' ? 'Withdrawal' : `Transfer to #${op.counterpartyAccountId}`, Icon: ArrowUpRight }
}

/** Latest operations grouped by day; incoming and outgoing differ by icon, sign and color. */
export function RecentOperations() {
  const token = useToken()
  const { version } = useDataVersion()
  const ops = useApi(signal => historyApi.list(token, { page: 0, size: LIMIT }, signal), [token, version])

  const groups = new Map<string, Operation[]>()
  for (const op of ops.data?.content ?? []) {
    const day = localDay(op.createdAt)
    groups.set(day, [...(groups.get(day) ?? []), op])
  }

  return (
    <section className="panel" aria-labelledby="recent-title">
      <SectionHead id="recent-title" title="Recent operations">
        <Link to="/history" className="text-link" aria-label="See all operations">See all<ChevronRight className="icon" aria-hidden="true" /></Link>
      </SectionHead>
      {ops.error ? <ErrorState error={ops.error} onRetry={ops.reload} />
        : !ops.data ? (
          <div className="ops-skeleton">
            {[0, 1, 2, 3].map(i => <div key={i} className="op-row"><Skeleton className="circle" /><Skeleton /><Skeleton className="short" /></div>)}
          </div>
        )
        : groups.size === 0 ? <p className="muted state">No operations yet. Transfers and top-ups will show up here.</p>
        : [...groups].map(([day, list]) => (
          <div key={day} className="op-group">
            <h3 className="op-day">{dayLabel(day)}</h3>
            <ul className="op-list">
              {list.map(op => {
                const { title, Icon } = describe(op)
                const incoming = op.direction === 'CREDIT'
                return (
                  <li key={op.entryId} className="op-row">
                    <span className={`op-icon ${incoming ? 'in' : 'out'}`} aria-hidden="true"><Icon /></span>
                    <span className="op-text">
                      <span className="op-title">{title}</span>
                      <span className="op-sub">{time(op.createdAt)} · #{op.accountId}</span>
                    </span>
                    <span className={`op-amount ${incoming ? 'amount-in' : 'amount-out'}`}>
                      <span className="visually-hidden">{incoming ? 'Incoming' : 'Outgoing'} </span>
                      {formatMoney(op.amount, op.currency)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
    </section>
  )
}
