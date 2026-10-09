import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '../api/client'
import { accountsApi, transfersApi, type TransferResult } from '../api/esep'
import { useToken } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { Field } from '../components/Field'
import { errorMessage } from '../lib/errors'
import { formatMoney, validateAmount } from '../lib/format'
import { useApi } from '../lib/useApi'

const newKey = () => crypto.randomUUID()

/**
 * Idempotency: one key per logical transfer. A retry after a network error or a 5xx reuses the key,
 * so the server returns the original result instead of moving the money twice.
 * Any edit of the form, or a completed transfer, starts a new operation with a new key.
 */
export function TransferPage() {
  const token = useToken()
  const accounts = useApi(() => accountsApi.list(token), [token])
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(newKey)
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [result, setResult] = useState<TransferResult | null>(null)

  const active = useMemo(() => (accounts.data ?? []).filter(a => a.status === 'ACTIVE'), [accounts.data])
  const from = active.find(a => String(a.id) === fromId) ?? active[0]

  function edit(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setIdempotencyKey(newKey())   // different request = different operation
      setError(null)
      setResult(null)
    }
  }

  const amountError = touched ? validateAmount(amount) : null
  const toError = touched && !/^\d+$/.test(toId.trim()) ? 'Enter the recipient account number' : null

  async function submit(event: FormEvent) {
    event.preventDefault()
    setTouched(true)
    if (!from || validateAmount(amount) || !/^\d+$/.test(toId.trim())) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      const transfer = await transfersApi.transfer(token, idempotencyKey, from.id, Number(toId), amount.trim())
      setResult(transfer)
      setAmount('')
      setTouched(false)
      setIdempotencyKey(newKey())
      accounts.reload()
    } catch (err) {
      setError(err)   // the key is kept: "Try again" repeats the SAME operation
    } finally {
      setBusy(false)
    }
  }

  const apiError = error instanceof ApiError ? error : null
  if (accounts.loading && !accounts.data) {
    return <p className="spinner">Loading accounts…</p>
  }
  if (accounts.error) {
    return <Alert kind="error">{errorMessage(accounts.error)}</Alert>
  }
  if (active.length === 0) {
    return <div className="empty">You need an account first. <Link to="/accounts">Open one</Link>.</div>
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Transfer</h1>
          <p>Send money from your account to any account in the same currency.</p>
        </div>
      </div>
      <div className="grid-2">
        <section className="card">
          {result && (
            <Alert kind="success" title={result.replayed ? 'Already processed' : 'Transfer completed'}>
              {result.replayed
                ? 'This transfer had already been completed earlier; money was not moved twice.'
                : `Transaction #${result.transaction.id} is done.`}{' '}
              <Link to="/history">See history</Link>
            </Alert>
          )}
          {apiError && (
            <Alert kind="error" title={apiError.isRetryable ? 'The transfer may not have gone through' : undefined}>
              {errorMessage(apiError)}
              {apiError.isRetryable && ' Retrying is safe: it will not send the money twice.'}
            </Alert>
          )}
          <form onSubmit={submit} noValidate>
            <Field label="From" hint={from ? `Balance: ${formatMoney(from.balance, from.currency)}` : undefined}>
              <select value={from ? String(from.id) : ''} onChange={e => edit(setFromId)(e.target.value)}>
                {active.map(a => (
                  <option key={a.id} value={a.id}>#{a.id} · {a.currency} · {formatMoney(a.balance, a.currency)}</option>
                ))}
              </select>
            </Field>
            <Field label="To account number" error={toError ?? apiError?.fieldErrors.toAccountId}>
              <input inputMode="numeric" placeholder="e.g. 6" value={toId} onChange={e => edit(setToId)(e.target.value)} />
            </Field>
            <Field label={`Amount${from ? `, ${from.currency}` : ''}`}
                   error={amountError ?? apiError?.fieldErrors.amount}
                   hint="Up to 4 decimals">
              <input inputMode="decimal" placeholder="0.00" value={amount} onChange={e => edit(setAmount)(e.target.value)} />
            </Field>
            <button type="submit" disabled={busy}>
              {busy ? 'Sending…' : apiError?.isRetryable ? 'Try again' : 'Send'}
            </button>
          </form>
        </section>
        <section className="card">
          <h2>How it works</h2>
          <p className="secondary">
            Every transfer is one database transaction with two ledger entries: a debit on your account and a
            credit on the recipient's. Either both happen or none.
          </p>
          <p className="secondary">
            The form sends a unique <code>Idempotency-Key</code>. If the connection drops, pressing “Try again”
            repeats the same request and the server answers with the original result.
          </p>
          <p className="muted">Current key: <code>{idempotencyKey.slice(0, 8)}…</code></p>
        </section>
      </div>
    </>
  )
}
