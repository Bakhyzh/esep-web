import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages serves the build from https://<user>.github.io/esep-web/; the dev server stays at /
  base: command === 'build' ? '/esep-web/' : '/',
  plugins: [react()],
  test: {
    // unit tests only; e2e/ is run by Playwright (npm run e2e)
    include: ['src/**/*.test.ts'],
  },
}))
