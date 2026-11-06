import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { accountsApi, analyticsApi, authApi, notificationsApi } from '../api/esep'
import { resolveIdentity } from './identityReady'
vi.mock('../api/esep', () => ({
  authApi: { me: vi.fn() }, accountsApi: { list: vi.fn() },
  analyticsApi: { spending: vi.fn() }, notificationsApi: { latest: vi.fn() },
}))
describe('identity readiness', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(authApi.me).mockResolvedValue({ id: 7, email: 'test@example.invalid', role: 'USER', createdAt: '2026-11-06T00:00:00Z' })
    vi.mocked(accountsApi.list).mockResolvedValue([])
    vi.mocked(analyticsApi.spending).mockResolvedValue([])
    vi.mocked(notificationsApi.latest).mockResolvedValue([])
  })
  afterEach(() => vi.useRealTimers())
  it('waits for a verified profile before allowing asynchronous projections to catch up', async () => {
    vi.useFakeTimers()
    vi.mocked(accountsApi.list).mockRejectedValueOnce(new ApiError(403, 'FORBIDDEN', 'Pending'))
    const ready = resolveIdentity('synthetic-fixture', new AbortController().signal)
    await vi.advanceTimersByTimeAsync(300)
    expect((await ready).id).toBe(7)
    expect(authApi.me).toHaveBeenCalledOnce()
    expect(accountsApi.list).toHaveBeenCalledTimes(2)
  })
  it('does not retry a denied authoritative profile or attempt account linking', async () => {
    vi.mocked(authApi.me).mockRejectedValue(new ApiError(403, 'FORBIDDEN', 'Denied'))
    await expect(resolveIdentity('synthetic-fixture', new AbortController().signal)).rejects.toMatchObject({ status: 403 })
    expect(accountsApi.list).not.toHaveBeenCalled()
  })
  it('does not mask a broken service as a pending projection', async () => {
    vi.mocked(analyticsApi.spending).mockRejectedValue(new ApiError(500, 'UNAVAILABLE', 'Unavailable'))
    await expect(resolveIdentity('synthetic-fixture', new AbortController().signal)).rejects.toMatchObject({ status: 500 })
    expect(analyticsApi.spending).toHaveBeenCalledOnce()
  })
  it('cancels a pending projection wait on unmount', async () => {
    const controller = new AbortController()
    vi.mocked(accountsApi.list).mockRejectedValue(new ApiError(403, 'FORBIDDEN', 'Pending'))
    const result = resolveIdentity('synthetic-fixture', controller.signal).catch(error => error)
    controller.abort()
    expect(await result).toBeInstanceOf(DOMException)
  })
})
