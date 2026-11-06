import { test, expect } from '@playwright/test'

// OIDC tests must not save network traces, screenshots or token-bearing storage.
test.use({ trace: 'off', screenshot: 'off', video: 'off' })
// Prevent framework failure snapshots from retaining an authentication form.
test.afterEach(async ({ page }) => { await page.close() })
test('real Keycloak PKCE login preserves the local owner and logs out', async ({ page }) => {
  test.skip(!process.env.ESEP_OIDC_USERNAME, 'Run through the backend cutover smoke orchestrator')
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Continue to sign in' }).click()
  await expect(page).toHaveURL(/localhost:8180/)
  const params = new URL(page.url()).searchParams
  expect(params.get('response_type')).toBe('code')
  expect(params.get('code_challenge_method')).toBe('S256')
  expect(params.get('code_challenge')).toBeTruthy()
  await page.locator('#username').fill(process.env.ESEP_OIDC_USERNAME!)
  await page.locator('#password').fill(process.env.ESEP_OIDC_PASSWORD!)
  const me = page.waitForResponse(r => r.url().endsWith('/api/auth/me') && r.status() === 200)
  await page.locator('#kc-login').click()
  await page.locator('#password-new').fill(process.env.ESEP_OIDC_NEW_PASSWORD!)
  await page.locator('#password-confirm').fill(process.env.ESEP_OIDC_NEW_PASSWORD!)
  await page.getByRole('button', { name: 'Submit', exact: true }).click()
  expect((await (await me).json()).id).toBe(Number(process.env.ESEP_OIDC_USER_ID))
  await expect(page).toHaveURL(/#\/accounts/)
  const stored = await page.evaluate(() => ({
    local: Object.entries(localStorage), session: Object.entries(sessionStorage),
  }))
  expect(/eyJ[A-Za-z0-9_-]+\./.test(JSON.stringify(stored))).toBe(false)
  expect(stored.local.some(([k]) => k === 'esep.accessToken')).toBe(false)
  // The signed-in dashboard reads the existing account through the real Bearer API.
  await expect(page.getByRole('button', { name: 'Profile menu' })).toBeVisible()
  await page.getByRole('button', { name: 'Profile menu' }).click()
  await page.getByRole('button', { name: /sign out|log out/i }).click()
  await expect(page).toHaveURL(/localhost:5173/)
  await page.goto('/#/login')
  await expect(page.getByRole('button', { name: 'Continue to sign in' })).toBeVisible()
})
