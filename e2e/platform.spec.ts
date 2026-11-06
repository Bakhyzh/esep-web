import { test, expect } from '@playwright/test'

// Never retain credentials, bearer traffic or token-bearing browser storage.
test.use({ trace: 'off', screenshot: 'off', video: 'off' })
// Prevent framework failure snapshots from retaining an authentication form.
test.afterEach(async ({ page }) => { await page.close() })
test('real PKCE first login and microservices account, transfer, notification and analytics flow', async ({ page }) => {
  test.skip(!process.env.ESEP_PLATFORM_USERNAME, 'Run with the backend synthetic platform orchestrator')
  test.setTimeout(90_000)
  const gateway = process.env.ESEP_GATEWAY_URL!
  await page.goto('/#/login')
  await page.getByRole('button', { name: 'Continue to sign in' }).click()
  await expect(page).toHaveURL(/localhost:8180/)
  const authorize = new URL(page.url()).searchParams
  expect(authorize.get('response_type')).toBe('code')
  expect(authorize.get('code_challenge_method')).toBe('S256')
  expect(authorize.get('code_challenge')).toBeTruthy()
  await page.locator('#username').fill(process.env.ESEP_PLATFORM_USERNAME!)
  await page.locator('#password').fill(process.env.ESEP_PLATFORM_PASSWORD!)
  const profile = page.waitForResponse(r => r.url() === `${gateway}/api/auth/me` && r.status() === 200)
  await page.locator('#kc-login').click()
  await page.locator('#password-new').fill(process.env.ESEP_PLATFORM_NEW_PASSWORD!)
  await page.locator('#password-confirm').fill(process.env.ESEP_PLATFORM_NEW_PASSWORD!)
  await page.getByRole('button', { name: 'Submit', exact: true }).click()
  const me = await (await profile).json() as { id: number; role: string }
  expect(me.id).toBeGreaterThan(0)
  expect(me.role).toBe('USER')
  await expect(page.getByText('No accounts yet', { exact: true })).toBeVisible({ timeout: 35_000 })
  const created = page.waitForResponse(r => r.url() === `${gateway}/api/accounts` && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Open account', exact: true }).click()
  const response = await created
  expect(response.status()).toBe(201)
  const account = await response.json() as { id: number; userId: number }
  expect(account.userId).toBe(me.id)
  // Synthetic funding is an explicit operator action through Gateway; no SQL bootstrap or User ID claims.
  const deposit = await fetch(`${gateway}/api/deposits`, {
    method: 'POST', headers: {
      Authorization: `Bearer ${process.env.ESEP_PLATFORM_OPERATOR_TOKEN!}`,
      'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID(),
    }, body: JSON.stringify({ accountId: account.id, amount: '100' }),
  })
  expect(deposit.status).toBe(201)
  await page.getByRole('link', { name: 'Transfer', exact: true }).first().click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByLabel('To account number').fill(process.env.ESEP_RECIPIENT_ACCOUNT_ID!)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByLabel('Amount, KZT').fill('12.3456')
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  const transferred = page.waitForResponse(r => r.url() === `${gateway}/api/transfers` && r.request().method() === 'POST')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  expect((await transferred).status()).toBe(201)
  await expect(page.getByRole('heading', { name: 'Transfer completed' })).toBeVisible()
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  // Allow eventual projections to catch up without replacing them with mocks.
  await expect.poll(async () => {
    await page.getByRole('button', { name: 'Notifications', exact: true }).click()
    const message = page.getByRole('region', { name: 'Latest notifications' }).getByText(/12\.3456 KZT/)
    try { await message.waitFor({ state: 'visible', timeout: 1500 }); return 1 }
    catch { await page.getByRole('button', { name: 'Notifications', exact: true }).click(); return 0 }
  }, { timeout: 20_000, intervals: [500, 1000] }).toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Notifications', exact: true }).click()
  await page.getByRole('link', { name: 'Analytics', exact: true }).first().click()
  await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible()
  const spending = page.locator('section[aria-labelledby="spending-title"]')
  await expect.poll(async () => {
    if (await spending.getByText('Show as table', { exact: true }).count()) return true
    await page.getByRole('button', { name: 'Refresh reports', exact: true }).click()
    await page.waitForTimeout(400)
    return false
  }, { timeout: 20_000 }).toBe(true)
  await spending.getByText('Show as table', { exact: true }).click()
  await expect(spending.getByRole('cell', { name: /12[.,]3456/ })).toBeVisible()
  const retained = await page.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]))
  expect(/eyJ[A-Za-z0-9_-]+\./.test(retained)).toBe(false)
  await page.getByRole('button', { name: 'Profile menu' }).click()
  const loggedOut = page.waitForURL(url => url.pathname === '/' && !url.hash)
  await page.getByRole('button', { name: /sign out|log out/i }).click()
  await loggedOut
  await page.goto('/#/login')
  await expect(page.getByRole('button', { name: 'Continue to sign in' })).toBeVisible()
})
