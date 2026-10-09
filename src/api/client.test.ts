import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, onUnauthorized, request, toApiError } from './client'

afterEach(() => {
  vi.unstubAllGlobals()
  onUnauthorized(null)
})

function respond(status: number, body: unknown, headers: Record<string, string> = {}) {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body), { status, headers })))
}

describe('toApiError', () => {
  it('maps the backend problem+json: code, message and the first error per field', () => {
    const error = toApiError(400, {
      code: 'VALIDATION_FAILED',
      detail: 'Request has invalid fields',
      errors: [
        { field: 'amount', message: 'must be greater than 0' },
        { field: 'amount', message: 'numeric value out of bounds' },
        { field: 'toAccountId', message: 'must not be null' },
      ],
    })
    expect(error.code).toBe('VALIDATION_FAILED')
    expect(error.message).toBe('Request has invalid fields')
    expect(error.fieldErrors).toEqual({ amount: 'must be greater than 0', toAccountId: 'must not be null' })
  })
})

describe('request', () => {
  it('sends the bearer token and returns data with headers', async () => {
    respond(200, { id: 1 }, { 'Idempotent-Replayed': 'true' })

    const response = await request<{ id: number }>('/api/x', { token: 'abc', method: 'POST', body: { a: 1 } })

    const init = vi.mocked(fetch).mock.calls[0][1] ?? {}
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc')
    expect(response.data.id).toBe(1)
    expect(response.headers.get('Idempotent-Replayed')).toBe('true')
  })

  it('reports a 401 on an authenticated call to the session handler', async () => {
    respond(401, { code: 'UNAUTHORIZED' })
    const handler = vi.fn()
    onUnauthorized(handler)

    await expect(request('/api/accounts', { token: 'expired' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does not treat a failed login (no token) as an expired session', async () => {
    respond(401, { code: 'INVALID_CREDENTIALS' })
    const handler = vi.fn()
    onUnauthorized(handler)

    await expect(request('/api/auth/login', { method: 'POST', body: {} })).rejects.toBeInstanceOf(ApiError)
    expect(handler).not.toHaveBeenCalled()
  })

  it('turns a network failure into a retryable NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))

    const error: unknown = await request('/api/transfers', { method: 'POST', token: 't' }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('NETWORK_ERROR')
    expect((error as ApiError).isRetryable).toBe(true)
  })

  it('does not mark a business error as retryable', () => {
    expect(toApiError(422, { code: 'INSUFFICIENT_FUNDS' }).isRetryable).toBe(false)
    expect(toApiError(409, { code: 'CONCURRENT_MODIFICATION' }).isRetryable).toBe(true)
  })
})
