import { expect, test, type Page } from '@playwright/test'

const API = process.env.E2E_API_URL ?? 'http://localhost:8081'
const SHOTS = process.env.E2E_SCREENSHOTS ? 'docs/screenshots' : null
const PASSWORD = 'password123'

async function shot(page: Page, name: string) {
  if (SHOTS) {
    await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true })
  }
}

async function apiLogin(email: string): Promise<string> {
  const response = await fetch(`${API}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }),
  })
  return ((await response.json()) as { accessToken: string }).accessToken
}

async function bobsKztAccount(): Promise<number> {
  const token = await apiLogin('bob@esep.dev')
  const accounts = (await (await fetch(`${API}/api/accounts`, { headers: { Authorization: `Bearer ${token}` } })).json()) as
    { id: number; currency: string; status: string }[]
  const kzt = accounts.find(a => a.currency === 'KZT' && a.status === 'ACTIVE')
  if (kzt) return kzt.id
  const created = await fetch(`${API}/api/accounts`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ currency: 'KZT' }),
  })
  return ((await created.json()) as { id: number }).id
}

async function adminDeposit(accountId: number, amount: string) {
  const token = await apiLogin('admin@esep.dev')
  const response = await fetch(`${API}/api/deposits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify({ accountId, amount }),
  })
  expect(response.status).toBe(201)
}

test('a new user registers, receives money, transfers it and sees history and analytics', async ({ page }) => {
  const email = `e2e-${Date.now()}@esep.dev`
  const recipient = await bobsKztAccount()

  // register -> login
  await page.goto('/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Repeat password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByText('Account created. You can sign in now.')).toBeVisible()
  await shot(page, '01-login')
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()

  // open an account
  await expect(page.getByRole('heading', { name: 'Accounts', exact: true })).toBeVisible()
  await expect(page.getByText('No accounts yet')).toBeVisible()
  await page.getByRole('button', { name: 'Open account' }).click()
  const card = page.locator('article.account').first()
  await expect(card).toContainText('KZT')
  const accountId = Number((await card.locator('.meta span').first().textContent())!.replace(/\D/g, ''))

  // money arrives (admin deposit through the API), the page shows it after a refresh
  await adminDeposit(accountId, '500')
  await page.getByRole('button', { name: 'Refresh' }).first().click()
  await expect(card.locator('.balance')).toContainText('500')
  await shot(page, '02-accounts')

  // transfer
  await page.getByRole('link', { name: 'Transfer', exact: true }).click()
  await page.getByLabel('To account number').fill(String(recipient))
  await page.getByLabel(/Amount/).fill('120.5')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText('Transfer completed')).toBeVisible()
  await shot(page, '03-transfer')

  // business error is shown in plain words
  await page.getByLabel('To account number').fill(String(recipient))
  await page.getByLabel(/Amount/).fill('99999')
  await page.getByRole('button', { name: 'Send' }).click()
  await expect(page.getByText('Not enough money on the account.')).toBeVisible()

  // history: newest first, filters
  await page.getByRole('link', { name: 'History' }).click()
  const rows = page.locator('tbody tr')
  await expect(rows).toHaveCount(2)
  await expect(rows.first()).toContainText('outgoing')
  await expect(rows.first()).toContainText('120.5')
  await expect(rows.nth(1)).toContainText('Top-up')
  await shot(page, '04-history')

  // analytics: the transfer is counted, charts are rendered
  await page.getByRole('link', { name: 'Analytics' }).click()
  await expect(page.locator('.stat').first()).toContainText('120.5')
  await expect(page.locator('.chart svg').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Largest transfers' })).toBeVisible()
  await shot(page, '05-analytics')

  // dark mode: chart colors are re-read from the dark design tokens
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('.chart svg').first()).toBeVisible()
  await shot(page, '06-analytics-dark')
})

test('an expired token sends the user back to the login page with an explanation', async ({ page }) => {
  const base64url = (value: string) => Buffer.from(value).toString('base64url')
  const expired = `${base64url('{"alg":"HS256"}')}.${base64url(JSON.stringify({ sub: '1', exp: 1 }))}.x`
  await page.goto('/login')
  await page.evaluate(token => localStorage.setItem('esep.accessToken', token), expired)

  await page.goto('/history')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Your session has expired. Please sign in again.')).toBeVisible()
})

test('a token rejected by the server (401) also ends the session', async ({ page }) => {
  const base64url = (value: string) => Buffer.from(value).toString('base64url')
  const forged = `${base64url('{"alg":"HS256"}')}.${base64url(JSON.stringify({ sub: '1', role: 'USER', exp: 4_000_000_000 }))}.forged`
  await page.goto('/login')
  await page.evaluate(token => localStorage.setItem('esep.accessToken', token), forged)

  await page.goto('/accounts')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Your session has expired. Please sign in again.')).toBeVisible()
})
