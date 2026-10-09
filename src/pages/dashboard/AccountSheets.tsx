import { Copy } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Account } from '../../api/types'
import { Alert } from '../../components/Alert'
import { Sheet } from '../../components/Sheet'
import { useToast } from '../../components/toast'
import { CURRENCIES, cardTheme, maskedNumber } from '../../lib/cards'
import { errorMessage } from '../../lib/errors'
import { formatMoney } from '../../lib/format'
import { CurrencyPills } from './CurrencyPicker'

/** Currency choice + "Open account"; used in the empty state and in the "New account" sheet. */
export function OpenAccountForm({ busy, error, onCreate }:
  { busy: boolean; error: unknown; onCreate: (currency: string) => void }) {
  const [currency, setCurrency] = useState('KZT')
  function submit(event: FormEvent) {
    event.preventDefault()
    onCreate(currency)
  }
  return (
    <form className="open-form" onSubmit={submit}>
      <CurrencyPills label="Currency" options={CURRENCIES} value={currency} onChange={setCurrency} />
      {error !== null && <Alert kind="error">{errorMessage(error)}</Alert>}
      <button type="submit" disabled={busy}>{busy ? 'Opening…' : 'Open account'}</button>
      <p className="muted small">New accounts start at zero. Money arrives by a transfer or an admin deposit.</p>
    </form>
  )
}

export function NewAccountSheet({ busy, error, onCreate, onClose }:
  { busy: boolean; error: unknown; onCreate: (currency: string) => void; onClose: () => void }) {
  return (
    <Sheet title="New account" closeLabel="Close new account" onClose={onClose}>
      <p className="secondary">One active account per currency.</p>
      <OpenAccountForm busy={busy} error={error} onCreate={onCreate} />
    </Sheet>
  )
}

/**
 * Users cannot deposit by themselves in esep-api (deposits are an admin operation), so "Top up" explains
 * how money arrives and lets the user copy the account number to share.
 */
export function TopUpSheet({ account, onClose }: { account: Account; onClose: () => void }) {
  const toast = useToast()
  async function copy() {
    try {
      await navigator.clipboard.writeText(String(account.id))
      toast('success', `Account number ${account.id} copied`)
    } catch {
      toast('error', 'Could not copy. Select the number and copy it manually.')
    }
  }
  return (
    <Sheet title="Top up" closeLabel="Close top up" onClose={onClose}>
      <div className="mini-card" data-theme={cardTheme(account.currency)}>
        <span>{account.currency} · {maskedNumber(account.id)}</span>
        <strong>{formatMoney(account.balance, account.currency)}</strong>
      </div>
      <p className="secondary">Share your account number: any Esep user can send {account.currency} to it.</p>
      <div className="copy-row">
        <span className="copy-value">{account.id}</span>
        <button type="button" className="secondary" onClick={copy}><Copy className="icon" aria-hidden="true" />Copy number</button>
      </div>
      <p className="muted small">Card top-ups are not connected in this demo; an administrator can also make a deposit.</p>
    </Sheet>
  )
}
