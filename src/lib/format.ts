/** `amount` may be an exact decimal string ("120.5000", see decimal.ts): Intl formats it without a float. */
export function formatMoney(amount: number | `${number}`, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 4,
    }).format(amount)
  } catch {
    return `${Number(amount).toFixed(2)} ${currency}`
  }
}

/** Groups the integer part of a typed amount: "12345.5" -> "12 345.5" (a space never clashes with "." or ","). */
export function groupDigits(raw: string): string {
  const [int, frac] = raw.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009')
  return frac === undefined ? grouped : `${grouped}.${frac}`
}

/** Typed text -> raw amount: digits and one ".", a "," also counts as the decimal point. */
export function cleanAmount(typed: string): string {
  const text = typed.replace(/,/g, '.').replace(/[^\d.]/g, '')
  const dot = text.indexOf('.')
  return dot === -1 ? text : text.slice(0, dot + 1) + text.slice(dot + 1).replace(/\./g, '')
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

/** "2026-10-09" (a calendar day from the API) -> "Oct 9", without time zone shifts. */
export function formatDay(day: string, withYear = false): string {
  const [y, m, d] = day.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', year: withYear ? 'numeric' : undefined,
  }).format(new Date(y, m - 1, d))
}

export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(new Date(y, m - 1, 1))
}

/** Local calendar day as yyyy-MM-dd, n days ago. */
export function daysAgo(n: number): string {
  const date = new Date()
  date.setDate(date.getDate() - n)
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Positive decimal with at most 4 fraction digits: the same rule as the backend (NUMERIC(19,4)). */
export function validateAmount(raw: string): string | null {
  const value = raw.trim()
  if (!value) {
    return 'Enter an amount'
  }
  if (!/^\d{1,15}(\.\d{1,4})?$/.test(value)) {
    return 'Use digits with up to 4 decimals, e.g. 1500.50'
  }
  if (Number(value) <= 0) {
    return 'Amount must be greater than zero'
  }
  return null
}
