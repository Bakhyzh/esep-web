// currencies with a system funding account on the backend (deposits are possible)
export const CURRENCIES = ['KZT', 'USD', 'EUR']

const THEMES: Record<string, string> = { KZT: 'brand', USD: 'navy', EUR: 'graphite' }

/** Card gradient per currency (see [data-theme] in styles/card.css). */
export const cardTheme = (currency: string) => THEMES[currency] ?? 'teal'

/** "ESEP •••• 0042": the last 4 digits of the account id; no invented card numbers. */
export const maskedNumber = (id: number) => `ESEP •••• ${String(id).padStart(4, '0').slice(-4)}`

export function currencySymbol(currency: string): string {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0).find(part => part.type === 'currency')?.value ?? currency
  } catch {
    return currency
  }
}
