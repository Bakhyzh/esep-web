/**
 * Reads the expiry of a JWT. The signature is NOT verified here - only the server can do that;
 * the client only needs to know when to stop using the token.
 */
export function tokenExpiresAt(token: string): number | null {
  const payload = token.split('.')[1]
  if (!payload) {
    return null
  }
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '='))
    const exp = (JSON.parse(json) as { exp?: unknown }).exp
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

export function isExpired(token: string, now = Date.now()): boolean {
  const expiresAt = tokenExpiresAt(token)
  return expiresAt === null || expiresAt <= now
}
