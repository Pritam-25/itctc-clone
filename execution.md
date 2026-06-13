Ten separate PRs, not one giant PR. Here's why and how.

Why separate PRs

A single PR for this would be roughly 30+ files across 5 new packages, a new service, Dockerfiles, and docker-compose.yml. The review surface is too large for a thoughtful review, the diff is too long to
bisect, and if Phase 4 (Traefik + Docker) breaks, you can't tell whether the bug is in the gateway or in the network config. Each step below is independently revertable, reviewable in 30 minutes, and
mergeable in a day.

The order

The 10-step implementation order I put at the bottom of plan.md is the same as the PR order. The rule is: each PR is small and self-contained, and no PR depends on a future PR.

PR 1 — @irctc/telemetry (~6 files, half a day)

- New packages/telemetry/{package.json, tsconfig.json, src/index.ts, src/propagation.ts}.
- pnpm install to wire it into the workspace.
- No behaviour change. CI goes green on the same baseline.
- Why first: every other PR calls startTelemetry(). Land this and the build works.

PR 2 — @irctc/resilience + unit tests (~8 files, one day)

- packages/resilience/{package.json, tsconfig.json, src/circuit-breaker/{CircuitBreaker.ts, CircuitBreakerState.ts, CircuitBreakerRegistry.ts, types.ts}, src/retry/ExponentialBackoff.ts,
  src/timeout/withTimeout.ts, src/index.ts}.
- packages/resilience/src/circuit-breaker/**tests**/CircuitBreaker.test.ts covering the 5i unit-test cases from the plan (CLOSED→OPEN after N failures, OPEN fail-fast, recoveryTimeoutMs,
  HALF_OPEN→CLOSED, HALF_OPEN→OPEN, timeoutMs, halfOpenMaxTrials).
- Use vitest (the repo's existing test runner choice based on the exclude list vitest.config.ts in tsconfig.json).
- Why second: the gateway's proxy needs this on day one. If you ship the gateway without a breaker, every flaky upstream is a 5-second hang.

PR 3 — @irctc/ratelimit + unit tests (~6 files, half a day)

- packages/ratelimit/{package.json, tsconfig.json, src/token-bucket/{TokenBucketRateLimiter.ts, lua/increment-token.lua}, src/express/rateLimitMiddleware.ts, src/index.ts}.
- Unit tests for the Lua: concurrent consume against a real Redis (or a fakeredis test double) and a capacity=10, refill=10/60s boundary case.
- Why third: gateway's ratelimit/rateLimitMiddleware.ts is a thin wrapper around this. If the algorithm is wrong, you want to know in PR 3, not PR 7.

PR 4 — @irctc/idempotency + unit tests (~6 files, half a day)

- packages/idempotency/{package.json, tsconfig.json, src/{types.ts, RedisIdempotencyStore.ts}, src/express/idempotencyMiddleware.ts, src/index.ts}.
- Unit tests: reserveIfNew then markProcessed then second reserveIfNew returns COMPLETED; reserveIfNew then release then second reserveIfNew returns NEW; lease TTL expiry returns NEW again.
- Why fourth: exported but not wired. Booking/payment adopt it in their own PRs.

PR 5 — @irctc/service-identity (~5 files, half a day)

- packages/service-identity/{package.json, tsconfig.json, src/{types.ts, AllowAllServiceIdentityVerifier.ts}, src/index.ts}.
- No tests needed — the V1 implementation is a one-liner. The interface is the deliverable.

PR 6 — @irctc/auth-headers (~3 files, half a day)

- packages/auth-headers/{package.json, tsconfig.json, src/index.ts}.
- Add the dep to user-service, notification-service, booking-service package.json files. No service code uses it yet — the import is in package.json only.
- Why sixth: the gateway needs this contract ready when it lands. The user-service migration to header-trust is a separate follow-up PR (F1) that uses this package.

PR 7 — apps/api-gateway (the big one, ~25 files, 2–3 days)

- Everything in Phase 2: the new folder structure, the typed upstreams, the auth layer, the routing layer, the rate-limit wrapper, the proxy with circuit breaker + timeout, the telemetry middleware, the
  service-identity verifier, the self-only health probe, the env file, the Dockerfile.
- Validates locally with pnpm --filter api-gateway dev against the running host services on their existing ports (4001, 4002, 4003). The host-port-4001 dev workflow keeps working.
- Why seventh: you can demo the gateway end-to-end against the existing services before the Docker work.

PR 8 — one-line startTelemetry() in each service's server.ts (3 PRs or 1 PR with 3 commits, half a day)

- apps/user-service/src/server.ts: await startTelemetry({ serviceName: 'user-service' }) after initRedis().
- apps/notification-service/src/server.ts: same, before bootstrap().
- apps/booking-service/src/server.ts: same.
- Why eighth: the SDK is bootstrap once per process. If you forget the order in notification-service, the first consumed Kafka message is untraced.
- Can be split as 3 small PRs or one PR with 3 commits. Three small PRs is cleaner for review.

PR 9 — KafkaConsumerRunner consumer-side context.with(...) wrap (~1 file, half a day)

- packages/kafka/src/consumer-runner/kafka-consumer-runner.ts — the only file that changes.
- propagateTraceContext: boolean = true constructor option for tests.
- Why ninth: end-to-end traces from a user click into a Kafka consumer become possible. This is the final "two manual touchpoints" closure.

PR 10 — Traefik + per-service Dockerfiles + docker-compose.yml (half a day)

- apps/api-gateway/Dockerfile, apps/user-service/Dockerfile, apps/notification-service/Dockerfile, apps/booking-service/Dockerfile.
- infra/traefik/traefik.yml, infra/traefik/dynamic/middlewares.yml.
- docker-compose.yml updates: add traefik, api-gateway, user-service, notification-service, booking-service services. Per-service apps get expose: instead of ports:. Add healthcheck: blocks per service.
- docker compose config validates the compose file. docker compose up -d --build brings the whole stack up.
- Why last: the network-isolation change (expose: instead of ports:) only makes sense once the gateway can actually answer on the host. Until PR 7 is in, breaking the host-port-4001 dev workflow would
  block everyone.

The 5 follow-up PRs (after the stack is live)

┌─────┬─────────────────────────────────────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────┐
│ PR │ What │ Why separate │
├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ F1 │ Migrate user-service routes from authMiddleware to readUserFromHeaders + requireUser. Drop │ The most security-sensitive change in the plan. Land after the gateway is in production │
│ │ JWT_SECRET from user-service. │ so the dev workflow has a working fallback. │
├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ F2 │ Port apps/notification-service/src/repositories/idempotency.repository.ts onto @irctc/idempotency. │ Keeps the package and the only existing consumer in sync. │
├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ F3 │ Replace AllowAllServiceIdentityVerifier with the V2 mTLS or signed-service-token implementation. │ Single file change at the call site. │
├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ F4 │ Add Tempo + OTel collector + Grafana to docker-compose.yml. │ No code changes — the exporters are already plumbed. │
├─────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────┤
│ F5 │ Booking / payment / search services. │ Each gets the template Dockerfile, the gateway upstreams entry, and the routing table — │
│ │ │ the rest of the gateway machinery just works. │
└─────┴─────────────────────────────────────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────┘

Total timeline

┌──────────────────────────┬───────┬────────────────────────┐
│ Stage │ PRs │ Effort │
├──────────────────────────┼───────┼────────────────────────┤
│ New shared packages │ 1–6 │ ~4 days │
├──────────────────────────┼───────┼────────────────────────┤
│ Gateway │ 7 │ 2–3 days │
├──────────────────────────┼───────┼────────────────────────┤
│ Wire telemetry + tracing │ 8–9 │ 1 day │
├──────────────────────────┼───────┼────────────────────────┤
│ Docker / Traefik │ 10 │ 0.5 day │
├──────────────────────────┼───────┼────────────────────────┤
│ Total for the 10 PRs │ │ ~7–8 working days │
├──────────────────────────┼───────┼────────────────────────┤
│ Follow-ups │ F1–F5 │ as needed, each ~1 day │
└──────────────────────────┴───────┴────────────────────────┘

Branch / commit hygiene tips

- One feature branch per PR off main. Rebase before merge.
- PR titles that match the package name: feat(telemetry): …, feat(resilience): …, feat(gateway): …. Makes git log --oneline readable.
- The PR that adds apps/api-gateway/package.json should also bump the workspace's pnpm-lock.yaml once, not 10 times across 10 PRs. The cleanest way is to run pnpm install in PR 6 (auth-headers adds the
  workspace deps) and let the rest inherit the updated lockfile.
- Tag each merged PR with its phase: git tag gateway-phase-2 api-gateway-main. Useful if you ever need to bisect.

What not to do

- Don't squash-merge the 10 PRs into one mega-commit. That destroys the history that lets you bisect. Use "merge commit" or "rebase and merge".
- Don't land PR 7 (gateway) before PRs 1–6 are merged. The gateway's package.json will reference workspace packages that don't exist yet and pnpm install will fail.
- Don't land PR 10 (Docker) as part of PR 7. The Docker work is its own diff. If the gateway works on the host but the Docker build fails, you don't want to roll back the gateway.
- Don't skip the unit tests in PRs 2, 3, 4. The custom circuit breaker and the Lua-based rate limiter both deserve regression coverage. The gateway's wrapper is thin enough that the bugs will be in the
  shared package, not the wrapper.

The plan in D:\dev\irctc-clone\plan.md already mirrors this order in its closing "Suggested implementation order" section. When you're ready to start, kick off with PR 1 (@irctc/telemetry) and I'll work
through them in sequence.
