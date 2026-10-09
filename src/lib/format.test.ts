import { describe, expect, it } from 'vitest'
import { cleanAmount, groupDigits, validateAmount } from './format'

describe('validateAmount (same rule as the backend NUMERIC(19,4))', () => {
  it.each(['1', '0.0001', '1500.50', '999999999999999.9999'])('accepts %s', amount => {
    expect(validateAmount(amount)).toBeNull()
  })

  it.each(['', '0', '0.0000', '-5', '1.00001', '1,5', 'abc', '1e3'])('rejects "%s"', amount => {
    expect(validateAmount(amount)).not.toBeNull()
  })
})

describe('amount input', () => {
  it('groups thousands for display only', () => {
    expect(groupDigits('1234567.5')).toBe('1\u2009234\u2009567.5')
    expect(groupDigits('999')).toBe('999')
    expect(groupDigits('12.')).toBe('12.')
  })

  it('cleans typed text back to a raw amount', () => {
    expect(cleanAmount('1\u2009234.50')).toBe('1234.50')
    expect(cleanAmount('12,5')).toBe('12.5')
    expect(cleanAmount('1.2.3')).toBe('1.23')
    expect(cleanAmount('abc')).toBe('')
  })
})
