import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App.tsx'
import { initializeOidc, oidcEnabled } from './auth/oidc'
import { OidcAuthProvider } from './auth/OidcAuthProvider'
import { AuthProvider } from './auth/AuthProvider.tsx'
// latin subset only: the UI is in English, other glyphs (e.g. ₸) fall back to system-ui
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-500.css'
import '@fontsource/poppins/latin-600.css'
import '@fontsource/poppins/latin-800.css'
import './index.css'

// animations off on demand (demos, e2e, screenshots): ?motion=off or localStorage esep.motion=off
try {
  if (new URLSearchParams(location.search).get('motion') === 'off' || localStorage.getItem('esep.motion') === 'off') {
    document.documentElement.classList.add('no-motion')
  }
} catch {
  // storage may be unavailable
}

let oidcReady = true
if (oidcEnabled) {
  try { await initializeOidc() } catch { oidcReady = false }
}
const SelectedAuthProvider = oidcEnabled ? OidcAuthProvider : AuthProvider

createRoot(document.getElementById('root')!).render(
  oidcReady ? <StrictMode>
    {/* HashRouter (#/accounts): GitHub Pages has no SPA fallback, so a refresh on /esep-web/accounts would be a 404 */}
    <HashRouter>
      <SelectedAuthProvider>
        <App />
      </SelectedAuthProvider>
    </HashRouter>
  </StrictMode> : <main role="alert">
    <p>Cannot connect to sign in. Please try again.</p>
    <button onClick={() => location.reload()}>Retry</button>
  </main>,
)
