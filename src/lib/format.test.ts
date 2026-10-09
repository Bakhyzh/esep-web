import { describe, expect, it } from 'vitest'
import { validateAmount } from './format'

describe('validateAmount (same rule as the backend NUMERIC(19,4))', () => {
  it.each(['1', '0.0001', '1500.50', '999999999999999.9999'])('accepts %s', amount => {
    expect(validateAmount(amount)).toBeNull()
  })

  it.each(['', '0', '0.0000', '-5', '1.00001', '1,5', 'abc', '1e3'])('rejects "%s"', amount => {
    expect(validateAmount(amount)).not.toBeNull()
  })
})
