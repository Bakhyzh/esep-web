# Local Gateway integration

The real frontend was audited at a135211 and updated in an isolated worktree.
Existing pages, financial request semantics and the supported keycloak-js client
remain. Production/Pages is not automatically switched.

Use the backend's verified `compose.platform.yaml` and existing local Keycloak:

```sh
cp .env.platform.example .env.local
npm ci
npm run dev -- --host localhost --port 5173 --strictPort
```

The example contains no credentials: Gateway localhost18080, Keycloak8180,
realm esep, exact existing esep-web client callback localhost5173/oidc/callback.
VITE_OIDC_CLIENT_ID is optional for later independently configured edge hosting.
Never put passwords, access tokens or client secrets in VITE variables.

Keycloak uses Authorization Code+PKCE S256, with access/refresh tokens held in
memory. Startup resolves the authoritative profile first, then waits at most30s
for Ledger/Analytics/Notification identity projections. It cannot grant access by
email or supply a new numerical user ID. Permanent profile denial and broken
services show retry/sign-out; cancelled waits do not render stale data.
Each service independently enforces authorization. Analytics exposes refresh for
eventual report updates; no financial calculation moved to Gateway.

Verification on2026-11-06: lint,31 unit tests, TypeScript/Vite build passed. Backend
synthetic orchestrator executed `e2e/platform.spec.ts` against **real** local
Keycloak, Gateway, User, Ledger, Kafka, Notification, Analytics, PostgreSQL and Redis.
Chromium first login/password activation -> automatic identity -> create account
-> operator-funded synthetic top-up -> UI transfer12.3456 -> notification ->
visible exact four-decimal analytics -> memory-only tokens -> logout passed
(5.7s test,6.6s runner). Backend financial invariant SQL passed after the flow.
Browser traces/screenshots/video are disabled; assertions do not print token
contents. Test credentials are process environment only, temporary Keycloak users
are deleted, and synthetic financial/audit data is retained.

The first browser run found a real Gateway CORS-filter configuration defect; the
backend implementation and regression test were corrected. Another run showed
the UI already preserves four decimals, so the test's erroneous two-decimal
expectation was corrected to require12.3456; money formatting was not weakened.

Run integrated E2E from backend with `--gateway-url http://localhost:18080
--frontend-dir ../esep-web-platform`, in addition to the documented service/identity
options. Without synthetic orchestration, the platform browser spec explicitly
skips; that skip does not count as an executed authentication test.

Rollback restores the previous explicit VITE_API_URL/auth deployment configuration.
Only route to the database's actual financial authority; never treat the old
monolith's different dataset as a fallback. A production migration requires separate
approved identity/data reconciliation, TLS/security and operational review.

Backend phase-D report records remote publication/CI. Later edge replicas,
observability, recovery, load testing and production readiness remain separate work.
