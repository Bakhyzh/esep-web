import { useState } from 'react'
import type { Account } from '../../api/types'
import { useAuth } from '../../auth/useAuth'
import { formatMoney } from '../../lib/format'
import { useCountUp } from '../../lib/useCountUp'
import { CurrencyPills } from './CurrencyPicker'

function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/** "alice.smith@esep.dev" -> "Alice" */
function firstName(email: string): string {
  const name = email.split('@')[0].split(/[._-]/)[0]
  return name ? name[0].toUpperCase() + name.slice(1) : ''
}

interface BalanceHeroProps {
  currencies: string[]
  currency: string
  account: Account | undefined
  onCurrency: (currency: string) => void
  /** false while accounts failed to load: no "open an account" hint then */
  loaded: boolean
}

/**
 * Balances are never added across currencies: the pills switch between them. There is one active account
 * per currency (closed ones always hold zero), so the balance of a currency is that account's balance,
 * shown as the API sent it; no arithmetic on money.
 */
export function BalanceHero({ currencies, currency, account, onCurrency, loaded }: BalanceHeroProps) {
  const { user } = useAuth()
  const name = user ? firstName(user.email) : ''
  const [hello] = useState(() => greeting(new Date().getHours()))
  return (
    <section className="hero" aria-labelledby="greeting">
      <h1 id="greeting">{hello}{name && `, ${name}`}</h1>
      {account ? (
        <>
          <div className="hero-balance">
            <span className="hero-label">Total balance</span>
            {/* remount per currency: the count-up starts from zero for each one */}
            <HeroAmount key={currency} account={account} />
          </div>
          {currencies.length > 1 && <CurrencyPills label="Balance currency" options={currencies} value={currency} onChange={onCurrency} />}
        </>
      ) : loaded && (
        <p className="hero-label">Open an account to start receiving and sending money.</p>
      )}
    </section>
  )
}

function HeroAmount({ account }: { account: Account }) {
  const ref = useCountUp<HTMLParagraphElement>(account.balance, value => formatMoney(value, account.currency))
  return <p className="hero-amount" ref={ref} />
}
