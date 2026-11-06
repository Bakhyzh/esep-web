import Keycloak from 'keycloak-js'

export const oidcEnabled = import.meta.env.VITE_AUTH_MODE === 'keycloak'
export const keycloak = new Keycloak({
  url: import.meta.env.VITE_OIDC_URL ?? 'http://localhost:8180',
  realm: import.meta.env.VITE_OIDC_REALM ?? 'esep',
  clientId: 'esep-web',
})

export async function initializeOidc() {
  // Remove credentials left by the legacy client, never copy them to an OIDC session.
  try { localStorage.removeItem('esep.accessToken') } catch { /* Storage may be disabled. */ }
  await keycloak.init({
    onLoad: 'check-sso', flow: 'standard', pkceMethod: 'S256', responseMode: 'query',
    redirectUri: `${location.origin}/oidc/callback`, checkLoginIframe: false,
  })
  if (location.pathname === '/oidc/callback') {
    history.replaceState(null, '', `/${keycloak.authenticated ? '#/accounts' : '#/login'}`)
  }
}
