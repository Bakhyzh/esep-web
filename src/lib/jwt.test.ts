import { describe, expect, it } from 'vitest'
import { isExpired, tokenExpiresAt } from './jwt'

function token(payload: object): string {
  const base64url = (value: string) => btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${base64url('{"alg":"HS256"}')}.${base64url(JSON.stringify(payload))}.signature`
}

describe('jwt', () => {
  it('reads exp in milliseconds', () => {
    expect(tokenExpiresAt(token({ sub: '1', exp: 1_800_000_000 }))).toBe(1_800_000_000_000)
  })

  it('treats a past exp as expired and a future one as valid', () => {
    const now = Date.now()
    expect(isExpired(token({ exp: Math.floor(now / 1000) - 10 }), now)).toBe(true)
    expect(isExpired(token({ exp: Math.floor(now / 1000) + 3600 }), now)).toBe(false)
  })

  it('treats garbage as expired', () => {
    expect(isExpired('not-a-jwt')).toBe(true)
    expect(isExpired(token({ sub: '1' }))).toBe(true) // no exp claim
  })
})
