import { useSearchParams } from 'react-router'
import { accountsApi, historyApi } from '../api/esep'
import { useToken } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { Field } from '../components/Field'
import { Pagination } from '../components/Pagination'
import { errorMessage } from '../lib/errors'
import { formatDateTime, formatMoney } from '../lib/format'
import { useApi } from '../lib/useApi'

const PAGE_SIZE = 20

const TYPE_LABEL: Record<string, string> = { TRANSFER: 'Transfer', DEPOSIT: 'Deposit', WITHDRAWAL: 'Withdrawal' }

/** Filters live in the URL: reload, back button and shared links keep them. */
export function HistoryPage() {
  const token = useToken()
  const [params, setParams] = useSearchParams()
  const accountId = params.get('accountId') ?? ''
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0)

  const accounts = useApi(() => accountsApi.list(token), [token])
  const rangeInvalid = Boolean(from && to && from > to)
  const history = useApi(
    signal => rangeInvalid
      ? Promise.resolve(null)
      : historyApi.list(token, {
          accountId: accountId ? Number(accountId) : undefined,
          from: from || undefined, to: to || undefined, page, size: PAGE_SIZE,
        }, signal),
    [token, accountId, from, to, page, rangeInvalid])

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('page' in changes)) next.delete('page')   // a new filter starts from the first page
    setParams(next)
  }

  const data = history.data
  return (
    <>
      <div className="page-head">
        <div>
          <h1>History</h1>
          <p>All operations on your accounts, newest first.</p>
        </div>
      </div>
      <section className="card">
        <div className="row" role="group" aria-label="Filters">
          <Field label="Account">
            <select value={accountId} onChange={e => update({ accountId: e.target.value })}>
              <option value="">All accounts</option>
              {(accounts.data ?? []).map(a => <option key={a.id} value={a.id}>#{a.id} · {a.currency}</option>)}
            </select>
          </Field>
          <Field label="From" error={rangeInvalid ? '“From” is after “To”' : undefined}>
            <input type="date" value={from} max={to || undefined} onChange={e => update({ from: e.target.value })} />
          </Field>
          <Field label="To">
            <input type="date" value={to} min={from || undefined} onChange={e => update({ to: e.target.value })} />
          </Field>
          {(accountId || from || to) && (
            <button type="button" className="secondary" onClick={() => setParams(new URLSearchParams())}>Reset</button>
          )}
        </div>

        {history.error ? <Alert kind="error">{errorMessage(history.error)}</Alert>
          : history.loading && !data ? <p className="spinner">Loading operations…</p>
          : !data || data.content.length === 0 ? <div className="empty">No operations for these filters.</div>
          : (
            <div className="table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Operation</th>
                    <th scope="col">Account</th>
                    <th scope="col">Counterparty</th>
                    <th scope="col" className="num">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map(op => (
                    <tr key={op.entryId}>
                      <td>{formatDateTime(op.createdAt)}</td>
                      <td>
                        {TYPE_LABEL[op.type] ?? op.type}{' '}
                        <span className="muted">{op.direction === 'CREDIT' ? '· incoming' : '· outgoing'}</span>
                      </td>
                      <td>#{op.accountId}</td>
                      <td>{op.type === 'DEPOSIT' ? <span className="muted">Top-up</span> : `#${op.counterpartyAccountId}`}</td>
                      <td className={`num ${op.direction === 'CREDIT' ? 'amount-in' : 'amount-out'}`}>
                        {formatMoney(op.amount, op.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {data && (
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements}
                      onPage={p => update({ page: String(p) })} />
        )}
      </section>
    </>
  )
}
