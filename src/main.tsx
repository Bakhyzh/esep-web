import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import App from './App.tsx'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter (#/accounts): GitHub Pages has no SPA fallback, so a refresh on /esep-web/accounts would be a 404 */}
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
