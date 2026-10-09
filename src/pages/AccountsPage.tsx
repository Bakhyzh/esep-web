import { RefreshCw } from 'lucide-react'
import { m } from 'motion/react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { accountsApi } from '../api/esep'
import type { Account } from '../api/types'
import { useToken } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { EmptyIllustration, ErrorState, SectionHead, Skeleton } from '../components/States'
import { useToast } from '../components/toast'
import { CURRENCIES } from '../lib/cards'
import { useDataVersion } from '../lib/dataVersion'
import { errorMessage } from '../lib/errors'
import { cascade, useMotionDisabled } from '../lib/motion'
import { useApi } from '../lib/useApi'
import { NewAccountSheet, OpenAccountForm, TopUpSheet } from './dashboard/AccountSheets'
import { BalanceHero } from './dashboard/BalanceHero'
import { CardCarousel } from './dashboard/CardCarousel'
import { QuickActions } from './dashboard/QuickActions'
import { RecentOperations } from './dashboard/RecentOperations'
import { SpendingPanel } from './dashboard/SpendingPanel'

type SheetState = { kind: 'new' } | { kind: 'topup'; account: Account } | null

const order = (currency: string) => (CURRENCIES.indexOf(currency) + 1 || 99)

export function AccountsPage() {
  const token = useToken()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const noMotion = useMotionDisabled()
  const { version } = useDataVersion()
  const accounts = useApi(() => accountsApi.list(token), [token, version])
  const [chosenCurrency, setCurrency] = useState('')
  const [sheet, setSheet] = useState<SheetState>(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<unknown>(null)

  const list = [...(accounts.data ?? [])].sort((a, b) =>
    Number(a.status === 'CLOSED') - Number(b.status === 'CLOSED') || order(a.currency) - order(b.currency) || a.id - b.id)
  const active = list.filter(a => a.status === 'ACTIVE')
  const currencies = active.map(a => a.currency)
  const currency = currencies.includes(chosenCurrency) ? chosenCurrency : currencies[0] ?? ''
  const selected = active.find(a => a.currency === currency)

  async function run(action: () => Promise<unknown>, success: string): Promise<boolean> {
    setBusy(true)
    setActionError(null)
    try {
      await action()
      accounts.reload()
      toast('success', success)
      return true
    } catch (err) {
      setActionError(err)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function create(newCurrency: string) {
    if (await run(() => accountsApi.create(token, newCurrency), `${newCurrency} account opened`)) {
      setSheet(null)
      setCurrency(newCurrency)
    }
  }

  async function close(account: Account) {
    if (window.confirm(`Close account #${account.id} (${account.currency})? This cannot be undone.`)) {
      await run(() => accountsApi.close(token, account.id), `Account #${account.id} closed`)
    }
  }

  const transfer = (account?: Account) =>
    navigate('/transfer', { state: { background: location, fromAccountId: account?.id } })
  const reveal = { variants: cascade.item }
  const showCarousel = list.length > 0 && !accounts.error
  const refresh = (
    <button type="button" className="icon-button" aria-label="Refresh" onClick={accounts.reload} disabled={accounts.loading}>
      <RefreshCw />
    </button>
  )

  return (
    <m.div className="dashboard" variants={cascade.container} initial={noMotion ? false : 'hidden'} animate="show">
      <div className="dash-main">
        <m.div {...reveal}>
          {accounts.loading && !accounts.data
            ? <div className="hero"><Skeleton className="title" /><Skeleton className="big" /></div>
            : <BalanceHero currencies={currencies} currency={currency} account={selected} onCurrency={setCurrency} loaded={!accounts.error} />}
        </m.div>

        <m.section {...reveal} aria-labelledby="accounts-title">
          {!showCarousel && <SectionHead id="accounts-title" title="Accounts">{refresh}</SectionHead>}
          {actionError !== null && sheet === null && <Alert kind="error">{errorMessage(actionError)}</Alert>}
          {accounts.loading && !accounts.data ? (
            <div className="carousel skeleton-row">{[0, 1, 2].map(i => <Skeleton key={i} className="card" />)}</div>
          ) : accounts.error ? (
            <ErrorState error={accounts.error} onRetry={accounts.reload} />
          ) : list.length === 0 ? (
            <div className="empty-state">
              <EmptyIllustration />
              <p className="empty-title">No accounts yet</p>
              <p className="secondary">Open your first account to receive and send money.</p>
              <OpenAccountForm busy={busy} error={null} onCreate={create} />
            </div>
          ) : (
            <CardCarousel accounts={list} busy={busy} tools={refresh} onNew={() => { setActionError(null); setSheet({ kind: 'new' }) }}
                          onTopUp={account => setSheet({ kind: 'topup', account })} onTransfer={transfer} onClose={close} />
          )}
        </m.section>

        {selected && (
          <m.div {...reveal}>
            <QuickActions onTopUp={() => setSheet({ kind: 'topup', account: selected })} />
          </m.div>
        )}

        {list.length > 0 && <m.div {...reveal}><RecentOperations /></m.div>}
      </div>

      {currency && (
        <m.aside {...reveal} className="dash-aside" aria-label={`Spending in ${currency}`}>
          <SpendingPanel currency={currency} />
        </m.aside>
      )}

      {sheet?.kind === 'new' && (
        <NewAccountSheet busy={busy} error={actionError} onCreate={create} onClose={() => { setSheet(null); setActionError(null) }} />
      )}
      {sheet?.kind === 'topup' && <TopUpSheet account={sheet.account} onClose={() => setSheet(null)} />}
    </m.div>
  )
}
