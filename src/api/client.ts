import type { ProblemDetail } from './types'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8081').replace(/\/$/, '')

/** A failed API call. `code` is the backend's stable error code, or NETWORK_ERROR / UNKNOWN. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: Record<string, string>

  constructor(status: number, code: string, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }

  /** Worth retrying with the SAME idempotency key: the server may or may not have done the work. */
  get isRetryable(): boolean {
    return this.status === 0 || this.status >= 500 || this.code === 'CONCURRENT_MODIFICATION'
  }
}

export function toApiError(status: number, body: ProblemDetail | null): ApiError {
  const fieldErrors: Record<string, string> = {}
  for (const error of body?.errors ?? []) {
    fieldErrors[error.field] ??= error.message   // first message per field is enough for a form
  }
  return new ApiError(status, body?.code ?? 'UNKNOWN', body?.detail ?? body?.title ?? `HTTP ${status}`, fieldErrors)
}

let unauthorizedHandler: (() => void) | null = null

/** The auth layer registers a callback: any 401 on an authenticated request means the session is over. */
export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export interface RequestOptions {
  method?: 'GET' | 'POST'
  token?: string | null
  body?: unknown
  query?: Record<string, string | number | undefined | null>
  headers?: Record<string, string>
  signal?: AbortSignal
}

export interface ApiResponse<T> { data: T; status: number; headers: Headers }

export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const url = new URL(API_URL + path)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server')
  }

  const text = await response.text()
  const json = text ? safeParse(text) : null
  if (!response.ok) {
    if (response.status === 401 && options.token) {
      unauthorizedHandler?.()
    }
    throw toApiError(response.status, json as ProblemDetail | null)
  }
  return { data: json as T, status: response.status, headers: response.headers }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
