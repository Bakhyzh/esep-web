# Edge-hosted local frontend

The independent frontend image builds with Node24 and runs pinned nginx1.30.6 as
its unprivileged nginx user on internal8080, with readiness and graceful SIGQUIT.
No credentials are compiled. Public development URLs are localhost18081 for the
edge and localhost8180 for Keycloak; client esep-platform-web has the exact
localhost18081/oidc/callback, exact origin and PKCE S256. The original5173 client
is unchanged. See `.env.edge.example`; do not put passwords or tokens there.

The backend unified `compose.platform.yaml` builds this checkout through explicit
PLATFORM_FRONTEND_CONTEXT, serves it behind its Nginx edge, and routes `/api/`
through two independently running Gateways. No frontend financial logic changed.
The edge enforces CSP and request limits; browser tokens remain in memory. This
is an isolated HTTP localhost environment, not a public HTTPS deployment.

Actual verification2026-11-06: image build on Apple Silicon, nginx config validation
under non-root UID, lint/31 unit tests/TypeScript/Vite build, and the real platform
Chromium E2E passed behind Nginx after Gateway/Ledger replica fault recovery.
PKCE activation, automatic identity, account, precise transfer12.3456,
Notification, Analytics and logout all worked (29.4s test /30.6s runner).

Backend observed both Gateway and both Ledger instances via non-sensitive server
labels. Killing Gateway during50 reads returned50 HTTP200s. Killing one Ledger
during40 concurrent requests for8 keys produced8 created,26 replay and6 transient
500s; retrying original keys settled8 logical transfers exactly once. Exact
conservation and double-entry SQL passed. These are actual local observations,
not a zero-error or multi-host availability guarantee.

A pre-existing Java listener on IPv6 localhost8080 was preserved; the isolated edge
uses18081 to avoid it. The OIDC client we had just created and not used was moved
to18081 after checking zero sessions. No original client/user/financial data changed.
Public Pages remains manually gated; this work does not deploy it.
