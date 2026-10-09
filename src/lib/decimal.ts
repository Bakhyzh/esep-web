// Money arrives as JSON numbers (NUMERIC(19,4) on the backend). Up to 15 significant digits a double
// round-trips through String() exactly, so the decimal text is recovered from it and sums are done in
// integer units of 0.0001 with BigInt: no float arithmetic on money.

const SCALE = 4
const UNIT = 10n ** BigInt(SCALE)

/** 120.5 -> 1205000n (units of 0.0001). */
export function toUnits(value: number): bigint {
  const text = String(value).includes('e') ? value.toFixed(SCALE) : String(value)
  const negative = text.startsWith('-')
  const [int, frac = ''] = text.replace('-', '').split('.')
  const units = BigInt(int) * UNIT + BigInt((frac + '0'.repeat(SCALE)).slice(0, SCALE))
  return negative ? -units : units
}

/** 1205000n -> "120.5000" */
export function unitsToDecimal(units: bigint): `${number}` {
  const negative = units < 0n
  const abs = negative ? -units : units
  const int = abs / UNIT
  const frac = String(abs % UNIT).padStart(SCALE, '0')
  return `${negative ? '-' : ''}${int}.${frac}` as `${number}`
}

/** Exact sum of API amounts as a decimal string (Intl.NumberFormat formats it without a float). */
export function sumAmounts(values: readonly number[]): `${number}` {
  return unitsToDecimal(values.reduce((sum, value) => sum + toUnits(value), 0n))
}
