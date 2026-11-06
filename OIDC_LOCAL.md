# Local ESEP Keycloak integration

Verified backend: Bakhyzh/esep-api Phase 2.3, prepared `local-keycloak` profile.
This is an explicit local build mode. Public Pages/legacy builds keep their
existing configuration; no production auth switch is performed.

```bash
npm ci
npx playwright install chromium
VITE_AUTH_MODE=keycloak npm run dev -- --host localhost
```

Use http://localhost:5173/#/login. Keycloak URL defaults to http://localhost:8180,
realm esep, public client esep-web. Optional VITE_OIDC_URL/VITE_OIDC_REALM and
VITE_API_URL must refer to a reviewed environment; no client secret belongs in a
browser. Exact callback is http://localhost:5173/oidc/callback and logout returns
to http://localhost:5173/. These match the actual local Keycloak client allowlist.
The Vite dev server serves the callback before HashRouter initialization.

keycloak-js handles standard Authorization Code + PKCE S256 and state/nonce.
It receives credentials only on Keycloak's origin. Access/refresh tokens remain
in adapter memory, never in localStorage; old esep.accessToken is removed when
entering OIDC mode. API calls refresh when needed and send only an access token.
401/refresh errors clear the session without retrying financial writes. Unlinked
identity/ownership 403/404 errors remain explicit API errors; no email linking.
The existing /api/auth/me resolves the original numeric ESEP user ID.

Existing users require operator-approved issuer/subject mappings and activation,
not a matching email. Self registration is disabled in the prepared realm; contact
the operator. Required UPDATE_PASSWORD actions are completed on Keycloak before
the code callback. No ESEP login/register form or demo password is shown in OIDC mode.

Run `npm run check` and `VITE_AUTH_MODE=keycloak npm run build`.
The real browser test is orchestrated by the backend
`infrastructure/keycloak/cutover-smoke.py --identity-dir ... --frontend-dir ...`.
It creates random short-lived test identities, checks PKCE, activation, /me user
ID, in-memory token policy and logout. Tests save no traces/screenshots/video.
Never save browser storage state, HAR, tokens or credentials in CI artifacts.

Production requires separate HTTPS issuer/client origins, deployment approval,
activation delivery and a reviewed hosting callback strategy. The root-path local
OIDC build is not a drop-in GitHub Pages production rollout. Logout/role revocation
cannot invalidate an already issued stateless API JWT immediately; backend TTL is
300 seconds plus its 60-second clock skew. Re-entering the old build is a controlled
rollback only for users with retained legacy credentials; NULL-password Keycloak
profiles require Keycloak or a forward fix.

Official adapter reference: https://www.keycloak.org/securing-apps/javascript-adapter
