import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // unit tests only; e2e/ is run by Playwright (npm run e2e)
    include: ['src/**/*.test.ts'],
  },
})
