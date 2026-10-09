import { ApiError } from '../api/client'

/** Human messages per backend error code; the UI never parses the backend's English "detail" text. */
const MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Cannot reach the server. Check your connection or that the API is running.',
  INVALID_CREDENTIALS: 'Wrong email or password.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: 'You do not have permission to do this.',
  EMAIL_ALREADY_REGISTERED: 'This email is already registered. Try signing in.',
  DUPLICATE_ACCOUNT: 'You already have an active account in this currency.',
  INSUFFICIENT_FUNDS: 'Not enough money on the account.',
  ACCOUNT_CLOSED: 'This account is closed.',
  ACCOUNT_NOT_EMPTY: 'Only an account with a zero balance can be closed.',
  SAME_ACCOUNT_TRANSFER: 'Choose a different recipient account.',
  CURRENCY_MISMATCH: 'Both accounts must be in the same currency.',
  UNSUPPORTED_CURRENCY: 'This currency is not supported.',
  SYSTEM_ACCOUNT_OPERATION: 'This account cannot be used for transfers.',
  INVALID_AMOUNT: 'Enter a positive amount with up to 4 decimals.',
  IDEMPOTENCY_KEY_REUSED: 'This request conflicts with an earlier one. Please start a new transfer.',
  CONCURRENT_MODIFICATION: 'The account was busy. Please try again.',
  RESOURCE_NOT_FOUND: 'Not found. Check the account number.',
  VALIDATION_FAILED: 'Please fix the highlighted fields.',
  INTERNAL_ERROR: 'Something went wrong on the server. Please try again.',
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return MESSAGES[error.code] ?? error.message
  }
  return 'Unexpected error. Please try again.'
}
