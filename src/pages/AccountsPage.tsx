import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { accountsApi, notificationsApi } from '../api/esep'
import type { Account } from '../api/types'
import { useToken } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { Stairs } from '../components/Brand'
import { Field } from '../components/Field'
import { errorMessage } from '../lib/errors'
import { formatDateTime, formatMoney } from '../lib/format'
import { useApi } from '../lib/useApi'

// currencies with a system funding account on the backend (deposits are possible)
const CURRENCIES = ['KZT', 'USD', 'EUR']

export function AccountsPage() {
  const token = useToken()
  const accounts = useApi(() => accountsApi.list(token), [token])
  const notifications = useApi(() => notificationsApi.latest(token, 5), [token])
  const [currency, setCurrency] = useState('KZT')
  const [actionError, setActionError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  async function create(event: FormEvent) {
    event.preventDefault()
    await run(() => accountsApi.create(token, currency))
  }

  async function close(account: Account) {
    if (window.confirm(`Close account #${account.id} (${account.currency})? This cannot be undone.`)) {
      await run(() => accountsApi.close(token, account.id))
    }
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setActionError(null)
    try {
      await action()
      accounts.reload()
    } catch (err) {
      setActionError(err)
    } finally {
      setBusy(false)
    }
  }

  const list = accounts.data ?? []
  const active = list.filter(a => a.status === 'ACTIVE')
  return (
    <>
      <div className="page-head page-hero">
        <div>
          <h1>Accounts</h1>
          <p>One active account per currency. Share the account number to receive money.</p>
        </div>
        <div className="actions">
          {active.length > 0 && <Link to="/transfer" className="button-link">New transfer</Link>}
          <Stairs />
        </div>
      </div>

      {actionError !== null && <Alert kind="error">{errorMessage(actionError)}</Alert>}

      <section className="card" aria-labelledby="accounts-title">
        <div className="card-head">
          <h2 id="accounts-title">Your accounts</h2>
          <button type="button" className="link" onClick={accounts.reload} disabled={accounts.loading}>Refresh</button>
        </div>
        {accounts.loading && !accounts.data ? <p className="spinner">Loading accounts…</p>
          : accounts.error ? <Alert kind="error">{errorMessage(accounts.error)}</Alert>
          : list.length === 0 ? <div className="empty">No accounts yet. Open your first one below.</div>
          : (
            <div className="accounts">
              {list.map(account => (
                <article key={account.id} className={`account ${account.status === 'CLOSED' ? 'closed' : ''}`}>
                  <div className="meta">
                    <span>Account #{account.id}</span>
                    <span className="badge">{account.status === 'ACTIVE' ? account.currency : 'Closed'}</span>
                  </div>
                  <div className="balance">{formatMoney(account.balance, account.currency)}</div>
                  <div className="meta">
                    <span>Opened {formatDateTime(account.createdAt)}</span>
                    {account.status === 'ACTIVE' && account.balance === 0 && (
                      <button type="button" className="link" disabled={busy} onClick={() => close(account)}>Close</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>

      <div className="grid-2">
        <section className="card" aria-labelledby="open-title">
          <h2 id="open-title">Open an account</h2>
          <form onSubmit={create}>
            <div className="row">
              <Field label="Currency">
                <select value={currency} onChange={e => setCurrency(e.target.value)}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <button type="submit" disabled={busy}>Open account</button>
            </div>
          </form>
          <p className="muted">New accounts start at zero. Money arrives by a transfer or an admin deposit.</p>
        </section>

        <section className="card" aria-labelledby="notifications-title">
          <div className="card-head">
            <h2 id="notifications-title">Latest notifications</h2>
            <button type="button" className="link" onClick={notifications.reload}>Refresh</button>
          </div>
          {notifications.error ? <Alert kind="error">{errorMessage(notifications.error)}</Alert>
            : !notifications.data?.length ? <div className="empty">No notifications yet.</div>
            : (
              <ul className="notifications">
                {notifications.data.map(n => (
                  <li key={n.id}>
                    <span>{n.message}</span>
                    <span className="muted"> · {formatDateTime(n.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          <p className="muted">Delivered asynchronously through Kafka, usually within a second after a transfer.</p>
        </section>
      </div>
    </>
  )
}
