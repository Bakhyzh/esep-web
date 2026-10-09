import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end smoke test against a running stack:
 *   esep-api:  docker compose up        (API on VITE_API_URL / E2E_API_URL)
 *   esep-web:  npm run dev              (UI on http://localhost:5173)
 *   then:      npm run e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    // charts skip their entry animation, so assertions and screenshots see final values
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
