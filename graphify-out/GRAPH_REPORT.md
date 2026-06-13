# Graph Report - itctc-clone  (2026-06-14)

## Corpus Check
- 228 files · ~51,805 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1484 nodes · 1708 edges · 115 communities (91 shown, 24 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `403ebc0d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 113|Community 113]]

## God Nodes (most connected - your core abstractions)
1. `IRCTC Clone` - 20 edges
2. `compilerOptions` - 19 edges
3. `compilerOptions` - 19 edges
4. ``user-service`` - 19 edges
5. `compilerOptions` - 18 edges
6. `successResponse()` - 17 edges
7. `paths` - 15 edges
8. `compilerOptions` - 15 edges
9. `AuthService` - 14 edges
10. `CircuitBreaker` - 13 edges

## Surprising Connections (you probably didn't know these)
- `liveCheck()` --calls--> `successResponse()`  [INFERRED]
  apps/api-gateway/src/health/health.controller.ts → packages/http/src/response/apiResponse.ts
- `readyCheck()` --calls--> `successResponse()`  [INFERRED]
  apps/api-gateway/src/health/health.controller.ts → packages/http/src/response/apiResponse.ts
- `getRateLimitMiddleware()` --calls--> `createRateLimitMiddleware()`  [INFERRED]
  apps/api-gateway/src/ratelimit/rateLimitMiddleware.ts → packages/ratelimit/src/express/rateLimitMiddleware.ts
- `bootstrap()` --calls--> `createConsumer()`  [INFERRED]
  apps/notification-service/src/container/notification.container.ts → packages/kafka/src/client/consumer.ts
- `liveCheck()` --calls--> `successResponse()`  [INFERRED]
  apps/notification-service/src/health/health.controller.ts → packages/http/src/response/apiResponse.ts

## Import Cycles
- 3-file cycle: `apps/user-service/src/generated/prisma/commonInputTypes.ts -> apps/user-service/src/generated/prisma/internal/prismaNamespace.ts -> apps/user-service/src/generated/prisma/models.ts -> apps/user-service/src/generated/prisma/commonInputTypes.ts`
- 3-file cycle: `apps/user-service/src/generated/prisma/internal/prismaNamespace.ts -> apps/user-service/src/generated/prisma/models.ts -> apps/user-service/src/generated/prisma/models/User.ts -> apps/user-service/src/generated/prisma/internal/prismaNamespace.ts`

## Communities (115 total, 24 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.02
Nodes (98): Args, At, AtLeast, AtLoose, AtStrict, BatchPayload, Boolean, BooleanFieldRefInput (+90 more)

### Community 1 - "Community 1"
Cohesion: 0.17
Nodes (6): UserMapper, PrismaClient, User, AuthRepository, @prisma/client, UserResponseDto

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (57): AggregateUser, BoolFieldUpdateOperationsInput, DateTimeFieldUpdateOperationsInput, GetUserAggregateType, GetUserGroupByPayload, Prisma__UserClient, StringFieldUpdateOperationsInput, UserAggregateArgs (+49 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (42): dependencies, cookie-parser, cors, dotenv, express, helmet, http-proxy-middleware, ioredis (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (5): EmailContent, EmailProvider, EmailProviderFactory, EmailProviderFactoryDeps, SendGridProvider

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (18): getConsumer(), getProducer(), initKafka(), kafka, getConsumer(), getProducer(), initKafka(), kafka (+10 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (22): dependencies, bcryptjs, cookie-parser, cors, dotenv, express, helmet, ioredis (+14 more)

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (37): API Gateway, Architecture, Backend, Booking Service, Build, Cache, Database, Database Setup (+29 more)

### Community 8 - "Community 8"
Cohesion: 0.05
Nodes (36): 1. send-otp (no auth required), 1s; with a token bucket, they get capacity (10) + refill (a few, 2. verify-otp (sets auth_token cookie), 3. /auth/sessions (auth required; gateway must inject X-User-Id), 4. Try to forge X-User-Id from outside the gateway, 5. Direct host-side access must be refused, 6. Exceed the auth-bucket capacity; expect 429, 7. Token-bucket boundary check (regression for the fixed-window bug) (+28 more)

### Community 9 - "Community 9"
Cohesion: 0.05
Nodes (36): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, jsx, module, moduleDetection (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.16
Nodes (8): liveCheck(), readyCheck(), liveCheck(), readyCheck(), AuthController, liveCheck(), readyCheck(), successResponse()

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (32): statusCode, StatusCodeKey, StatusCodeValue, getRequestId(), getTraceId(), getRequestContext(), RequestContext, requestContextStorage (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (35): dependencies, cors, dotenv, express, helmet, ioredis, @irctc/auth-headers, @irctc/contracts (+27 more)

### Community 13 - "Community 13"
Cohesion: 0.06
Nodes (31): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, module, moduleDetection, noUncheckedIndexedAccess (+23 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (29): devDependencies, prettier, turbo, typescript, engines, node, name, packageManager (+21 more)

### Community 15 - "Community 15"
Cohesion: 0.18
Nodes (10): CircuitBreaker, CircuitBreakerRegistry, CircuitBreakerState, CircuitBreakerOptions, CircuitOpenError, DEFAULT_OPTIONS, BackoffOptions, withExponentialBackoff() (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.08
Nodes (26): app, COOKIE_NAMES, ensureVaryUserId(), gatewayAuthMiddleware(), optionalGatewayAuthMiddleware(), AccessTokenPayload, verifyAccessToken(), ROUTES (+18 more)

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (28): dependencies, @opentelemetry/api, @opentelemetry/auto-instrumentations-node, @opentelemetry/exporter-trace-otlp-http, @opentelemetry/resources, @opentelemetry/sdk-node, @opentelemetry/sdk-trace-base, @opentelemetry/semantic-conventions (+20 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (13): BoolFilter, BoolWithAggregatesFilter, DateTimeFilter, DateTimeWithAggregatesFilter, NestedBoolFilter, NestedBoolWithAggregatesFilter, NestedDateTimeFilter, NestedDateTimeWithAggregatesFilter (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.10
Nodes (21): dependencies, devDependencies, @repo/typescript-config, @types/node, vitest, exports, ./propagation, import (+13 more)

### Community 20 - "Community 20"
Cohesion: 0.10
Nodes (19): Common Commands, Error Handling Flow, Error Handling Guidelines, Global Operations, Graceful Shutdown, graphify, Health Monitoring, Health Probes & Bootstrap Readiness (+11 more)

### Community 21 - "Community 21"
Cohesion: 0.10
Nodes (20): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-only-warn, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-turbo (+12 more)

### Community 22 - "Community 22"
Cohesion: 0.10
Nodes (20): dependencies, ioredis, devDependencies, @repo/typescript-config, @types/express, @types/node, vitest, exports (+12 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (18): dependencies, @irctc/errors, @irctc/http, @irctc/logger, zod, devDependencies, @repo/typescript-config, @types/express (+10 more)

### Community 24 - "Community 24"
Cohesion: 0.12
Nodes (16): dependencies, @irctc/errors, @opentelemetry/api, devDependencies, @repo/typescript-config, @types/node, exports, import (+8 more)

### Community 25 - "Community 25"
Cohesion: 0.11
Nodes (18): dependencies, @irctc/logger, @irctc/telemetry, kafkajs, @opentelemetry/api, devDependencies, @repo/typescript-config, @types/node (+10 more)

### Community 26 - "Community 26"
Cohesion: 0.12
Nodes (16): dependencies, @opentelemetry/api, pino, devDependencies, pino-pretty, @repo/typescript-config, exports, import (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (16): compilerOptions, declaration, declarationMap, esModuleInterop, incremental, isolatedModules, lib, module (+8 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (15): dependencies, zod, devDependencies, @repo/typescript-config, @types/node, exports, import, main (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (13): dependencies, devDependencies, @repo/typescript-config, exports, import, main, name, private (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.31
Nodes (6): createRateLimitMiddleware(), RateLimitMiddlewareOptions, LoggerLike, RateLimitResult, TokenBucketOptions, TokenBucketRateLimiter

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (13): 12. Rate limits & abuse prevention, 15. Configuration reference, 2. High-level architecture, 3. Component diagram, 4. Async registration flow (user-service ↔ notification-service), 5. Login flow, 7. Session management, Fingerprinting (+5 more)

### Community 32 - "Community 32"
Cohesion: 0.15
Nodes (8): IDEMPOTENCY_KEYS, IDEMPOTENCY_STATE, IdempotencyState, KAFKA_HEADERS, DLQ_REASONS, PROCESSING_STATUS, ProcessingStatus, Topics

### Community 34 - "Community 34"
Cohesion: 0.20
Nodes (9): compilerOptions, allowJs, jsx, module, moduleResolution, noEmit, plugins, extends (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.36
Nodes (5): HealthChecks, HealthService, probeDatabase(), probeKafka(), probeRedis()

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (4): config, LogOptions, PrismaClient, PrismaClientConstructor

### Community 41 - "Community 41"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 43 - "Community 43"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 44 - "Community 44"
Cohesion: 0.29
Nodes (4): OTPRequestedV1, OTPRequestedV1Type, UserLoggedInV1, UserLoggedInV1Type

### Community 45 - "Community 45"
Cohesion: 0.29
Nodes (7): 0a. `@irctc/telemetry`, 0b. `@irctc/resilience` — custom circuit breaker (V1, hand-rolled), 0c. `@irctc/ratelimit` — token bucket over Redis (Lua-atomic), 0d. `@irctc/idempotency` — three-phase Redis pattern, 0e. `@irctc/service-identity` — V1 placeholder, V2 mTLS, 0f. Reuse note for all five packages, Phase 0 — New shared packages

### Community 46 - "Community 46"
Cohesion: 0.29
Nodes (7): API Gateway + Traefik + Distributed Tracing — Implementation Plan, `apps/api-gateway/package.json`, `apps/api-gateway/tsconfig.json`, Architecture at a glance, Context, File tree, Phase 2 — `apps/api-gateway` service

### Community 47 - "Community 47"
Cohesion: 0.29
Nodes (6): compilerOptions, composite, outDir, rootDir, extends, include

### Community 48 - "Community 48"
Cohesion: 0.29
Nodes (6): compilerOptions, composite, outDir, rootDir, extends, include

### Community 49 - "Community 49"
Cohesion: 0.29
Nodes (6): compilerOptions, composite, outDir, rootDir, extends, include

### Community 50 - "Community 50"
Cohesion: 0.29
Nodes (6): license, name, private, publishConfig, access, version

### Community 51 - "Community 51"
Cohesion: 0.47
Nodes (3): config, nextJsConfig, config

### Community 52 - "Community 52"
Cohesion: 0.40
Nodes (3): REDACT_PATHS, __dirname, logger

### Community 53 - "Community 53"
Cohesion: 0.15
Nodes (11): shutdown(), startServer(), shutdown(), startServer(), shutdown(), startServer(), resolveOtlpTracesUrl(), shutdownTelemetry() (+3 more)

### Community 54 - "Community 54"
Cohesion: 0.33
Nodes (6): Files to edit, New files, Phase 1 — Auth lives in the gateway only, Verification, What moves where, Why a tiny package, not a per-service copy, not the full middleware

### Community 55 - "Community 55"
Cohesion: 0.33
Nodes (6): 13. Failure modes & rollback, Graceful shutdown, Kafka publish fails after Redis writes, `notification-service` is down, Postgres is down, Redis is down

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (6): 16. Local development, Build, One-time setup, Prerequisites, Run, Smoke test

### Community 59 - "Community 59"
Cohesion: 0.60
Nodes (4): buildConsumerSpanContext(), extractTraceContextFromKafkaHeaders(), KafkaHeaderMap, normaliseKafkaHeaders()

### Community 60 - "Community 60"
Cohesion: 0.40
Nodes (4): compilerOptions, jsx, extends, $schema

### Community 61 - "Community 61"
Cohesion: 0.40
Nodes (5): 10. API reference, Authenticated (require `auth_token` cookie), Cookie contract, Health, Public (unauthenticated)

### Community 62 - "Community 62"
Cohesion: 0.40
Nodes (5): 14. Startup, shutdown, and observability, Health endpoints, Logging & tracing, Shutdown sequence, Startup sequence (parallelised where possible)

### Community 63 - "Community 63"
Cohesion: 0.50
Nodes (4): 6. Token refresh & rotation, Fingerprint, Refresh token rotation, Reuse detection

### Community 64 - "Community 64"
Cohesion: 0.50
Nodes (4): 9. Kafka contract, `OTPRequestedV1` payload, Published events, Why a UUID for `eventId`?

### Community 66 - "Community 66"
Cohesion: 0.67
Nodes (3): 1. Responsibilities & non-responsibilities, Does NOT own, Owns

### Community 79 - "Community 79"
Cohesion: 0.08
Nodes (25): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, jsx, module, moduleDetection (+17 more)

### Community 80 - "Community 80"
Cohesion: 0.12
Nodes (17): dependencies, devDependencies, @repo/typescript-config, @types/node, vitest, exports, import, main (+9 more)

### Community 81 - "Community 81"
Cohesion: 0.11
Nodes (10): router, LoginRequestDto, LoginSchema, VerifyOtpRequestDto, VerifyOtpRequestSchema, AuthMapper, authControllerPromise, router (+2 more)

### Community 82 - "Community 82"
Cohesion: 0.13
Nodes (15): dependencies, devDependencies, @repo/typescript-config, @types/node, exports, import, main, name (+7 more)

### Community 83 - "Community 83"
Cohesion: 0.17
Nodes (6): build(), getAuthController(), OtpEventPublisher, SCHEMA_VERSION, SCHEMA_VERSION, UserLoggedInEventPublisher

### Community 84 - "Community 84"
Cohesion: 0.18
Nodes (7): ModelName, NullTypes, QueryMode, SortOrder, TransactionIsolationLevel, UserScalarFieldEnum, User

### Community 85 - "Community 85"
Cohesion: 0.19
Nodes (8): ERROR_MESSAGES, AUTH_DURATIONS, REDIS_KEYS, ERROR_CODES, ErrorCode, AccessTokenPayload, RefreshTokenPayload, RegistrationSessionData

### Community 86 - "Community 86"
Cohesion: 0.47
Nodes (4): HealthChecks, HealthService, probeRedis(), probeKafka()

### Community 88 - "Community 88"
Cohesion: 0.36
Nodes (4): LoggerLike, AllowAllServiceIdentityVerifier, ServiceIdentityResult, ServiceIdentityVerifier

### Community 90 - "Community 90"
Cohesion: 0.25
Nodes (7): compilerOptions, composite, outDir, rootDir, types, extends, include

### Community 91 - "Community 91"
Cohesion: 0.33
Nodes (4): COOKIE_MAX_AGE, COOKIE_NAMES, DURATION_TO_MS, getDeviceFingerprint()

### Community 93 - "Community 93"
Cohesion: 0.29
Nodes (6): compilerOptions, composite, outDir, rootDir, extends, include

### Community 94 - "Community 94"
Cohesion: 0.50
Nodes (3): HealthChecks, HealthService, probeRedis()

### Community 103 - "Community 103"
Cohesion: 0.50
Nodes (4): requireUser(), AuthUser, getHeaderString(), readUserFromHeaders()

### Community 105 - "Community 105"
Cohesion: 0.18
Nodes (11): devDependencies, prisma, @repo/typescript-config, tsc-alias, tsx, @types/cookie-parser, @types/cors, @types/express (+3 more)

### Community 106 - "Community 106"
Cohesion: 0.12
Nodes (16): Full LGTM Stack, Grafana, IRCTC Example, Loki (Logs), One sentence summary, Phase 1 (already done), Phase 2, Phase 3 (+8 more)

### Community 107 - "Community 107"
Cohesion: 0.22
Nodes (4): env, getEmailVendor(), bootstrap(), EmailVendor

### Community 108 - "Community 108"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, test, type, version

### Community 109 - "Community 109"
Cohesion: 0.29
Nodes (4): SendEmailCommand, OtpEmailInput, renderOtpEmail(), WelcomeEmailInput

### Community 111 - "Community 111"
Cohesion: 0.33
Nodes (3): RegisterRequestDto, RegisterSchema, generateOtp()

## Knowledge Gaps
- **877 isolated node(s):** `name`, `version`, `private`, `type`, `dev` (+872 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `successResponse()` connect `Community 10` to `Community 11`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `AuthController` connect `Community 10` to `Community 91`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _877 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.020202020202020204 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.034482758620689655 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.048726467331118496 - nodes in this community are weakly interconnected._