import { useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { accountsApi, analyticsApi } from '../api/esep'
import type { Period } from '../api/types'
import { useToken } from '../auth/useAuth'
import { Alert } from '../components/Alert'
import { ChartTooltip } from '../components/ChartTooltip'
import { Field } from '../components/Field'
import { useThemeColors } from '../components/useThemeColors'
import { errorMessage } from '../lib/errors'
import { daysAgo, formatDateTime, formatDay, formatMoney, formatMonth, formatNumber } from '../lib/format'
import { useApi } from '../lib/useApi'

const PRESETS = [7, 30, 90]
const MOVING_WINDOW = 7

export function AnalyticsPage() {
  const token = useToken()
  const accounts = useApi(() => accountsApi.list(token), [token])
  const currencies = useMemo(
    () => [...new Set((accounts.data ?? []).map(a => a.currency))].sort(),
    [accounts.data])

  const [chosenCurrency, setCurrency] = useState('')
  const currency = chosenCurrency || currencies[0] || ''
  const [from, setFrom] = useState(daysAgo(29))
  const [to, setTo] = useState(daysAgo(0))
  const [period, setPeriod] = useState<Period>('DAY')
  const rangeInvalid = from > to

  if (accounts.loading && !accounts.data) {
    return <p className="spinner">Loading…</p>
  }
  if (accounts.error) {
    return <Alert kind="error">{errorMessage(accounts.error)}</Alert>
  }
  if (!currency) {
    return <div className="empty">Open an account to see analytics.</div>
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Analytics</h1>
          <p>Where your money went: outgoing transfers in one currency.</p>
        </div>
      </div>

      <section className="card">
        <div className="row" role="group" aria-label="Report filters">
          <Field label="Currency">
            <select value={currency} onChange={e => setCurrency(e.target.value)}>
              {currencies.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="From" error={rangeInvalid ? '“From” is after “To”' : undefined}>
            <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <input type="date" value={to} min={from} onChange={e => setTo(e.target.value)} />
          </Field>
          <div className="presets" role="group" aria-label="Quick ranges">
            {PRESETS.map(days => (
              <button key={days} type="button" className="secondary"
                      onClick={() => { setFrom(daysAgo(days - 1)); setTo(daysAgo(0)) }}>
                {days} days
              </button>
            ))}
          </div>
        </div>
      </section>

      {rangeInvalid ? <Alert kind="error">Choose a start date before the end date.</Alert> : (
        <Reports token={token} currency={currency} from={from} to={to} period={period} onPeriod={setPeriod} />
      )}
    </>
  )
}

interface ReportsProps {
  token: string
  currency: string
  from: string
  to: string
  period: Period
  onPeriod: (period: Period) => void
}

function Reports({ token, currency, from, to, period, onPeriod }: ReportsProps) {
  const colors = useThemeColors()
  const query = { currency, from, to }
  const spending = useApi(s => analyticsApi.spending(token, query, period, s), [token, currency, from, to, period])
  const daily = useApi(s => analyticsApi.movingAverage(token, query, MOVING_WINDOW, s), [token, currency, from, to])
  const top = useApi(s => analyticsApi.top(token, query, 10, s), [token, currency, from, to])
  const monthly = useApi(s => analyticsApi.monthly(token, currency, 6, s), [token, currency])

  const money = (value: number) => formatMoney(value, currency)
  const total = (spending.data ?? []).reduce((sum, p) => sum + p.total, 0)
  const operations = (spending.data ?? []).reduce((sum, p) => sum + p.operations, 0)
  const axis = { tick: { fill: colors.muted, fontSize: 12 }, axisLine: false, tickLine: false } as const
  const periodLabel = (start: string) => period === 'MONTH' ? formatMonth(start.slice(0, 7)) : formatDay(start)

  return (
    <>
      <div className="stats">
        <Stat label="Spent" value={spending.data ? money(total) : '…'} />
        <Stat label="Outgoing transfers" value={spending.data ? String(operations) : '…'} />
        <Stat label="Average transfer" value={spending.data ? (operations ? money(total / operations) : '—') : '…'} />
      </div>

      <section className="card" aria-labelledby="spending-title">
        <div className="card-head">
          <h2 id="spending-title">Spending by {period.toLowerCase()}</h2>
          <div className="presets" role="group" aria-label="Group by">
            {(['DAY', 'WEEK', 'MONTH'] as Period[]).map(p => (
              <button key={p} type="button" className={p === period ? '' : 'secondary'} aria-pressed={p === period}
                      onClick={() => onPeriod(p)}>{p[0] + p.slice(1).toLowerCase()}</button>
            ))}
          </div>
        </div>
        {spending.error ? <Alert kind="error">{errorMessage(spending.error)}</Alert>
          : !spending.data ? <p className="spinner">Loading…</p>
          : spending.data.length === 0 ? <div className="empty">No spending in this period.</div>
          : (
            <>
              <div className="chart">
                <ResponsiveContainer>
                  <BarChart data={spending.data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke={colors.grid} />
                    <XAxis dataKey="periodStart" tickFormatter={periodLabel} {...axis} minTickGap={16} />
                    <YAxis tickFormatter={formatNumber} width={64} {...axis} />
                    <Tooltip cursor={{ fill: colors.grid, opacity: 0.6 }}
                             content={props => <ChartTooltip {...props} formatLabel={periodLabel} formatValue={money} />} />
                    <Bar dataKey="total" name="Spent" fill={colors.series1} radius={[4, 4, 0, 0]} maxBarSize={32}
                         isAnimationActive={colors.animate} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <details>
                <summary>Show as table</summary>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th scope="col">Period</th><th scope="col" className="num">Spent</th><th scope="col" className="num">Transfers</th></tr></thead>
                    <tbody>
                      {spending.data.map(p => (
                        <tr key={p.periodStart}><td>{periodLabel(p.periodStart)}</td><td className="num">{money(p.total)}</td><td className="num">{p.operations}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
      </section>

      <section className="card" aria-labelledby="daily-title">
        <div className="card-head">
          <h2 id="daily-title">Daily spending and {MOVING_WINDOW}-day average</h2>
          <div className="legend" aria-hidden="true">
            <span><i className="swatch" style={{ background: colors.series1 }} />Daily total</span>
            <span><i className="swatch" style={{ background: colors.series2 }} />{MOVING_WINDOW}-day average</span>
          </div>
        </div>
        {daily.error ? <Alert kind="error">{errorMessage(daily.error)}</Alert>
          : !daily.data ? <p className="spinner">Loading…</p>
          : (
            <div className="chart">
              <ResponsiveContainer>
                <ComposedChart data={daily.data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={colors.grid} />
                  <XAxis dataKey="day" tickFormatter={d => formatDay(d)} {...axis} minTickGap={24} />
                  <YAxis tickFormatter={formatNumber} width={64} {...axis} />
                  <Tooltip cursor={{ stroke: colors.muted, strokeDasharray: '3 3' }}
                           content={props => <ChartTooltip {...props} formatLabel={d => formatDay(d, true)} formatValue={money} />} />
                  <Bar dataKey="total" name="Daily total" fill={colors.series1} radius={[4, 4, 0, 0]} maxBarSize={20}
                       isAnimationActive={colors.animate} />
                  <Line dataKey="movingAverage" name={`${MOVING_WINDOW}-day average`} stroke={colors.series2}
                        strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: colors.surface, strokeWidth: 2 }} type="monotone"
                        isAnimationActive={colors.animate} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        <p className="muted">Days without transfers count as zero, so the average reflects calendar days.</p>
      </section>

      <div className="grid-2">
        <section className="card" aria-labelledby="top-title">
          <h2 id="top-title">Largest transfers</h2>
          {top.error ? <Alert kind="error">{errorMessage(top.error)}</Alert>
            : !top.data ? <p className="spinner">Loading…</p>
            : top.data.length === 0 ? <div className="empty">No transfers in this period.</div>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th scope="col">#</th><th scope="col">To</th><th scope="col">Date</th><th scope="col" className="num">Amount</th></tr></thead>
                  <tbody>
                    {top.data.map(t => (
                      <tr key={t.transactionId}>
                        <td>{t.rank}</td><td>#{t.toAccountId}</td><td>{formatDateTime(t.createdAt)}</td>
                        <td className="num">{money(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>

        <section className="card" aria-labelledby="monthly-title">
          <h2 id="monthly-title">Month over month</h2>
          {monthly.error ? <Alert kind="error">{errorMessage(monthly.error)}</Alert>
            : !monthly.data ? <p className="spinner">Loading…</p>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th scope="col">Month</th><th scope="col" className="num">Spent</th><th scope="col" className="num">Change</th></tr></thead>
                  <tbody>
                    {monthly.data.map(m => (
                      <tr key={m.month}>
                        <td>{formatMonth(m.month)}</td>
                        <td className="num">{money(m.total)}</td>
                        <td className="num">
                          {m.changePercent === null ? <span className="muted">—</span>
                            : `${m.changePercent > 0 ? '+' : ''}${formatNumber(m.changePercent)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}
