import { ChevronLeft } from 'lucide-react'
import { m } from 'motion/react'
import { useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, type Location } from 'react-router'
import { ApiError } from '../api/client'
import { accountsApi, transfersApi, type TransferResult } from '../api/esep'
import type { Account } from '../api/types'
import { useToken } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { Field } from '../components/Field'
import { Sheet } from '../components/Sheet'
import { ErrorState, Skeleton } from '../components/States'
import { cardTheme, maskedNumber } from '../lib/cards'
import { useDataVersion } from '../lib/dataVersion'
import { errorMessage } from '../lib/errors'
import { cleanAmount, formatMoney, groupDigits, validateAmount } from '../lib/format'
import { useMotionDisabled } from '../lib/motion'
import { useApi } from '../lib/useApi'
import { SuccessMark } from './transfer/SuccessMark'

const newKey = () => crypto.randomUUID()

type Step = 'source' | 'recipient' | 'amount' | 'confirm' | 'done'
const STEPS: Step[] = ['source', 'recipient', 'amount', 'confirm']
const TITLES: Record<Step, string> = {
  source: 'From which account', recipient: 'Recipient', amount: 'How much to send', confirm: 'Confirm transfer', done: 'Transfer',
}

interface Completed { transfer: TransferResult; from: Account; toId: string; amount: string }

const isAccountNumber = (value: string) => /^\d+$/.test(value.trim())

/**
 * The transfer as a sheet (bottom sheet on phones, modal on desktop) in 4 steps + a success screen.
 *
 * Idempotency: one key per logical transfer. A retry after a network error or a 5xx reuses the key,
 * so the server returns the original result instead of moving the money twice.
 * Any edit of the form, or a completed transfer, starts a new operation with a new key.
 */
export function TransferPage() {
  const token = useToken()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { background?: Location; fromAccountId?: number } | null
  const { bump } = useDataVersion()
  const noMotion = useMotionDisabled()
  const accounts = useApi(() => accountsApi.list(token), [token])
  const [step, setStep] = useState<Step>('source')
  const [fromId, setFromId] = useState(state?.fromAccountId ? String(state.fromAccountId) : '')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(newKey)
  const [touched, setTouched] = useState({ recipient: false, amount: false })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [completed, setCompleted] = useState<Completed | null>(null)

  const active = useMemo(() => (accounts.data ?? []).filter(a => a.status === 'ACTIVE'), [accounts.data])
  const from = active.find(a => String(a.id) === fromId) ?? active[0]
  const apiError = error instanceof ApiError ? error : null

  function edit(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setIdempotencyKey(newKey())   // different request = different operation
      setError(null)
    }
  }

  const toError = (touched.recipient && !isAccountNumber(toId) ? 'Enter the recipient account number' : null)
    ?? apiError?.fieldErrors.toAccountId
  const amountError = (touched.amount ? validateAmount(amount) : null) ?? apiError?.fieldErrors.amount

  function close() {
    if (state?.background) navigate(-1)
    else navigate('/accounts', { replace: true })
  }

  function next(event: FormEvent) {
    event.preventDefault()
    if (step === 'source') setStep('recipient')
    else if (step === 'recipient') {
      setTouched(t => ({ ...t, recipient: true }))
      if (isAccountNumber(toId)) setStep('amount')
    } else if (step === 'amount') {
      setTouched(t => ({ ...t, amount: true }))
      if (!validateAmount(amount)) setStep('confirm')
    } else if (step === 'confirm') {
      void send()
    }
  }

  async function send() {
    if (!from) return
    setBusy(true)
    setError(null)
    try {
      const transfer = await transfersApi.transfer(token, idempotencyKey, from.id, Number(toId), amount.trim())
      setCompleted({ transfer, from, toId: toId.trim(), amount: amount.trim() })
      setStep('done')
      setAmount('')
      setTouched({ recipient: false, amount: false })
      setIdempotencyKey(newKey())
      accounts.reload()
      bump()   // the page behind the sheet reloads balances and operations
    } catch (err) {
      setError(err)   // the key is kept: "Try again" repeats the SAME operation
      if (err instanceof ApiError && err.fieldErrors.toAccountId) setStep('recipient')
      else if (err instanceof ApiError && err.fieldErrors.amount) setStep('amount')
    } finally {
      setBusy(false)
    }
  }

  function restart() {
    setCompleted(null)
    setToId('')
    setError(null)
    setStep('source')
  }

  const index = STEPS.indexOf(step)
  const back = index > 0 && step !== 'done'
    ? <button type="button" className="icon-button" aria-label="Back" onClick={() => setStep(STEPS[index - 1])}><ChevronLeft /></button>
    : null

  return (
    <Sheet title={TITLES[step]} closeLabel="Close transfer" onClose={close} leading={back}>
      {step !== 'done' && (
        <div className="steps" aria-label={`Step ${index + 1} of ${STEPS.length}`}>
          <span className="steps-text">Step {index + 1} of {STEPS.length}</span>
          <span className="steps-bar" aria-hidden="true"><span style={{ transform: `scaleX(${(index + 1) / STEPS.length})` }} /></span>
        </div>
      )}

      {accounts.loading && !accounts.data ? <div className="sheet-skeleton"><Skeleton className="mini" /><Skeleton className="mini" /></div>
        : accounts.error ? <ErrorState error={accounts.error} onRetry={accounts.reload} />
        : !from ? (
          <div className="state">
            <p>You need an account first.</p>
            <Link to="/accounts" className="button-link">Open an account</Link>
          </div>
        ) : (
          <m.form key={step} className="step" onSubmit={next} noValidate
                  initial={noMotion ? false : { opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
            {step === 'source' && (
              <fieldset className="source-list">
                <legend className="visually-hidden">From account</legend>
                {active.map(account => (
                  <label key={account.id} className="mini-card selectable" data-theme={cardTheme(account.currency)}>
                    <input type="radio" name="from" value={account.id} checked={account.id === from.id}
                           onChange={() => edit(setFromId)(String(account.id))} />
                    <span>{account.currency} · {maskedNumber(account.id)}</span>
                    <strong>{formatMoney(account.balance, account.currency)}</strong>
                  </label>
                ))}
              </fieldset>
            )}

            {step === 'recipient' && (
              <Field label="To account number" error={toError}
                     hint={`The number the recipient shared with you; the account must be in ${from.currency}.`}>
                <input inputMode="numeric" autoComplete="off" placeholder="e.g. 6" autoFocus value={toId}
                       onChange={e => edit(setToId)(e.target.value)} />
              </Field>
            )}

            {step === 'amount' && (
              <AmountInput currency={from.currency} value={amount} error={amountError}
                           hint={`Available ${formatMoney(from.balance, from.currency)} · up to 4 decimals`}
                           onChange={edit(setAmount)} />
            )}

            {step === 'confirm' && (
              <>
                <div className="confirm-amount">
                  <span className="hero-label">You send</span>
                  <strong>{formatMoney(amount.trim() as `${number}`, from.currency)}</strong>
                </div>
                <dl className="summary">
                  <div><dt>From</dt><dd>{maskedNumber(from.id)} · #{from.id}</dd></div>
                  <div><dt>To</dt><dd>Account #{toId.trim()}</dd></div>
                  <div><dt>Idempotency key</dt><dd><code>{idempotencyKey.slice(0, 8)}…</code></dd></div>
                </dl>
                {apiError && !apiError.fieldErrors.toAccountId && !apiError.fieldErrors.amount && (
                  <Alert kind="error" title={apiError.isRetryable ? 'The transfer may not have gone through' : undefined}>
                    {errorMessage(apiError)}
                    {apiError.isRetryable && ' Retrying is safe: it will not send the money twice.'}
                  </Alert>
                )}
                {error !== null && !apiError && <Alert kind="error">{errorMessage(error)}</Alert>}
              </>
            )}

            {step === 'done' && completed && (
              <div className="transfer-success">
                <SuccessMark />
                <h3>{completed.transfer.replayed ? 'Already processed' : 'Transfer completed'}</h3>
                <p className="success-amount">{formatMoney(completed.amount as `${number}`, completed.from.currency)}</p>
                <p className="secondary">
                  {completed.transfer.replayed
                    ? 'This transfer had already been completed earlier; money was not moved twice.'
                    : `To account #${completed.toId} · transaction #${completed.transfer.transaction.id}`}
                </p>
              </div>
            )}

            <div className="step-actions">
              {step === 'done' ? (
                <>
                  <button type="button" className="secondary" onClick={restart}>New transfer</button>
                  <button type="button" onClick={close}>Done</button>
                </>
              ) : step === 'confirm' ? (
                <button type="submit" disabled={busy}>{busy ? 'Sending…' : apiError?.isRetryable ? 'Try again' : 'Send'}</button>
              ) : (
                <button type="submit">Continue</button>
              )}
            </div>
          </m.form>
        )}
    </Sheet>
  )
}

interface AmountInputProps {
  currency: string
  value: string
  error?: string | null
  hint: string
  onChange: (raw: string) => void
}

/** Large amount field: decimal keypad on phones, thousands grouped while typing; the state keeps the raw string. */
function AmountInput({ currency, value, error, hint, onChange }: AmountInputProps) {
  const input = useRef<HTMLInputElement>(null)
  const caret = useRef<number | null>(null)

  // keep the caret after the same digit when grouping inserts or removes spaces
  useLayoutEffect(() => {
    const element = input.current
    if (caret.current === null || !element) return
    let seen = 0
    let position = 0
    while (position < element.value.length && seen < caret.current) {
      if (/[\d.]/.test(element.value[position])) seen++
      position++
    }
    element.setSelectionRange(position, position)
    caret.current = null
  }, [value])

  return (
    <div className="amount-field">
      <Field label={`Amount, ${currency}`} error={error ?? undefined} hint={hint}>
        <input ref={input} className="amount-input" inputMode="decimal" autoComplete="off" placeholder="0" autoFocus
               value={groupDigits(value)}
               onChange={e => {
                 const typed = e.target.value
                 caret.current = cleanAmount(typed.slice(0, e.target.selectionStart ?? typed.length)).length
                 onChange(cleanAmount(typed))
               }} />
      </Field>
    </div>
  )
}
