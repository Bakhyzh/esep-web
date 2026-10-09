import { describe, expect, it } from 'vitest'
import { sumAmounts, toUnits, unitsToDecimal } from './decimal'

describe('decimal money', () => {
  it('converts API numbers to exact units', () => {
    expect(toUnits(120.5)).toBe(1205000n)
    expect(toUnits(0.0001)).toBe(1n)
    expect(toUnits(-3.25)).toBe(-32500n)
    expect(toUnits(999999999999.9999)).toBe(9999999999999999n)
  })

  it('sums without float errors', () => {
    expect(0.1 + 0.2).not.toBe(0.3)
    expect(sumAmounts([0.1, 0.2])).toBe('0.3000')
    expect(sumAmounts([])).toBe('0.0000')
    expect(unitsToDecimal(-5n)).toBe('-0.0005')
  })
})
