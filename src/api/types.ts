// Mirrors the esep-api DTOs. Money arrives as JSON numbers (BigDecimal) and is sent as strings.

export type Role = 'USER' | 'ADMIN'
export type AccountStatus = 'ACTIVE' | 'CLOSED'
export type AccountType = 'USER' | 'SYSTEM'
export type TransactionType = 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL'
export type EntryDirection = 'DEBIT' | 'CREDIT'
export type Period = 'DAY' | 'WEEK' | 'MONTH'

export interface TokenResponse { accessToken: string; tokenType: string; expiresIn: number }
export interface UserResponse { id: number; email: string; role: Role; createdAt: string }

export interface Account {
  id: number
  userId: number
  currency: string
  balance: number
  status: AccountStatus
  type: AccountType
  createdAt: string
  closedAt: string | null
}

export interface TransactionEntry { accountId: number; direction: EntryDirection; amount: number }
export interface Transaction {
  id: number
  type: TransactionType
  status: string
  createdAt: string
  entries: TransactionEntry[]
}

export interface Operation {
  entryId: number
  transactionId: number
  type: TransactionType
  direction: EntryDirection
  amount: number
  currency: string
  accountId: number
  counterpartyAccountId: number | null
  createdAt: string
}

export interface Page<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number }

export interface SpendingPoint { periodStart: string; total: number; operations: number }
export interface TopTransaction { rank: number; transactionId: number; amount: number; toAccountId: number; createdAt: string }
export interface MovingAveragePoint { day: string; total: number; movingAverage: number }
export interface MonthlyComparison {
  month: string
  total: number
  previousTotal: number | null
  change: number | null
  changePercent: number | null
}

export interface Notification { id: number; type: 'TRANSFER_SENT' | 'TRANSFER_RECEIVED'; message: string; createdAt: string }

/** Error body of every failed request (RFC 9457 + stable code). */
export interface ProblemDetail {
  title?: string
  status?: number
  detail?: string
  code?: string
  errors?: { field: string; message: string }[]
}
