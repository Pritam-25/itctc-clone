# API Gateway + Traefik + Distributed Tracing — Implementation Plan

> **TL;DR.** Introduce a single `apps/api-gateway` (Express) as the only public entry point, with Traefik in front of it as the TLS / virtual-host edge. The gateway owns: JWT verification, Redis-backed rate limiting, request/response logging, W3C-traceparent trace start, timeouts, and per-upstream circuit breaking. It does **not** own Kafka, business authorization, request aggregation, health aggregation, or domain logic. Five new shared packages land alongside the gateway: `@irctc/telemetry`, `@irctc/resilience` (hand-rolled CLOSED/OPEN/HALF_OPEN circuit breaker), `@irctc/ratelimit` (token bucket over Redis), `@irctc/idempotency` (three-phase pattern), and `@irctc/service-identity` (V1 allow-all placeholder for V2 mTLS). Existing services gain a one-line `startTelemetry()` call and a dep-free `@irctc/auth-headers` reader; their `authMiddleware` stays in place for now and is migrated in a follow-up PR. Per-service Dockerfiles plus a `traefik` service land in the existing `docker-compose.yml`; per-service apps drop their host `ports:` mappings in favour of `expose:`, which is the trust anchor for the Edge Auth pattern.

## Context

The IRCTC-clone monorepo (Turborepo + pnpm) currently has three services (`user-service`, `notification-service`, `order-service`) that all bind their HTTP ports (4001, 4002, …) directly on the host. There is **no `apps/api-gateway`** directory today — the "API Gateway" node in the knowledge graph is just a concept in `README.md`. Every service is publicly reachable, every service runs `cors`/`helmet` itself, and JWT auth lives in `apps/user-service/src/middleware/auth.middleware.ts` and is imported by routes inside that same service. Rate limiting, distributed tracing, and Kafka-to-HTTP trace continuity are not implemented.

This plan introduces a single `apps/api-gateway` Node/Express service that becomes the **only** public entry point, with Traefik sitting in front of it as the TLS + virtual-host edge. The gateway takes ownership of authentication and injects trusted identity headers that downstream services consume without re-verifying tokens. The plan also wires OpenTelemetry end-to-end (HTTP + Kafka), adds Redis-backed rate limiting, and replaces the host-only `pnpm dev` workflow with per-service Dockerfiles inside the existing `docker-compose.yml`.

**Decisions locked in by the user:**

1. **Auth model** — Edge Auth Pattern: gateway verifies JWT, downstream services **trust** `X-User-*` headers.
2. **Rate limit store** — Redis (uses the existing `irctc-redis` container).
3. **Tracing stack** — OpenTelemetry SDK + OTLP exporter; W3C `traceparent` across HTTP, custom headers across Kafka.
4. **Containerisation** — One Dockerfile per service; Traefik + all services in `docker-compose.yml`.

**Responsibility split (single source of truth — the "Thin Policy Gateway" rule):**

The gateway's job is _controlling and observing traffic_. Anything that knows the domain — Kafka topics, business authorization rules, request aggregation, what makes a "booking valid" — does not belong in the gateway. If the gateway can answer the question without knowing what `/bookings` does, it's a gateway concern. If it can't, it isn't.

| Concern                                  | Gateway                                | Microservices                         | Shared pkgs        | Infra                              |
| ---------------------------------------- | -------------------------------------- | ------------------------------------- | ------------------ | ---------------------------------- |
| Routing (path → upstream)                | ✅ only                                | –                                     | –                  | Traefik: TLS + host → gateway only |
| Authentication (JWT verify)              | ✅ only                                | – (read `X-User-*` only)              | –                  | –                                  |
| Authorization                            | coarse only (token valid, not blocked) | ✅ fine-grained (domain rules)        | –                  | –                                  |
| Rate limiting (enforce + Redis store)    | ✅ only                                | –                                     | –                  | Redis                              |
| Timeouts (per-upstream)                  | ✅ only                                | ✅ own internal timeouts              | –                  | –                                  |
| Circuit breaker (per-upstream)           | ✅ only                                | ✅ own internal                       | –                  | –                                  |
| Request context (requestId, traceparent) | ✅ start + inject on egress            | ✅ continue (auto-instrumented)       | `@irctc/telemetry` | –                                  |
| Access logging (traffic)                 | ✅ only                                | – (business logs only)                | `@irctc/logger`    | –                                  |
| Kafka                                    | ❌ never                               | ✅ only                               | `@irctc/kafka`     | Kafka                              |
| Domain events (publish/consume)          | ❌ never                               | ✅ only                               | –                  | –                                  |
| Business rules, validation               | ❌ never                               | ✅ only                               | –                  | –                                  |
| Request aggregation (BFF)                | ❌ never                               | – (or a BFF service, not the gateway) | –                  | –                                  |
| Health aggregation of upstreams          | ❌ never                               | each owns its own `/health/ready`     | –                  | Docker healthcheck / K8s probe     |
| Service-to-service auth                  | ❌ in this PR                          | ❌ in this PR (private network only)  | –                  | mTLS later                         |

**Gateway's forbidden list (the "Smart Gateway Anti-Pattern" guard rails):**

1. **No Kafka awareness.** The gateway must not import `@irctc/kafka`, must not know topic names, must not publish events, must not consume events. Kafka is async; the gateway is sync HTTP. They do not meet.
2. **No health aggregation of upstreams.** The gateway does not `fetch('/health/ready', 'http://user-service')` and roll it up. Each service owns its own `/health/ready`; Docker / K8s probes each one independently. The gateway's own `/health/ready` checks _itself_ (Redis for the rate limiter, OTel exporter health) — nothing more.
3. **No business authorization.** "Can this user cancel _this_ booking?" belongs in booking-service. The gateway checks "is this user authenticated?" — that is the entire authorization surface.
4. **No request aggregation.** The gateway never calls multiple services in parallel to assemble a response. That's a BFF, and a BFF is a separate service. If we need one later, it's `apps/bff-web` (or similar), not the gateway.
5. **No service-specific policy.** "Premium users get 200 req/min" is policy. If it's user-tier-aware, it lives in user-service (which knows the tier) and is signalled to the gateway through a tier claim on the token. The gateway enforces the _number_; the service decides the _tier_.

**Rule of thumb:** if a concern answers a question about _the request_ (where it goes, who sent it, how fast, did it succeed), it belongs in the gateway. If it answers a question about _the domain_ (was this booking valid, was the OTP consumed, which seat was assigned), it belongs in the service. Tracing is the one exception: it's a cross-cutting concern, so it lives in a shared package, but the gateway owns the _start_ of each trace.

The intended outcome: every external request hits Traefik → gateway → downstream service, traces from a user click all the way into a Kafka consumer (started by the gateway, continued by services), every service has bounded `/health/ready` probes, and no service is reachable from outside the Docker network.

---

## Architecture at a glance

```
                              ┌───────────────────────┐
        Browser / Mobile      │  Traefik (edge proxy) │
        ──────────────────▶   │ • TLS termination     │
                              │  • Host routing       │
                              │  • Rate limit (opt.)  │
                              └───────────┬───────────┘
                                          │ :3000
                                          ▼
                              ┌───────────────────────┐
                              │  apps/api-gateway     │
                              │  • JWT verify         │
                              │  • Inject X-User-*    │
                              │  • Rate limit (Redis) │
                              │  • OTel HTTP export   │
                              └─────┬──────┬──────┬───┘
                                    │      │      │  (private Docker network
                                    ▼      ▼      ▼   — services have no
                              user-    notif-  order-  public port)
                              service  service service
                                    │      │
                                    ▼      ▼
                                Postgres  Kafka
                                  │
                                  ▼
                                 Redis
```

Network isolation (`internal: true` on per-service networks or no `ports:` mapping except for the gateway) is the trust anchor for Option 2.

---

## Phase 0 — New shared packages

Five new packages so the same primitives are reusable across every service (gateway, user, notification, order, and the future booking / payment / search / inventory services). All of them are tiny, single-purpose, and dep-light.

### 0a. `@irctc/telemetry`

**Path:** `packages/telemetry/`

- `packages/telemetry/package.json` — name `@irctc/telemetry`, deps: `@opentelemetry/api`, `@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`, `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/resources`, `@opentelemetry/semantic-conventions`, `@opentelemetry/instrumentation-http`, `@opentelemetry/instrumentation-express`, `@opentelemetry/instrumentation-ioredis`, `@opentelemetry/instrumentation-kafkajs`.
- `packages/telemetry/src/index.ts` — `startTelemetry({ serviceName, otlpEndpoint })` initialises `NodeSDK`, sets resource attributes (`service.name`, `service.version`, `deployment.environment`), registers auto-instrumentations, and registers `shutdownTelemetry()` for graceful exit.
- `packages/telemetry/src/propagation.ts` — `extractTraceContextFromKafkaHeaders(headers) → Context`. (No producer-side helper — the default W3C text-map propagator writes `traceparent` automatically as part of the `kafkajs` publish span.)
- `packages/telemetry/tsconfig.json` (extends `@repo/typescript-config/base.json`).

**Reuse:** `@opentelemetry/api` is already a transitive dep of `@irctc/logger` (`packages/logger/src/logger.ts` uses `context` + `trace` from it). The logger's `mixin()` already pulls `traceId` + `spanId` from the active span — once `startTelemetry()` has been called once at boot, that mixin lights up automatically.

### 0b. `@irctc/resilience` — custom circuit breaker (V1, hand-rolled)

**Path:** `packages/resilience/`

- `packages/resilience/package.json` — name `@irctc/resilience`, deps: `ioredis` (for the optional shared-state store, even though V1 uses in-process state). Zero other runtime deps.
- `packages/resilience/src/circuit-breaker/CircuitBreaker.ts` — class with the three states (`CLOSED`, `OPEN`, `HALF_OPEN`) and an `execute<T>(fn: () => Promise<T>): Promise<T>` API. Internally a small `CircuitBreakerState` holds `{ state, failureCount, successCount, lastFailureTime, openedAt }`. Public surface is just `execute()` + `getState()`.
- `packages/resilience/src/circuit-breaker/types.ts` — `CircuitBreakerOptions = { name: string; failureThreshold: number; recoveryTimeoutMs: number; halfOpenMaxTrials: number; timeoutMs?: number }`. Defaults: `failureThreshold = 5`, `recoveryTimeoutMs = 30_000`, `halfOpenMaxTrials = 1`, `timeoutMs = 5_000`.
- `packages/resilience/src/circuit-breaker/CircuitBreakerRegistry.ts` — `get(name: string, opts?): CircuitBreaker` returns a singleton per name. The gateway calls `registry.get('user-service')`, `registry.get('booking-service')`, etc.
- `packages/resilience/src/retry/ExponentialBackoff.ts` — `withExponentialBackoff(fn, { initialMs, maxMs, retries })`. Reusable by any service.
- `packages/resilience/src/timeout/withTimeout.ts` — `withTimeout(promise, ms, label)`. Pairs with the breaker's optional `timeoutMs`.
- `packages/resilience/src/index.ts` — barrel re-exports.

**Algorithm — the exact state machine the whiteboard question tests for:**

```
CLOSED
  request → call service
            success → reset failureCount
            failure → failureCount++
            failureCount >= threshold → OPEN, stamp openedAt
OPEN
  request → fail fast (no network call), throw CircuitOpenError
  now - openedAt >= recoveryTimeoutMs → HALF_OPEN, allow next request
HALF_OPEN
  allow up to halfOpenMaxTrials concurrent probes
  any success → CLOSED
  any failure → OPEN, restamp openedAt
```

The two invariants the implementation must hold:

1. **OPEN never makes a network call.** That's the entire point — fail fast instead of piling up 5-second timeouts behind a dead upstream.
2. **The clock that matters is `openedAt + recoveryTimeoutMs`, not the failure count.** A service that hit threshold at 10:00:00 and recovered by 10:00:30 must get a chance to prove it.

The two pieces people miss when writing this from scratch:

- **Timeout inside `execute`**: `Promise.race([fn(), timeoutPromise])` so a slow upstream counts as a failure (otherwise the breaker is useless against hangs).
- **Concurrent trial cap in HALF_OPEN**: `inFlightProbes < halfOpenMaxTrials` before the call, so 1000 in-flight requests don't all slam the upstream that just came back.

**Deliberately NOT in V1** (this is where you stop):

- Sliding windows / last-N-statistics / failure-percent
- Adaptive thresholds (trip on p95 latency, not just count)
- Distributed state across replicas (no Redis-shared breaker) — single-process is correct for V1
- Dynamic config (change thresholds without restart)
- Service-mesh integration (Istio / Linkerd / Envoy)

Each of these is a real production feature and its own follow-up PR; the registry is the only file that grows.

**Where it gets used:** gateway-side, per upstream. Each upstream (`user-service`, `notification-service`, `order-service`, future `booking-service`, `payment-service`) gets its own breaker. Services do **not** put circuit breakers around Kafka — Kafka's retry budget + DLQ + the existing `IdempotencyRepository` is the right pattern for async, and adding a breaker on top would just hide the real failure mode.

### 0c. `@irctc/ratelimit` — token bucket over Redis (Lua-atomic)

**Path:** `packages/ratelimit/`

Fixed-window was the previous draft's algorithm. The boundary case — `00:00:59` 100 requests + `00:01:00` 100 requests = 200 in 1s — is a real footgun for booking spikes. Token bucket is the right shape.

- `packages/ratelimit/package.json` — name `@irctc/ratelimit`, deps: `ioredis`.
- `packages/ratelimit/src/token-bucket/TokenBucketRateLimiter.ts` — `class TokenBucketRateLimiter` with `consume(key: string, opts: { capacity: number; refillPerSec: number }): Promise<{ allowed: boolean; remaining: number; resetMs: number }>`.
- `packages/ratelimit/src/token-bucket/lua/increment-token.lua` — atomic Redis Lua: read `tokens`, `lastRefill`; compute elapsed seconds, refill (capped at `capacity`); if `tokens >= 1` decrement and allow; else deny with retry-after. Single round-trip, race-free.
- `packages/ratelimit/src/express/rateLimitMiddleware.ts` — `createRateLimitMiddleware({ limiter, keyFn, capacity, refillPerSec, onLimit })` returns an Express middleware. `keyFn` is `(req) => userId ?? ip` so authenticated users get per-user buckets and unauthenticated users get per-IP.
- `packages/ratelimit/src/index.ts` — barrel re-exports.

**Two presets from gateway env:**

| Preset    | Capacity | Refill    | Used by                                     |
| --------- | -------- | --------- | ------------------------------------------- |
| `default` | 100      | 100 / 60s | every other route                           |
| `auth`    | 10       | 10 / 60s  | `/api/v1/auth/*` (login, send-otp, refresh) |

The bucket is per `userId ?? ip`, so a single user can't drain the global budget. A future tier claim on the JWT (e.g. `tier: 'premium'`) can be matched to a different preset — the service decides the tier, the gateway enforces the number.

### 0d. `@irctc/idempotency` — three-phase Redis pattern

**Path:** `packages/idempotency/`

Booking and payment will need this immediately, and the existing `IdempotencyRepository` in `apps/notification-service/src/repositories/idempotency.repository.ts` is the canonical reference. Promoting it to a shared package prevents booking-service from copying it.

- `packages/idempotency/package.json` — name `@irctc/idempotency`, deps: `ioredis`, `zod`.
- `packages/idempotency/src/types.ts` — `IdempotencyKey`, `IdempotencyOutcome = 'NEW' | 'IN_FLIGHT' | 'COMPLETED'`, `reserveIfNew`, `markProcessed`, `release`.
- `packages/idempotency/src/RedisIdempotencyStore.ts` — three-phase Redis pattern: `RESERVED` (short lease TTL, e.g. 5 min) → `PROCESSED` (long TTL, e.g. 7 days) → optional explicit `release` on failure. Mirrors the notification service's `IdempotencyRepository` API exactly so the existing `notification-service` consumer can be ported onto this package as a follow-up.
- `packages/idempotency/src/express/idempotencyMiddleware.ts` — `createIdempotencyMiddleware({ store, keyHeader = 'Idempotency-Key', required = false })`. Reads `Idempotency-Key` from the request, calls `reserveIfNew`, returns 409 on conflict, 200/201 on completion.
- `packages/idempotency/src/index.ts` — barrel re-exports.

**In V1 this is exported but not yet wired into the gateway.** The gateway sees idempotency in two places only: (a) `POST /payments/*` and `POST /bookings/*` later, (b) Kafka consumer side-effect dedup (which `notification-service` already does). Don't apply it to GETs.

### 0e. `@irctc/service-identity` — V1 placeholder, V2 mTLS

**Path:** `packages/service-identity/`

A `ServiceIdentityVerifier` interface and a V1 "allow-all" implementation. The gateway calls it before the proxy hop. When V2 lands (mTLS or signed service tokens), the implementation is swapped, the call site doesn't change.

- `packages/service-identity/package.json` — name `@irctc/service-identity`, no runtime deps.
- `packages/service-identity/src/types.ts` — `interface ServiceIdentityVerifier { verify(headers: IncomingHttpHeaders): Promise<ServiceIdentityResult>; }` and `type ServiceIdentityResult = { ok: true; serviceId: string } | { ok: false; reason: string }`.
- `packages/service-identity/src/AllowAllServiceIdentityVerifier.ts` — V1 implementation. Logs the call and returns `{ ok: true, serviceId: 'unknown' }`. Intentionally boring; the _interface_ is what matters today.
- `packages/service-identity/src/index.ts` — barrel re-export.

**Why a placeholder, not a stub.** A stub says "we'll figure it out later"; an interface with a named V1 implementation says "we know the shape, the implementation is intentionally permissive for now." V2 work is a single file change.

### 0f. Reuse note for all five packages

- `pnpm-workspace.yaml` already globs `packages/*` — no edit needed.
- `packages/logger` is the only existing package these new ones need to be careful about: do **not** import `@irctc/logger` from `@irctc/resilience` / `@irctc/ratelimit` / `@irctc/idempotency`. Pass a `LoggerLike` (the same shape `packages/kafka/src/consumer-runner/...` already accepts — `info / warn / error` with a record-object + message) via the constructor. This keeps the new packages dep-light and side-effect free.

---

## Phase 1 — Auth lives in the gateway only

Under the Edge Auth pattern, JWT verification belongs to **one** place: the gateway. The previous draft had it as a shared `@irctc/middleware` export, but that's over-engineered — it means _every_ service in the workspace drags in `jsonwebtoken` and the gateway's cookie-name constants, and the "shared" copy becomes a second source of truth that can drift from the gateway's reality. The clean answer: the gateway owns auth completely, and downstream services get a _tiny_ header-reader helper.

### What moves where

- `apps/user-service/src/middleware/auth.middleware.ts` — **stays where it is** for now. The plan is to remove it in a follow-up PR (see "Non-goals"); during this PR it remains the working implementation for the host-port-4001 dev workflow. We do **not** duplicate it.
- **New:** `apps/api-gateway/src/auth/jwtVerifier.ts` — pure function `verifyAccessToken(token: string) → { userId, email, sessionId } | null`. No Express glue. No `req`/`res` knowledge. Tested in isolation.
- **New:** `apps/api-gateway/src/auth/gatewayAuthMiddleware.ts` — Express middleware that:
  1. Reads the access-token cookie.
  2. Calls `verifyAccessToken()`. On failure → `throw new ApiError(statusCode.unauthorized, …)`.
  3. **Scrubs** any inbound `X-User-*` headers (defence against header forgery from outside).
  4. **Injects** `X-User-Id`, `X-User-Email`, `X-Session-Id` on the proxied request.
  5. Sets `Vary: X-User-Id` for downstream cache safety.
  6. `next()`.
- **New:** `apps/api-gateway/src/auth/cookieNames.ts` — gateway-local `COOKIE_NAMES` constant. (The existing `apps/user-service/src/utils/constants/cookie.ts` keeps its copy until the follow-up; no shared file.)
- **New:** `apps/api-gateway/src/auth/upstreamHeaders.ts` — gateway-side convenience re-export of the read-only helper. The **only** auth-related thing downstream services ever need is `readUserFromHeaders(req)`.
- **New:** `packages/auth-headers/` — **`@irctc/auth-headers`** package. Zero deps. Exports `readUserFromHeaders`, the `AuthUser` type, and the header name constants. This is the package boundary: _"here is how to read the trusted identity the gateway has already verified for you."_ It says nothing about how the gateway produced those headers, and it cannot drift from the gateway because it has no JWT knowledge.

### Why a tiny package, not a per-service copy, not the full middleware

- **Per-service copy** means three copies that must stay in sync, and the day the gateway changes a header name the bug surfaces as a 401 only on production traffic.
- **Full middleware in `@irctc/middleware`** over-shares — every service picks up `jsonwebtoken`, the cookie-name constant, and the `ERROR_CODES` mapping it doesn't use.
- **Read-only package, dep-free** matches the principle. The package is a contract, not a contract-plus-implementation. The gateway owns the implementation; everyone else owns a 20-line reader.

### New files

- `apps/api-gateway/src/auth/jwtVerifier.ts`
- `apps/api-gateway/src/auth/gatewayAuthMiddleware.ts`
- `apps/api-gateway/src/auth/cookieNames.ts`
- `apps/api-gateway/src/auth/upstreamHeaders.ts` (re-export from `@irctc/auth-headers` for gateway convenience)
- `packages/auth-headers/src/index.ts` — `readUserFromHeaders`, `AuthUser`, header constants
- `packages/auth-headers/package.json` — name, no runtime deps
- `packages/auth-headers/tsconfig.json`

### Files to edit

- `apps/api-gateway/package.json` — add `jsonwebtoken` + `@types/jsonwebtoken`.
- `apps/user-service/package.json`, `apps/notification-service/package.json`, `apps/order-service/package.json` — add `@irctc/auth-headers: workspace:*`.
- (Later, in a follow-up PR, the routes in user-service that currently use `authMiddleware` get swapped to a thin `readUserFromHeaders` + a new `requireUser` middleware. **Not** in this PR.)

### Verification

- `pnpm --filter user-service build` succeeds (unchanged — `auth.middleware.ts` is still in user-service).
- `pnpm --filter api-gateway build` succeeds.
- The existing host-port-4001 dev flow still works.

---

## Phase 2 — `apps/api-gateway` service

**Path:** `apps/api-gateway/`

### `apps/api-gateway/package.json`

```json
{
  "name": "api-gateway",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch ./src/server.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/server.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@irctc/contracts": "workspace:*",
    "@irctc/errors": "workspace:*",
    "@irctc/http": "workspace:*",
    "@irctc/logger": "workspace:*",
    "@irctc/middleware": "workspace:*",
    "@irctc/telemetry": "workspace:*",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "helmet": "^8.2.0",
    "http-proxy-middleware": "^3.0.5",
    "ioredis": "^5.11.0",
    "zod": "^4.4.3",
    "@t3-oss/env-core": "^0.13.11"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^4.17.21",
    "@types/node": "^22.0.0",
    "tsc-alias": "^1.8.17",
    "tsx": "^4.22.4"
  }
}
```

### `apps/api-gateway/tsconfig.json`

Extends `@repo/typescript-config/base.json`; paths aliases: `@config/*`, `@middleware/*`, `@routes/*`. Mirrors the user-service layout so anyone familiar with that service finds their way around immediately.

### File tree

```
apps/api-gateway/
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── server.ts
    ├── app.ts                          # composes the layers in order
    ├── config/
    │   ├── env.ts                      # strict env via @t3-oss/env-core
    │   ├── redis.ts                    # local ioredis client for rate-limit store
    │   ├── upstreams.ts                # Zod-validated typed upstream map (see 0g below)
    │   ├── routes.ts                   # single source of truth: path prefix → upstream
    │   └── index.ts
    ├── auth/                           # ── auth layer ──
    │   ├── jwtVerifier.ts              # pure JWT verify
    │   ├── gatewayAuthMiddleware.ts    # verify + scrub + inject X-User-*
    │   ├── cookieNames.ts              # gateway-local COOKIE_NAMES
    │   └── upstreamHeaders.ts          # re-export readUserFromHeaders
    ├── routing/                        # ── routing layer ──
    │   ├── routingTable.ts             # typed RouteEntry[] from upstreams.ts + routes.ts
    │   └── mountRoutes.ts              # wires the table to the Express app
    ├── ratelimit/                      # ── rate-limit layer ──
    │   ├── presets.ts                  # default + auth presets
    │   └── rateLimitMiddleware.ts      # thin wrapper around @irctc/ratelimit
    ├── proxy/                          # ── proxy layer ──
    │   ├── createProxy.ts              # http-proxy-middleware factory
    │   └── proxyHeadersMiddleware.ts   # second-line scrub of X-User-*
    ├── resilience/                     # ── resilience layer ──
    │   ├── breakerRegistry.ts          # CircuitBreakerRegistry.get('user-service') etc.
    │   └── timeouts.ts                 # per-upstream timeout config
    ├── telemetry/                      # ── telemetry layer ──
    │   └── traceContextMiddleware.ts   # startActiveSpan('http_request', ...)
    ├── serviceIdentity/                # ── service identity layer ──
    │   └── verifier.ts                 # wraps @irctc/service-identity
    ├── health/                         # self-only readiness probe
    │   ├── health.controller.ts
    │   └── health.service.ts
    ├── routes/                         # mounts the /health route only
    │   ├── index.ts
    │   └── health.routes.ts
    └── utils/
        └── errors/
            ├── errorCodes.ts
            ├── errorMessages.ts
            └── index.ts
```

**Folder rule:** every layer is its own top-level directory. The previous `middleware/` blob is gone — `auth`, `routing`, `ratelimit`, `proxy`, `resilience`, `telemetry`, and `serviceIdentity` are peer directories. The `app.ts` composes them in order, which is the only place the ordering is encoded. This scales to a future with 7+ services because each new layer is a new directory, not a new file inside an ever-growing `middleware/`.

The composition order in `app.ts` is:

1. `helmet()` (CSP off, same as user-service)
2. `cors({ origin, credentials: true, allowedHeaders: [..., 'traceparent', 'baggage'], exposedHeaders: ['X-Request-Id', 'X-Trace-Id'] })`
3. `cookieParser()` — needed for the JWT cookie
4. `express.json({ limit: '1mb' })`
5. `requestIdMiddleware` (from `@irctc/middleware`)
6. `telemetry/traceContextMiddleware` — starts the OTel span (this is the trace root)
7. `ratelimit/rateLimitMiddleware` — token bucket per (userId ?? ip)
8. `auth/gatewayAuthMiddleware` — applied **per-route**, not globally, so `/auth/*` is optional and `/users/*` is required
9. `proxy/proxyHeadersMiddleware` — final scrub of inbound identity headers
10. `serviceIdentity/verifier` — V1 allow-all (no-op in practice)
11. Routes mounted from `routing/mountRoutes`
12. `errorHandler` from `@irctc/middleware`
    │ ├── health.controller.ts
    │ └── health.service.ts # bounded-timeout probes for Redis (upstreams checked by /health/ready on each service)
    └── utils/
    └── errors/
    ├── errorCodes.ts
    ├── errorMessages.ts
    └── index.ts

````

### Key files (in detail)

**`src/config/env.ts`** — strict env with `@t3-oss/env-core`. Required keys:

```ts
PORT: 3000
NODE_ENV: development | production | test
REDIS_URL: redis://...
CORS_ORIGINS: string[]               // frontend origins
USER_UPSTREAM: url                   // e.g. http://irctc-user-service:4001
NOTIFICATION_UPSTREAM: url           // e.g. http://irctc-notification-service:4002
ORDER_UPSTREAM: url                  // e.g. http://irctc-order-service:4003
BOOKING_UPSTREAM: url.optional()     // reserved for the future
PAYMENT_UPSTREAM: url.optional()
SEARCH_UPSTREAM: url.optional()
JWT_SECRET: string
RATE_LIMIT_DEFAULT_CAPACITY: 100     // token-bucket capacity for default routes
RATE_LIMIT_DEFAULT_REFILL_PER_SEC: 100/60
RATE_LIMIT_AUTH_CAPACITY: 10         // tighter cap for /api/v1/auth/*
RATE_LIMIT_AUTH_REFILL_PER_SEC: 10/60
OTEL_EXPORTER_OTLP_ENDPOINT: url.optional()
OTEL_SERVICE_NAME: api-gateway
SERVICE_NAME: api-gateway
TRUST_PROXY: "true" | "false"
````

**No `GATEWAY_UPSTREAMS_JSON` raw-JSON env.** The previous draft parsed a JSON blob at boot. This is fragile (typos fail late, no schema, no IDE help). Instead each upstream is its own typed env var, validated by Zod via `@t3-oss/env-core`. The `config/upstreams.ts` file then collects them into a typed object:

```ts
import { z } from "zod";
import { env } from "./env.js";

const UpstreamUrl = z.string().url();

export const upstreams = {
  user: {
    name: "user",
    baseUrl: UpstreamUrl.parse(env.USER_UPSTREAM),
    circuitName: "user-service",
  },
  notification: {
    name: "notification",
    baseUrl: UpstreamUrl.parse(env.NOTIFICATION_UPSTREAM),
    circuitName: "notification-service",
  },
  order: {
    name: "order",
    baseUrl: UpstreamUrl.parse(env.ORDER_UPSTREAM),
    circuitName: "order-service",
  },
  // future:
  // booking:   { name: "booking",   baseUrl: ..., circuitName: "booking-service" },
  // payment:   { name: "payment",   baseUrl: ..., circuitName: "payment-service" },
  // search:    { name: "search",    baseUrl: ..., circuitName: "search-service" },
} satisfies Record<string, Upstream>;

type Upstream = { name: string; baseUrl: string; circuitName: string };
```

`Upstream` is the single shape that the routing table, the proxy factory, and the circuit-breaker registry all key off. The same object is used in three places — no JSON parsing, no `as any` casts, no missing-field runtime errors.

**`src/config/routes.ts`** — the **single source of truth** for path → upstream mapping. Returning a typed object:

```ts
export const ROUTES = {
  "/api/v1/auth": {
    upstream: env.upstreams.user,
    rewrite: true,
    auth: "optional",
    rateLimit: "auth",
  },
  "/api/v1/users": {
    upstream: env.upstreams.user,
    rewrite: true,
    auth: "required",
    rateLimit: "default",
  },
  "/api/v1/notifications": {
    upstream: env.upstreams.notification,
    rewrite: true,
    auth: "required",
    rateLimit: "default",
  },
  "/api/v1/orders": {
    upstream: env.upstreams.order,
    rewrite: true,
    auth: "required",
    rateLimit: "default",
  },
  // search/booking/payment get added in future phases
} as const;
```

This is **data, not code** — that's what makes routing auditable.

**`src/proxy/createProxy.ts`** — wraps `http-proxy-middleware` with these guarantees:

- Forwards the **outgoing** request unchanged in body and (most) headers.
- **Strips** any incoming `X-User-Id` / `X-User-Email` / `X-Session-Id` before proxying (defence in depth — already scrubbed in `gatewayAuthMiddleware`, but the proxy is the second wall).
- **Injects** the freshly-decoded `X-User-*` headers (and `X-Request-Id` from `requestIdMiddleware`, `traceparent` from `telemetry/traceContextMiddleware`).
- **Wraps the upstream call in the per-upstream circuit breaker** from `resilience/breakerRegistry.ts` (see below). If the breaker is `OPEN`, the proxy fails fast with `503 Service Unavailable` and a structured `ErrorContract` — no upstream call, no timeouts piling up.
- **Honours the per-upstream timeout** from `resilience/timeouts.ts`. A slow upstream fails the breaker (counts as a failure) rather than hanging the gateway thread.
- On proxy error, returns a normalised `ErrorContract` via `errorResponse()` from `@irctc/http` instead of raw proxy HTML.
- Logs `upstream`, `statusCode`, `durationMs`, `requestId`, `traceId`, `userId` (never email), and the circuit breaker's `state` (CLOSED / OPEN / HALF_OPEN) so the access log makes the resilience layer visible.

**`src/ratelimit/rateLimitMiddleware.ts`** — thin gateway-specific wrapper around `@irctc/ratelimit`. Reads the preset from the matched route entry (`default` or `auth`), calls `createRateLimitMiddleware` from the shared package, and writes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers on every response. The actual token-bucket algorithm and Redis Lua live in `@irctc/ratelimit`; the gateway doesn't reimplement them. See Phase 0 (0c) for the algorithm and presets.

**`src/resilience/breakerRegistry.ts`** — wraps the shared `CircuitBreakerRegistry` from `@irctc/resilience`. One breaker per upstream, named by `circuitName` (e.g. `'user-service'`, `'notification-service'`, `'order-service'`). The proxy factory calls `registry.get(circuitName).execute(() => httpClient.request(...))`. Defaults: `failureThreshold = 5`, `recoveryTimeoutMs = 30_000`, `halfOpenMaxTrials = 1`, `timeoutMs = 5_000`. The full state machine and V1 scope are in Phase 0 (0b).

**`src/telemetry/traceContextMiddleware.ts`** — uses `@opentelemetry/api` directly (no SDK needed in this file; the SDK is bootstrapped once in `server.ts`):

- `trace.getTracer('api-gateway').startActiveSpan('http_request', span => { ... })`
- Sets `X-Trace-Id` response header (mirrors what user-service already does — reuses the pattern from `apps/user-service/src/app.ts`).
- Auto-instrumentation (`instrumentation-http`) handles the downstream `traceparent` propagation. No manual injection here.

**`src/app.ts`** — composes the layers in order. The exact order is in the folder-rule block above; in short: helmet → cors → cookieParser → json → requestId → telemetry → ratelimit → auth (per-route) → proxyHeaders → serviceIdentity (V1 no-op) → routes → errorHandler.

**`src/server.ts`** — mirrors `apps/user-service/src/server.ts`:

- `await initRedis()` (the **canonical pattern** that the project CLAUDE.md already calls out — `lazyConnect: false` starts the handshake, the `ready` event must be awaited; we replicate `apps/notification-service/src/config/redis.ts`).
- `startTelemetry({ serviceName: 'api-gateway', otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT })`.
- `app.listen(PORT)`.
- Graceful shutdown: stop HTTP → `redis.quit()` → `shutdownTelemetry()` → `process.exit(0)`. (No Kafka in the gateway, so the shutdown is simpler than user-service's.)

**`src/health/health.service.ts`** — readiness probes (must have **bounded 5s timeout** as per project CLAUDE.md):

- Redis: `redis.ping()` wrapped in `Promise.race` with 5s `setTimeout` + `clearTimeout` in `finally`.
- OTel exporter liveness: best-effort — the SDK does not expose a "ready" flag, so we skip this. The exporter is fire-and-forget; if it fails the gateway still serves traffic. (The per-service `HealthService` pattern in `apps/notification-service/src/health/health.service.ts` is the right shape to follow.)
- **No upstream probing.** The gateway does _not_ fetch `/health/ready` from user-service, notification-service, or order-service. That would be health aggregation — forbidden in the responsibility split above. Each service exposes its own `/health/ready` and is probed independently by Docker healthchecks (or, in K8s, by `readinessProbe`). Traefik does not need the gateway to tell it whether upstreams are alive; it discovers that itself via the Docker provider.

---

## Phase 3 — Distributed tracing, the minimal correct version

The gateway starts a trace. Services continue it. Kafka carries the `traceparent` header across the async boundary. That's the whole story — and the manual footprint is now smaller than in the previous draft.

**Rule:** manual code lives at exactly **one** ingress point (Kafka consumer). The producer side is _not_ manual — the OTel SDK's `instrumentation-kafkajs` creates a `kafka.publish` span and the default W3C text-map propagator writes `traceparent` into the message headers as part of that span. Publishers do not touch tracing code at all.

### Where manual work is required (and where it is not)

| Hop                                 | Manual? | Why                                                                                                                                                                                                                       |
| ----------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client → Traefik → gateway          | No      | Traefik is a TCP/TLS edge; the gateway starts the trace                                                                                                                                                                   |
| Gateway starts trace                | **Yes** | This is the trace root — `trace.getTracer('api-gateway').startActiveSpan('http_request', ...)` in `apps/api-gateway/src/telemetry/traceContextMiddleware.ts`                                                              |
| Gateway → downstream HTTP           | No      | `@opentelemetry/instrumentation-http` propagates `traceparent` automatically                                                                                                                                              |
| Downstream → its own DB/Redis       | No      | `instrumentation-ioredis` / Prisma auto-instrumentation                                                                                                                                                                   |
| Service → Kafka producer            | **No**  | `instrumentation-kafkajs` creates a `kafka.publish` span; the SDK's default W3C text-map propagator writes `traceparent` into the message headers automatically. Publishers are unchanged.                                |
| Kafka → consumer in another service | **Yes** | Async boundary: there is no in-process parent. The `KafkaConsumerRunner` extracts the parent context from message headers, opens a `kafka.process` span as the child, and invokes the handler inside `context.with(...)`. |
| Consumer → its own work             | No      | Auto-instrumentation continues from the parent span                                                                                                                                                                       |

So there are exactly **two** manual touchpoints in the whole system: gateway start, Kafka consume. The Kafka publish side is _zero-touch_ — the SDK does it as a side-effect of the publish span, which is the correct shape: producer code should not know tracing exists.

### 3a. Gateway starts the trace

**File:** `apps/api-gateway/src/telemetry/traceContextMiddleware.ts`

```ts
const tracer = trace.getTracer("api-gateway");
tracer.startActiveSpan("http_request", (span) => {
  res.setHeader("X-Trace-Id", span.spanContext().traceId);
  res.on("finish", () => span.end());
  next();
});
```

That's it for the gateway. Auto-instrumentation handles the downstream HTTP propagation.

### 3b. Kafka producer — **no code change**

`apps/user-service/src/events/publishers/otp-requested.publisher.ts` and its sibling stay exactly as they are. The OTel SDK's `instrumentation-kafkajs` wraps `producer.send`, opens a `kafka.publish` span, and the registered text-map propagator (W3C `traceparent` by default) writes the header into the message bytes. Publisher code is unaware of tracing.

The one thing we _do_ need to confirm during implementation is that the propagator is the W3C one (it is the OTel default since 1.0) and that the `kafkajs` instrumentation is enabled in `startTelemetry()` (it is, via `auto-instrumentations-node`). If a future operator turns off `auto-instrumentations-node` and goes manual, the runner-side extraction in 3c is still safe — it just won't find a parent.

### 3c. Kafka consumer extracts (one place, inside the runner)

**File:** `packages/kafka/src/consumer-runner/kafka-consumer-runner.ts`

The runner already owns `connect → subscribe → run`. It also owns the cross-cutting concern of joining the publish-side trace, so consumers don't have to think about it. Inside the existing `eachMessage` handler:

```ts
eachMessage: async (payload) => {
  const parentCtx = extractTraceContextFromKafkaHeaders(payload.message.headers);
  await context.with(parentCtx, () => handler(payload));
},
```

`propagateTraceContext: boolean = true` stays as a constructor option so unit tests can opt out.

### 3d. Bootstrapping OTel — same one line in every service

The telemetry package's `startTelemetry()` does the entire SDK init. Each service's `server.ts` adds exactly one call. No service has any _other_ tracing code.

- `apps/api-gateway/src/server.ts` — `await startTelemetry({ serviceName: 'api-gateway' })` _before_ `app.listen()`.
- `apps/user-service/src/server.ts` — `await startTelemetry({ serviceName: 'user-service' })` immediately after `initRedis()`.
- `apps/notification-service/src/server.ts` — `await startTelemetry({ serviceName: 'notification-service' })` _before_ `bootstrap()` (so the first consumed message is inside a span).
- `apps/order-service/src/server.ts` — same pattern.

`@opentelemetry/auto-instrumentations-node` registers HTTP, Express, ioredis, and kafkajs in one shot. The `kafkajs` auto-instrumentation creates the `kafka.publish` and `kafka.process` spans; manual work is purely on the consumer side (one `context.with(...)` wrap).

### What is deliberately NOT in this phase

- **No manual `injectTraceContextIntoKafkaHeaders()` in publishers.** The default propagator does it. This is the _only_ place the previous draft was over-engineered.
- No new `KafkaConsumerRunner` flags beyond `propagateTraceContext` (no per-message `parentSpan`, no manual span creation in the runner).
- No `tracestate` parsing in services (auto-instrumentation handles it).
- No custom propagation format (W3C `traceparent` only — that's what every OTel SDK speaks by default).
- No new env vars for tracing. `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_SERVICE_NAME` are the only ones, and both are picked up by the SDK from `process.env` automatically.

---

## Phase 4 — Traefik + per-service Dockerfiles + docker-compose

### 4a. Traefik static + dynamic config

**New:** `infra/traefik/traefik.yml`

```yaml
global:
  checkNewVersion: false
  sendAnonymousUsage: false

api:
  dashboard: true
  insecure: false # dashboard is exposed via the web entrypoint, see below

entryPoints:
  web:
    address: ":80"
  websecure:
    address: ":443"

providers:
  docker:
    exposedByDefault: false
    network: irctc-network

log:
  level: INFO
  format: common

accessLog:
  format: common
```

**New:** `infra/traefik/dynamic/middlewares.yml`

```yaml
http:
  middlewares:
    secureHeaders:
      headers:
        stsIncludeSubdomains: true
        stsSeconds: 31536000
        browserXssFilter: true
        contentTypeNosniff: true
        frameDeny: true
    cors:
      headers:
        accessControlAllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS"
        accessControlAllowHeaders: "Content-Type,Authorization,X-Request-Id,traceparent,baggage"
        accessControlExposeHeaders: "X-Request-Id,X-Trace-Id"
        accessControlAllowCredentials: "true"
        accessControlMaxAge: "600"
    retry:
      retry:
        attempts: 3
        initialInterval: "100ms"
```

Traefik picks these up via the `file` provider (we'll add a second `file` provider in `traefik.yml` pointing at the dynamic dir).

### 4b. Per-service Dockerfiles

**`apps/api-gateway/Dockerfile`** — multi-stage:

```dockerfile
# build
FROM node:22-alpine AS build
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc tsconfig.base.json turbo.json ./
COPY packages ./packages
COPY apps/api-gateway ./apps/api-gateway
RUN corepack enable && pnpm install --filter api-gateway... --frozen-lockfile
RUN pnpm --filter api-gateway build

# runtime
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/apps/api-gateway/dist ./dist
COPY --from=build /repo/apps/api-gateway/package.json ./
COPY --from=build /repo/node_modules ./node_modules
EXPOSE 3000
USER node
CMD ["node", "dist/server.js"]
```

**`apps/user-service/Dockerfile`**, **`apps/notification-service/Dockerfile`**, **`apps/order-service/Dockerfile`** — identical structure, with the only differences being the workspace filter name and the `dist` source path.

A small pattern repetition is fine here (3 services, not 30). If you want to dedupe later, the conventional move is a `docker/build-service.Dockerfile` template + a shell snippet that runs `pnpm --filter $SERVICE build` — out of scope for v1.

### 4c. `docker-compose.yml` updates

Top of the file: add a `traefik` service, an `api-gateway` service, and one service per existing app. Each app keeps **no `ports:`** mapping — only the gateway and Traefik publish ports. Kafka, Postgres, Redis keep their existing maps (host-side devtools depend on them).

```yaml
traefik:
  image: traefik:v3.1
  container_name: irctc-traefik
  restart: always
  command:
    - "--providers.docker=true"
    - "--providers.docker.exposedByDefault=false"
    - "--providers.docker.network=irctc-network"
    - "--providers.file.directory=/etc/traefik/dynamic"
    - "--providers.file.watch=true"
    - "--entrypoints.web.address=:80"
    - "--entrypoints.websecure.address=:443"
    - "--api.dashboard=true"
    - "--accesslog=true"
  ports:
    - "80:80"
    - "443:443"
    - "8082:8080" # dashboard, dev only
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock:ro
    - ./infra/traefik/dynamic:/etc/traefik/dynamic:ro
  networks:
    - irctc-network
  depends_on:
    - api-gateway

api-gateway:
  build:
    context: .
    dockerfile: apps/api-gateway/Dockerfile
  container_name: irctc-api-gateway
  restart: always
  environment:
    NODE_ENV: production
    PORT: 3000
    REDIS_URL: redis://irctc-redis:6379
    JWT_SECRET: ${JWT_SECRET}
    CORS_ORIGINS: ${CORS_ORIGINS}
    USER_UPSTREAM: http://irctc-user-service:4001
    NOTIFICATION_UPSTREAM: http://irctc-notification-service:4002
    ORDER_UPSTREAM: http://irctc-order-service:4003
    RATE_LIMIT_DEFAULT_CAPACITY: 100
    RATE_LIMIT_DEFAULT_REFILL_PER_SEC: "1.6667"
    RATE_LIMIT_AUTH_CAPACITY: 10
    RATE_LIMIT_AUTH_REFILL_PER_SEC: "0.1667"
    OTEL_EXPORTER_OTLP_ENDPOINT: ${OTEL_EXPORTER_OTLP_ENDPOINT}
    OTEL_SERVICE_NAME: api-gateway
    SERVICE_NAME: api-gateway
    RATE_LIMIT_WINDOW_SEC: 60
    RATE_LIMIT_MAX: 100
    RATE_LIMIT_AUTH_MAX: 10
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.gateway.rule=Host(`localhost`)"
    - "traefik.http.routers.gateway.entrypoints=web"
    - "traefik.http.routers.gateway.middlewares=secureHeaders@file,cors@file,retry@file"
    - "traefik.http.services.gateway.loadbalancer.server.port=3000"
  networks:
    - irctc-network
  depends_on:
    - user-service
    - notification-service
    - order-service
    - redis

user-service:
  build: { context: ., dockerfile: apps/user-service/Dockerfile }
  container_name: irctc-user-service
  restart: always
  environment:
    PORT: 4001
    DATABASE_URL: postgresql://admin:password@irctc-postgres:5432/irctc_db
    REDIS_URL: redis://irctc-redis:6379
    KAFKA_BROKERS: irctc-kafka:29092
    JWT_SECRET: ${JWT_SECRET}
    JWT_ACCESS_EXPIRES_IN: 15m
    JWT_REFRESH_EXPIRES_IN: 7d
    CORS_ORIGINS: ${CORS_ORIGINS}
    SERVICE_NAME: user-service
    OTEL_EXPORTER_OTLP_ENDPOINT: ${OTEL_EXPORTER_OTLP_ENDPOINT}
    OTEL_SERVICE_NAME: user-service
  expose:
    - "4001" # ONLY to the irctc-network — never host-published
  networks:
    - irctc-network
  depends_on:
    - postgres
    - redis
    - kafka

# … notification-service and order-service mirror the above
```

**Critical network rules:**

- Downstream services have **`expose:`** (Docker-network-only), **not `ports:`** (host-published). This is the only thing that makes the Edge Auth pattern safe — nothing on the host can reach `user-service:4001` directly.
- Only `traefik` and `api-gateway` publish host ports (80/443/3000/8082).
- All services share the existing `irctc-network`. No second network is needed; isolation is by absence of `ports:` + the gateway's X-User-\* scrub.
- Add an `infra/traefik/dynamic` volume read-only mount so middlewares can be reloaded without restarting Traefik (`--providers.file.watch=true`).

### 4d. `.env` additions (root `.env`, not committed if it has secrets)

```env
JWT_SECRET=changeme
CORS_ORIGINS=http://localhost:3000
USER_UPSTREAM=http://irctc-user-service:4001
NOTIFICATION_UPSTREAM=http://irctc-notification-service:4002
ORDER_UPSTREAM=http://irctc-order-service:4003
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

For local tracing without a collector, the OTLP exporter can be omitted; the SDK still creates spans but they have no sink. To make local dev nicer, the gateway also accepts `OTEL_SDK_DISABLED=true` to no-op the SDK for fast inner-loop.

### 4e. Traefik routing in detail

The `traefik.http.routers.gateway.rule=Host(\`localhost\`)` line catches everything for now. In a real deployment you'd split by host (`api.example.com`) and/or path prefix (`/auth/_`→ user-service,`/payments/_` → payment-service). For v1, **one router → one gateway service** is enough. The gateway is the single L7 router; Traefik is just the L4/L7 edge. This split keeps routing policy inside the app where you can version it.

---

## Phase 5 — Verification

After implementation, the project must pass the following checks end-to-end.

### 5a. Local stack up

```bash
docker compose up -d --build
docker compose ps                 # all services healthy
curl http://localhost/health/ready          # gateway ready
curl http://localhost:8082/api/rawdata      # Traefik dashboard
```

### 5b. Auth round-trip via gateway

```bash
# 1. send-otp (no auth required)
curl -i -X POST http://localhost/api/v1/auth/send-otp \
  -H 'Content-Type: application/json' \
  -d '{"email":"x@y.com","firstName":"A","lastName":"B","deviceFingerprint":"d1"}'

# 2. verify-otp (sets auth_token cookie)
curl -i -c cookies.txt -X POST http://localhost/api/v1/auth/verify-otp \
  -H 'Content-Type: application/json' \
  -d '{ ... }'

# 3. /auth/sessions (auth required; gateway must inject X-User-Id)
curl -i -b cookies.txt http://localhost/api/v1/auth/sessions
# Expect 200; logs show X-User-Id matches the cookie's sub claim
```

### 5c. Trust-boundary checks

```bash
# 4. Try to forge X-User-Id from outside the gateway
curl -i http://localhost/api/v1/users/me \
  -H 'X-User-Id: 00000000-0000-0000-0000-000000000001'
# Expect 401 — no auth cookie
```

```bash
# 5. Direct host-side access must be refused
curl -i http://localhost:4001/api/v1/auth/send-otp
# Expect: connection refused (port 4001 not published on host)
```

### 5d. Rate limiting (token bucket)

```bash
# 6. Exceed the auth-bucket capacity; expect 429
#    The auth preset is capacity=10, refill=10/60s. The first 10 requests
#    pass; further requests fail until tokens refill.
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost/api/v1/auth/send-otp \
    -H 'Content-Type: application/json' -d '{}'
done
# Expect: 10x 200/4xx, 2x 429 with Retry-After header
```

```bash
# 7. Token-bucket boundary check (regression for the fixed-window bug)
#    Send a burst of 8 requests at second 59 of one minute and 8 more
#    at second 0 of the next. With a fixed window, the user gets 16 in
#    1s; with a token bucket, they get capacity (10) + refill (a few
#    tokens) across the boundary — not a doubling.
#    Manual check: 'docker exec irctc-redis redis-cli KEYS "rl:*"' shows
#    the bucket state, and the gateway access log shows 429s within the
#    single second, not across it.
```

### 5e. Circuit breaker (per-upstream)

```bash
# 8. Trip the user-service breaker.
#    Stop the user-service container: 'docker compose stop user-service'.
#    Send 6+ requests through the gateway in quick succession:
for i in $(seq 1 7); do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost/api/v1/users/me
done
# Expect: first ~5 requests are 502/504 (or whatever the timeout yields),
# remaining requests are 503 with the body { code: "CIRCUIT_OPEN", ... } —
# i.e. the breaker tripped and is now failing fast, no 5s waits.
# Check the gateway access log: each line includes circuitState:
#   CLOSED on the early calls, OPEN on the later ones.
```

```bash
# 9. Recovery: 'docker compose start user-service', wait ~30s, retry:
curl -i http://localhost/api/v1/users/me
# Expect: 503 once more (recoveryTimeoutMs=30_000), then HALF_OPEN allows
# a probe, success → CLOSED, subsequent requests return 2xx.
```

### 5f. End-to-end trace

Use a temporary local Tempo via `docker compose -f infra/observability/docker-compose.observability.yml up` (out of scope here but a single OTLP HTTP exporter in the gateway already sends spans; verify in `docker logs irctc-api-gateway` that the `traceId` in the gateway log line matches the `traceId` in the user-service log line for the same request).

```bash
curl -i -H 'traceparent: 00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01' \
  http://localhost/api/v1/auth/send-otp \
  -H 'Content-Type: application/json' -d '{}'
# Check user-service logs: traceId must be aaaaaaaa…
# (if Kafka step happens later, notification-service logs share the same traceId)
```

### 5g. Existing service health

```bash
docker compose exec user-service curl -s localhost:4001/health/ready
docker compose exec notification-service curl -s localhost:4002/health/ready
```

Each must respond 200 with `redis: true, kafka: true` (and `prisma: true` for user-service). The 5s probe timeout in `HealthService.runReadinessChecks()` keeps a slow dependency from blocking readiness.

### 5h. Build / lint / typecheck

```bash
pnpm install
pnpm build                # all packages + apps
pnpm check-types          # zero errors
pnpm lint                 # zero errors
```

### 5i. Circuit-breaker unit tests (in `packages/resilience`)

The package ships with hand-written unit tests for the state machine — these are the cheapest regression net for the custom breaker:

- `CLOSED` → call fails 5 times → transitions to `OPEN` and stamps `openedAt`.
- `OPEN` → call returns `CircuitOpenError` _without_ invoking the function.
- After `recoveryTimeoutMs` elapses, next call is allowed; success → `CLOSED`.
- After `recoveryTimeoutMs` elapses, next call fails → re-`OPEN`, `openedAt` restamped.
- `timeoutMs` enforces a real timeout on the wrapped function; a hang counts as a failure.
- `halfOpenMaxTrials = 1`: only one probe is allowed in `HALF_OPEN`; a second concurrent call fails fast.

---

## Critical files to be modified (summary)

| File                                                          | Change                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/telemetry/**`                                       | **new** — OTel SDK bootstrap (`startTelemetry`). Extraction helper for the Kafka consumer side. No producer-side injection helper (SDK default propagator does it).                                                                                                                                                        |
| `packages/resilience/**`                                      | **new** — hand-rolled circuit breaker (`CircuitBreaker`, `CircuitBreakerRegistry`, `withTimeout`, `ExponentialBackoff`). CLOSED / OPEN / HALF_OPEN state machine, single-process state, no Redis-shared breaker in V1.                                                                                                     |
| `packages/ratelimit/**`                                       | **new** — token-bucket rate limiter over Redis (`TokenBucketRateLimiter`, atomic Lua, Express middleware). Replaces the previous fixed-window approach.                                                                                                                                                                    |
| `packages/idempotency/**`                                     | **new** — three-phase Redis pattern (`reserveIfNew` / `markProcessed` / `release`). Same shape as the existing `apps/notification-service/src/repositories/idempotency.repository.ts`. Exported but not yet wired into the gateway in V1.                                                                                  |
| `packages/service-identity/**`                                | **new** — `ServiceIdentityVerifier` interface + V1 `AllowAllServiceIdentityVerifier`. The gateway calls it before the proxy hop. V2 (mTLS / signed service tokens) is a one-file swap.                                                                                                                                     |
| `packages/auth-headers/**`                                    | **new** — dep-free, read-only `readUserFromHeaders` + `AuthUser` + header-name constants. The single contract services use to read gateway-verified identity.                                                                                                                                                              |
| `apps/api-gateway/src/auth/jwtVerifier.ts`                    | **new** — pure JWT verify, no Express                                                                                                                                                                                                                                                                                      |
| `apps/api-gateway/src/auth/gatewayAuthMiddleware.ts`          | **new** — verify + scrub inbound `X-User-*` + inject trusted `X-User-*` + set `Vary`                                                                                                                                                                                                                                       |
| `apps/api-gateway/src/auth/cookieNames.ts`                    | **new** — gateway-local `COOKIE_NAMES` (does **not** move from user-service yet)                                                                                                                                                                                                                                           |
| `apps/api-gateway/src/auth/upstreamHeaders.ts`                | **new** — convenience re-export of `readUserFromHeaders`                                                                                                                                                                                                                                                                   |
| `apps/api-gateway/src/routing/routingTable.ts`                | **new** — typed `RouteEntry[]` keyed off `config/upstreams.ts` + `config/routes.ts`                                                                                                                                                                                                                                        |
| `apps/api-gateway/src/routing/mountRoutes.ts`                 | **new** — wires the routing table to the Express app, attaches per-route auth + rate-limit preset                                                                                                                                                                                                                          |
| `apps/api-gateway/src/ratelimit/rateLimitMiddleware.ts`       | **new** — thin gateway wrapper around `@irctc/ratelimit`; reads preset from matched route entry                                                                                                                                                                                                                            |
| `apps/api-gateway/src/proxy/createProxy.ts`                   | **new** — `http-proxy-middleware` factory; second-line scrub of `X-User-*`; injects gateway-verified identity; **wraps the upstream call in the per-upstream `CircuitBreaker.execute()`**                                                                                                                                  |
| `apps/api-gateway/src/proxy/proxyHeadersMiddleware.ts`        | **new** — final scrub of inbound identity headers before the proxy hop                                                                                                                                                                                                                                                     |
| `apps/api-gateway/src/resilience/breakerRegistry.ts`          | **new** — wraps the shared `CircuitBreakerRegistry`; one breaker per `circuitName` (e.g. `user-service`, `notification-service`, `order-service`)                                                                                                                                                                          |
| `apps/api-gateway/src/resilience/timeouts.ts`                 | **new** — per-upstream timeout config used by the proxy                                                                                                                                                                                                                                                                    |
| `apps/api-gateway/src/telemetry/traceContextMiddleware.ts`    | **new** — `startActiveSpan('http_request', ...)`; one manual touchpoint for tracing                                                                                                                                                                                                                                        |
| `apps/api-gateway/src/serviceIdentity/verifier.ts`            | **new** — wraps `@irctc/service-identity`; V1 allow-all, no-op in practice                                                                                                                                                                                                                                                 |
| `apps/api-gateway/src/config/upstreams.ts`                    | **new** — Zod-validated typed upstream map (`USER_UPSTREAM`, `NOTIFICATION_UPSTREAM`, `ORDER_UPSTREAM`); no raw JSON env                                                                                                                                                                                                   |
| `apps/api-gateway/src/config/routes.ts`                       | **new** — single source of truth for path → upstream mapping                                                                                                                                                                                                                                                               |
| `apps/api-gateway/**` (rest)                                  | **new service** — see Phase 2                                                                                                                                                                                                                                                                                              |
| `apps/api-gateway/package.json`                               | add `@irctc/telemetry`, `@irctc/resilience`, `@irctc/ratelimit`, `@irctc/idempotency`, `@irctc/service-identity`, `@irctc/auth-headers`, `jsonwebtoken` + types, `http-proxy-middleware`                                                                                                                                   |
| `apps/user-service/package.json`                              | add `@irctc/telemetry`, `@irctc/auth-headers`, `@irctc/resilience`, `@irctc/idempotency`, `@irctc/ratelimit`                                                                                                                                                                                                               |
| `apps/notification-service/package.json`                      | add `@irctc/telemetry`, `@irctc/auth-headers`, `@irctc/resilience`, `@irctc/idempotency` (used by the existing consumer; the local `IdempotencyRepository` is ported to `@irctc/idempotency` in a follow-up)                                                                                                               |
| `apps/order-service/package.json`                             | add `@irctc/telemetry`, `@irctc/auth-headers`, `@irctc/resilience`, `@irctc/idempotency`, `@irctc/ratelimit`                                                                                                                                                                                                               |
| `apps/user-service/src/server.ts`                             | one-line `await startTelemetry({ serviceName: 'user-service' })` after `initRedis()`                                                                                                                                                                                                                                       |
| `apps/notification-service/src/server.ts`                     | one-line `await startTelemetry({ serviceName: 'notification-service' })` before `bootstrap()`                                                                                                                                                                                                                              |
| `apps/order-service/src/server.ts`                            | one-line `await startTelemetry({ serviceName: 'order-service' })`                                                                                                                                                                                                                                                          |
| `packages/kafka/src/consumer-runner/kafka-consumer-runner.ts` | wrap `eachMessage` handler in `context.with(extractTraceContextFromKafkaHeaders(...), …)` — one extraction point, runner owns the cross-cutting concern                                                                                                                                                                    |
| `apps/api-gateway/Dockerfile`                                 | **new**                                                                                                                                                                                                                                                                                                                    |
| `apps/user-service/Dockerfile`                                | **new**                                                                                                                                                                                                                                                                                                                    |
| `apps/notification-service/Dockerfile`                        | **new**                                                                                                                                                                                                                                                                                                                    |
| `apps/order-service/Dockerfile`                               | **new**                                                                                                                                                                                                                                                                                                                    |
| `infra/traefik/traefik.yml`                                   | **new** — Traefik static config                                                                                                                                                                                                                                                                                            |
| `infra/traefik/dynamic/middlewares.yml`                       | **new** — secureHeaders, cors, retry                                                                                                                                                                                                                                                                                       |
| `docker-compose.yml`                                          | add `traefik`, `api-gateway`, `user-service`, `notification-service`, `order-service` services; **remove host port mappings on the per-service apps**; add `healthcheck:` block to each per-service app pointing at `/health/ready` so Docker probes them independently (the gateway does _not_ aggregate upstream health) |

**Files explicitly NOT touched in this PR:**

- `apps/user-service/src/middleware/auth.middleware.ts` — left in place; the host-port-4001 dev flow still works. Migration to header-trust is a follow-up PR.
- `apps/user-service/src/utils/constants/cookie.ts` — `COOKIE_NAMES` stays here. The gateway has its own copy.
- `apps/user-service/src/events/publishers/*.publisher.ts` — **no tracing code is added here.** The OTel `instrumentation-kafkajs` + default W3C propagator writes `traceparent` automatically as part of the `kafka.publish` span. Publisher code stays unaware of tracing.
- `packages/middleware/src/index.ts` — auth is no longer a shared package concern.
- `apps/notification-service/src/repositories/idempotency.repository.ts` — left in place; ported to `@irctc/idempotency` in a follow-up PR.
- Any service route file (no `requireUser(readUserFromHeaders(...))` change yet).
- `apps/api-gateway/src/health/health.service.ts` — does **not** probe upstreams. Self-checks only (Redis for the rate limiter).
- `apps/api-gateway/src/middleware/**` — **the old `middleware/` folder is gone.** The new layer-based folders (`auth/`, `routing/`, `ratelimit/`, `proxy/`, `resilience/`, `telemetry/`, `serviceIdentity/`) replace it. The auth layer's `auth/` is _not_ middleware; it's its own top-level directory.

## Reuse — do not reinvent

- `requestIdMiddleware` from `@irctc/middleware` — already does X-Request-Id + AsyncLocalStorage. **Use it in the gateway unchanged.**
- `errorHandler` from `@irctc/middleware` — same error contract as user-service.
- `normalizeError` + `errorResponse` — for proxy failures.
- `KafkaConsumerRunner` — only the **internal handler invocation** changes (one `context.with(...)` wrap); the public API stays identical for existing consumers.
- `logger` from `@irctc/logger` — already OTel-aware (its `mixin()` reads the active span). No code change needed; once `startTelemetry()` is called, `traceId` + `spanId` appear in every log line automatically.
- `initRedis()` pattern from `apps/notification-service/src/config/redis.ts` — replicate in the gateway (project CLAUDE.md calls this out as canonical).
- `HealthService.runReadinessChecks()` bounded-timeout pattern from `apps/notification-service/src/health/health.service.ts` — replicate in the gateway _for self-checks_ (Redis), **not** for upstream probing.
- `@opentelemetry/auto-instrumentations-node` — covers HTTP, Express, ioredis, kafkajs. Don't write custom instrumentation for what the SDK already gives you.
- `@irctc/resilience` (this PR) — the gateway wraps each upstream call in `CircuitBreakerRegistry.get(name).execute(...)`; the same package is reusable by any service that calls another service over HTTP.
- `@irctc/ratelimit` (this PR) — token-bucket algorithm + Lua live here. The gateway's `ratelimit/rateLimitMiddleware.ts` is a thin wrapper that picks the preset from the matched route entry.
- `@irctc/idempotency` (this PR) — three-phase pattern, exported but **not** wired into the gateway in V1. Booking/payment will pick it up when they land.
- `@irctc/service-identity` (this PR) — V1 `AllowAllServiceIdentityVerifier` is a no-op; the interface is what matters for the V2 mTLS upgrade.

## What this plan does NOT do (explicit non-goals)

- **TLS certificates** — Traefik is configured to terminate TLS, but no Let's Encrypt / cert files are wired. Use self-signed or `mkcert` for local; in prod, the existing infra layer (`infra/`) will own the cert story.
- **Tempo / OTel collector** — the exporter endpoint is plumbed end-to-end, but no collector is added to `docker-compose.yml` in this round. Spans are emitted; the collector can be added later without code changes.
- **Order-service / booking / payment business logic** — only the routing slots are reserved in `config/upstreams.ts`. Their Dockerfiles get the same template; their apps are out of scope for this plan.
- **Distributed-trace sampling configuration** — defaults to `parentbased_always_on`. Tighten later.
- **Migration of user-service routes to "header-trust" mode** — the only service that currently has an auth middleware is user-service (`apps/user-service/src/middleware/auth.middleware.ts`). The other services (notification, order) have no auth context today and continue to have none in this PR — they gain only a dep-free `readUserFromHeaders` available for when they need it. The user-service migration to header-trust is a **separate follow-up PR**: replace each route's `authMiddleware` with a thin `requireUser` that calls `readUserFromHeaders`, drop `JWT_SECRET` from user-service env, and let the gateway be the sole token verifier. Out of scope here because (a) it's the most security-sensitive change in the plan, and (b) it must land _after_ the gateway is in production so the dev workflow has a working fallback.
- **Authorization (RBAC, scopes)** — the gateway does coarse checks (token valid, user not blocked) only. Fine-grained authorization ("can this user cancel _this_ ticket") stays in the service that owns the resource. Any RBAC table belongs in user-service / order-service, not in the gateway.
- **Service-to-service auth beyond the gateway trust boundary** — assumes a private Docker network. The `ServiceIdentityVerifier` interface in `@irctc/service-identity` is the contract for V2 (mTLS or signed service tokens); the V1 implementation is intentionally allow-all. The single-file swap is its own PR.
- **Wiring `@irctc/idempotency` into the gateway or services** — the package is exported and tested in this PR, but `POST /payments/*` and `POST /bookings/*` don't exist yet. The wiring is a follow-up PR per service.
- **Sliding-window / adaptive circuit-breaker thresholds** — V1 uses the simple count-based state machine. The features deliberately not built (sliding windows, failure-percent, p95 latency, distributed state, dynamic config, service-mesh integration) are listed in Phase 0 (0b). They are real production features; each is its own follow-up PR.
- **Per-upstream tier-aware rate limits** — V1 has two presets (`default`, `auth`). A future tier claim on the JWT (`tier: 'premium'`) can map to a third preset, with the tier itself decided by user-service, not the gateway. The token-bucket algorithm supports it without code changes; only the preset table grows.

---

## What this plan delivers, in one breath

**One new service** (`apps/api-gateway`), **five new shared packages** (`@irctc/telemetry`, `@irctc/resilience`, `@irctc/ratelimit`, `@irctc/idempotency`, `@irctc/service-identity`), **one dep-free read-only contract** (`@irctc/auth-headers`), **per-service Dockerfiles**, **Traefik in front of the gateway**, and the per-service `startTelemetry()` one-liner. **Zero changes** to existing service code paths (no auth middleware moved, no publisher touched, no consumer file moved) — every change is either additive or a new file.

The result: every external request hits `Traefik → api-gateway → service`, traces from a user click all the way into a Kafka consumer (gateway starts, services continue via auto-instrumentation, Kafka propagates W3C `traceparent` automatically), every service has bounded `/health/ready` probes, every per-service app is reachable only from inside the Docker network, every downstream call is wrapped in a hand-rolled circuit breaker whose state is visible in the access log, and every gateway route is rate-limited by a per-`(userId ?? ip)` token bucket. No service knows what `/bookings` does, no service knows what the gateway's auth secret is, and the gateway knows nothing about Kafka topics or business rules.

Suggested implementation order (each step is a self-contained PR):

1. **`@irctc/telemetry`** — no behaviour change; just the new package + `pnpm install`.
2. **`@irctc/resilience`** — custom circuit breaker + unit tests (5i in Phase 5). Land before the gateway so the proxy can wrap calls on day one.
3. **`@irctc/ratelimit`** — token bucket + Lua. Land before the gateway for the same reason.
4. **`@irctc/idempotency`** — exported but not yet wired; bookings/payments will adopt it later.
5. **`@irctc/service-identity`** — V1 allow-all; the interface is the deliverable.
6. **`@irctc/auth-headers`** — dep-free reader.
7. **`apps/api-gateway`** — the big one. Validates locally with `pnpm --filter api-gateway dev` against the running host services before the Docker work.
8. **One-line `startTelemetry()` in each service's `server.ts`** — opt-in, in any order.
9. **`KafkaConsumerRunner` consumer-side `context.with(...)` wrap** — one place, runner owns the cross-cutting concern.
10. **Traefik + per-service Dockerfiles + `docker-compose.yml`** — last, because the network-isolation change (`expose:` instead of `ports:`) only makes sense once the gateway can actually answer on the host.

Follow-up PRs (each independent):

- **F1.** Migrate user-service routes from `authMiddleware` to `readUserFromHeaders` + `requireUser`. Drop `JWT_SECRET` from user-service. The Edge Auth pattern is then complete end-to-end.
- **F2.** Port `apps/notification-service/src/repositories/idempotency.repository.ts` onto `@irctc/idempotency` so the package and the only existing consumer are in sync.
- **F3.** Replace `AllowAllServiceIdentityVerifier` with the V2 mTLS or signed-service-token implementation. Single file change at the call site.
- **F4.** Add a Tempo / OTel collector to `docker-compose.yml` and a Grafana datasource. No code changes — the exporters are already plumbed.
- **F5.** Booking / payment / search services. They get the template Dockerfile, the gateway `upstreams` entry, and the routing table — the rest of the gateway machinery just works.
