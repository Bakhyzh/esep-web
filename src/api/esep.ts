import { request } from './client'
import type {
  Account, MonthlyComparison, MovingAveragePoint, Notification, Operation, Page, Period,
  SpendingPoint, TokenResponse, TopTransaction, Transaction, UserResponse,
} from './types'

/** Region time zone of the browser (e.g. "Asia/Almaty"): the backend computes day boundaries in it. */
export const BROWSER_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

export const authApi = {
  login: (email: string, password: string) =>
    request<TokenResponse>('/api/auth/login', { method: 'POST', body: { email, password } }).then(r => r.data),
  register: (email: string, password: string) =>
    request<UserResponse>('/api/auth/register', { method: 'POST', body: { email, password } }).then(r => r.data),
  me: (token: string) => request<UserResponse>('/api/auth/me', { token }).then(r => r.data),
}

export const accountsApi = {
  list: (token: string) => request<Account[]>('/api/accounts', { token }).then(r => r.data),
  create: (token: string, currency: string) =>
    request<Account>('/api/accounts', { method: 'POST', token, body: { currency } }).then(r => r.data),
  close: (token: string, id: number) =>
    request<Account>(`/api/accounts/${id}/close`, { method: 'POST', token }).then(r => r.data),
}

export interface TransferResult { transaction: Transaction; replayed: boolean }

export const transfersApi = {
  /** amount is a decimal string: money never goes through a JS float on the way to the server. */
  transfer: async (token: string, idempotencyKey: string, fromAccountId: number, toAccountId: number,
                   amount: string): Promise<TransferResult> => {
    const response = await request<Transaction>('/api/transfers', {
      method: 'POST',
      token,
      headers: { 'Idempotency-Key': idempotencyKey },
      body: { fromAccountId, toAccountId, amount },
    })
    return { transaction: response.data, replayed: response.headers.get('Idempotent-Replayed') === 'true' }
  },
}

export interface HistoryQuery { accountId?: number; from?: string; to?: string; page: number; size: number }

export const historyApi = {
  list: (token: string, q: HistoryQuery, signal?: AbortSignal) =>
    request<Page<Operation>>('/api/transactions', {
      token, signal, query: { ...q, zone: BROWSER_ZONE },
    }).then(r => r.data),
}

export interface ReportQuery { currency: string; from?: string; to?: string }

export const analyticsApi = {
  spending: (token: string, q: ReportQuery, period: Period, signal?: AbortSignal) =>
    request<SpendingPoint[]>('/api/analytics/spending', { token, signal, query: { ...q, period, zone: BROWSER_ZONE } })
      .then(r => r.data),
  top: (token: string, q: ReportQuery, limit: number, signal?: AbortSignal) =>
    request<TopTransaction[]>('/api/analytics/top-transactions', { token, signal, query: { ...q, limit, zone: BROWSER_ZONE } })
      .then(r => r.data),
  movingAverage: (token: string, q: ReportQuery, window: number, signal?: AbortSignal) =>
    request<MovingAveragePoint[]>('/api/analytics/moving-average', { token, signal, query: { ...q, window, zone: BROWSER_ZONE } })
      .then(r => r.data),
  monthly: (token: string, currency: string, months: number, signal?: AbortSignal) =>
    request<MonthlyComparison[]>('/api/analytics/monthly-comparison', { token, signal, query: { currency, months, zone: BROWSER_ZONE } })
      .then(r => r.data),
}

export const notificationsApi = {
  latest: (token: string, limit = 5) =>
    request<Notification[]>('/api/notifications', { token, query: { limit } }).then(r => r.data),
}
