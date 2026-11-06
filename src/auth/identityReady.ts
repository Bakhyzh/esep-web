import { ApiError } from '../api/client'
import { accountsApi, analyticsApi, authApi, notificationsApi } from '../api/esep'

/** User authority allocates the ID first; projections may follow asynchronously. */
export async function resolveIdentity(token: string, signal: AbortSignal) {
  const bounded = AbortSignal.any([signal, AbortSignal.timeout(30_000)])
  const user = await authApi.me(token, bounded)
  const deadline = Date.now() + 30_000
  for (;;) {
    bounded.throwIfAborted()
    try {
      await Promise.all([
        accountsApi.list(token, bounded),
        analyticsApi.spending(token, { currency: 'KZT' }, 'DAY', bounded),
        notificationsApi.latest(token, 1, bounded),
      ])
      return user
    } catch (error) {
      // Only a newly provisioned, verified User profile may wait for local identity projection.
      if (!(error instanceof ApiError) || error.status !== 403 || Date.now() >= deadline) throw error
      await new Promise<void>((resolve, reject) => {
        const abort = () => { clearTimeout(timer); reject(bounded.reason) }
        const timer = setTimeout(() => { bounded.removeEventListener('abort', abort); resolve() }, 300)
        bounded.addEventListener('abort', abort, { once: true })
        if (bounded.aborted) abort()
      })
    }
  }
}
