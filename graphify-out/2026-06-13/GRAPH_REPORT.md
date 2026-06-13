# Graph Report - irctc-clone (2026-06-13)

## Corpus Check

- 179 files · ~44,647 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 1228 nodes · 1432 edges · 100 communities (81 shown, 19 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `50087a6a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- [[_COMMUNITY_Prisma Generated Types|Prisma Generated Types]]
- [[_COMMUNITY_User Service Server & DTOs|User Service Server & DTOs]]
- [[_COMMUNITY_Prisma User Model|Prisma User Model]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Kafka Client Package|Kafka Client Package]]
- [[_COMMUNITY_User Service Dependencies|User Service Dependencies]]
- [[_COMMUNITY_Auth Response & Prisma Client|Auth Response & Prisma Client]]
- [[_COMMUNITY_TS Config - Service Base|TS Config - Service Base]]
- [[_COMMUNITY_Env & Server Bootstrap|Env & Server Bootstrap]]
- [[_COMMUNITY_HTTP Package Utilities|HTTP Package Utilities]]
- [[_COMMUNITY_Notification Service Dependencies|Notification Service Dependencies]]
- [[_COMMUNITY_TS Config - Package Base|TS Config - Package Base]]
- [[_COMMUNITY_Root Workspace Config|Root Workspace Config]]
- [[_COMMUNITY_Errors Package Core|Errors Package Core]]
- [[_COMMUNITY_ESLint Config Package|ESLint Config Package]]
- [[_COMMUNITY_HTTP Package Dependencies|HTTP Package Dependencies]]
- [[_COMMUNITY_TelemetryLibrary Deps|Telemetry/Library Deps]]
- [[_COMMUNITY_Kafka Package Dependencies|Kafka Package Dependencies]]
- [[_COMMUNITY_Logger Package|Logger Package]]
- [[_COMMUNITY_TS Config - Base|TS Config - Base]]
- [[_COMMUNITY_Middleware Dependencies|Middleware Dependencies]]
- [[_COMMUNITY_Contracts Package|Contracts Package]]
- [[_COMMUNITY_Prisma Filter Types|Prisma Filter Types]]
- [[_COMMUNITY_Health Check Endpoints|Health Check Endpoints]]
- [[_COMMUNITY_Notification Constants|Notification Constants]]
- [[_COMMUNITY_Prisma Browser Namespace|Prisma Browser Namespace]]
- [[_COMMUNITY_User Auth Container & Publisher|User Auth Container & Publisher]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_TS Config - Next.js|TS Config - Next.js]]
- [[_COMMUNITY_Health Service Checks|Health Service Checks]]
- [[_COMMUNITY_TS Config - User Service|TS Config - User Service]]
- [[_COMMUNITY_TS Config - Notification|TS Config - Notification]]
- [[_COMMUNITY_TS Config - HTTP|TS Config - HTTP]]
- [[_COMMUNITY_Prisma Internal Class|Prisma Internal Class]]
- [[_COMMUNITY_TS Config - Errors|TS Config - Errors]]
- [[_COMMUNITY_TS Config - Logger|TS Config - Logger]]
- [[_COMMUNITY_TS Config - Middleware|TS Config - Middleware]]
- [[_COMMUNITY_Workspace Package Metadata|Workspace Package Metadata]]
- [[_COMMUNITY_User Service Routes|User Service Routes]]
- [[_COMMUNITY_Notification OTP Consumer|Notification OTP Consumer]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]

## God Nodes (most connected - your core abstractions)

1. `IRCTC Clone` - 24 edges
2. `compilerOptions` - 19 edges
3. `user-service` - 19 edges
4. `compilerOptions` - 18 edges
5. `paths` - 15 edges
6. `successResponse()` - 15 edges
7. `compilerOptions` - 15 edges
8. `AuthService` - 14 edges
9. `CircuitBreaker` - 13 edges
10. `AuthController` - 12 edges

## Surprising Connections (you probably didn't know these)

- `bootstrap()` --calls--> `createConsumer()` [INFERRED]
  apps/notification-service/src/container/notification.container.ts → packages/kafka/src/client/consumer.ts
- `liveCheck()` --calls--> `successResponse()` [INFERRED]
  apps/user-service/src/controllers/health.controller.ts → packages/http/src/response/apiResponse.ts
- `readyCheck()` --calls--> `successResponse()` [INFERRED]
  apps/user-service/src/controllers/health.controller.ts → packages/http/src/response/apiResponse.ts
- `Async Registration Flow (send-otp -> Kafka -> notification-service)` --implements--> `Error Handling Flow` [INFERRED]
  apps/user-service/README.md → CLAUDE.md
- `getConsumer()` --calls--> `createConsumer()` [INFERRED]
  apps/notification-service/src/config/kafka.ts → packages/kafka/src/client/consumer.ts

## Import Cycles

- 3-file cycle: `apps/user-service/src/generated/prisma/commonInputTypes.ts -> apps/user-service/src/generated/prisma/internal/prismaNamespace.ts -> apps/user-service/src/generated/prisma/models.ts -> apps/user-service/src/generated/prisma/commonInputTypes.ts`
- 3-file cycle: `apps/user-service/src/generated/prisma/internal/prismaNamespace.ts -> apps/user-service/src/generated/prisma/models.ts -> apps/user-service/src/generated/prisma/models/User.ts -> apps/user-service/src/generated/prisma/internal/prismaNamespace.ts`

## Hyperedges (group relationships)

- **IRCTC Microservices Collective** — claude_api_gateway, claude_user_service, claude_booking_service, claude_payment_service, claude_search_service, claude_notification_service [EXTRACTED 1.00]
- **Shared @irctc/\* Packages** — claude_pkg_errors, claude_pkg_http, claude_pkg_logger, claude_pkg_middleware, claude_pkg_kafka, claude_pkg_contracts, claude_pkg_telemetry [EXTRACTED 1.00]
- **user-service Async OTP Email Flow** — user_service_async_registration_flow, user_service_kafka_contract, docker_kafka_topic_otp, claude_notification_service, user_service_redis_keys [INFERRED 0.85]

## Communities (100 total, 19 thin omitted)

### Community 0 - "Prisma Generated Types"

Cohesion: 0.02
Nodes (98): Args, At, AtLeast, AtLoose, AtStrict, BatchPayload, Boolean, BooleanFieldRefInput (+90 more)

### Community 2 - "Prisma User Model"

Cohesion: 0.03
Nodes (57): AggregateUser, BoolFieldUpdateOperationsInput, DateTimeFieldUpdateOperationsInput, GetUserAggregateType, GetUserGroupByPayload, Prisma\_\_UserClient, StringFieldUpdateOperationsInput, UserAggregateArgs (+49 more)

### Community 3 - "Community 3"

Cohesion: 0.21
Nodes (6): LoginSchema, VerifyOtpRequestSchema, RegisterRequestDto, RegisterSchema, authControllerPromise, router

### Community 4 - "Kafka Client Package"

Cohesion: 0.07
Nodes (9): KafkaProducerManager, KafkaConsumerRunner, LoggerLike, MessageHandler, DLQ_REASONS, DlqReason, KAFKA_HEADERS, RetryPolicies (+1 more)

### Community 5 - "User Service Dependencies"

Cohesion: 0.05
Nodes (40): dependencies, bcryptjs, cookie-parser, cors, dotenv, express, helmet, ioredis (+32 more)

### Community 6 - "Auth Response & Prisma Client"

Cohesion: 0.14
Nodes (6): globalForPrisma, AuthMapper, UserMapper, PrismaClient, User, AuthRepository

### Community 7 - "TS Config - Service Base"

Cohesion: 0.05
Nodes (36): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, jsx, module, moduleDetection (+28 more)

### Community 8 - "Env & Server Bootstrap"

Cohesion: 0.25
Nodes (6): EmailContent, EmailProvider, SendEmailCommand, EmailProviderFactory, EmailProviderFactoryDeps, SendGridProvider

### Community 9 - "HTTP Package Utilities"

Cohesion: 0.09
Nodes (16): statusCode, StatusCodeKey, StatusCodeValue, getRequestId(), getTraceId(), getRequestContext(), RequestContext, requestContextStorage (+8 more)

### Community 10 - "Notification Service Dependencies"

Cohesion: 0.06
Nodes (33): dependencies, cors, dotenv, express, helmet, ioredis, @irctc/contracts, @irctc/errors (+25 more)

### Community 11 - "TS Config - Package Base"

Cohesion: 0.06
Nodes (31): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, module, moduleDetection, noUncheckedIndexedAccess (+23 more)

### Community 12 - "Root Workspace Config"

Cohesion: 0.06
Nodes (29): devDependencies, prettier, turbo, typescript, engines, node, name, packageManager (+21 more)

### Community 13 - "Errors Package Core"

Cohesion: 0.16
Nodes (18): startServer(), ApiError, createErrorResponse(), ErrorInput, ERROR_CODES, ErrorCode, ErrorContract, ERROR_MESSAGES (+10 more)

### Community 14 - "ESLint Config Package"

Cohesion: 0.10
Nodes (20): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-only-warn, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-turbo (+12 more)

### Community 15 - "HTTP Package Dependencies"

Cohesion: 0.11
Nodes (18): dependencies, @irctc/errors, @irctc/http, @irctc/logger, zod, devDependencies, @repo/typescript-config, @types/express (+10 more)

### Community 16 - "Telemetry/Library Deps"

Cohesion: 0.12
Nodes (16): dependencies, @irctc/errors, @opentelemetry/api, devDependencies, @repo/typescript-config, @types/node, exports, import (+8 more)

### Community 17 - "Kafka Package Dependencies"

Cohesion: 0.12
Nodes (16): dependencies, @irctc/logger, kafkajs, devDependencies, @repo/typescript-config, @types/node, exports, import (+8 more)

### Community 18 - "Logger Package"

Cohesion: 0.12
Nodes (16): dependencies, @opentelemetry/api, pino, devDependencies, pino-pretty, @repo/typescript-config, exports, import (+8 more)

### Community 19 - "TS Config - Base"

Cohesion: 0.12
Nodes (16): compilerOptions, declaration, declarationMap, esModuleInterop, incremental, isolatedModules, lib, module (+8 more)

### Community 20 - "Middleware Dependencies"

Cohesion: 0.13
Nodes (15): dependencies, zod, devDependencies, @repo/typescript-config, @types/node, exports, import, main (+7 more)

### Community 21 - "Contracts Package"

Cohesion: 0.15
Nodes (13): dependencies, devDependencies, @repo/typescript-config, exports, import, main, name, private (+5 more)

### Community 22 - "Prisma Filter Types"

Cohesion: 0.14
Nodes (13): BoolFilter, BoolWithAggregatesFilter, DateTimeFilter, DateTimeWithAggregatesFilter, NestedBoolFilter, NestedBoolWithAggregatesFilter, NestedDateTimeFilter, NestedDateTimeWithAggregatesFilter (+5 more)

### Community 23 - "Health Check Endpoints"

Cohesion: 0.13
Nodes (11): router, AuthController, liveCheck(), readyCheck(), liveCheck(), readyCheck(), HealthChecks, HealthService (+3 more)

### Community 24 - "Notification Constants"

Cohesion: 0.15
Nodes (8): IDEMPOTENCY_KEYS, IDEMPOTENCY_STATE, IdempotencyState, KAFKA_HEADERS, DLQ_REASONS, PROCESSING_STATUS, ProcessingStatus, Topics

### Community 25 - "Prisma Browser Namespace"

Cohesion: 0.17
Nodes (6): build(), getAuthController(), OtpEventPublisher, SCHEMA_VERSION, SCHEMA_VERSION, UserLoggedInEventPublisher

### Community 26 - "User Auth Container & Publisher"

Cohesion: 0.11
Nodes (18): Architecture, Build, Database Setup, Development, Environment Variables, Future Roadmap, Installation, IRCTC Clone (+10 more)

### Community 27 - "Community 27"

Cohesion: 0.19
Nodes (7): REDIS_KEYS, ERROR_CODES, ErrorCode, ERROR_MESSAGES, AccessTokenPayload, AuthUser, RegistrationSessionData

### Community 28 - "TS Config - Next.js"

Cohesion: 0.20
Nodes (9): compilerOptions, allowJs, jsx, module, moduleResolution, noEmit, plugins, extends (+1 more)

### Community 29 - "Health Service Checks"

Cohesion: 0.36
Nodes (5): HealthChecks, HealthService, probeDatabase(), probeKafka(), probeRedis()

### Community 30 - "TS Config - User Service"

Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 31 - "TS Config - Notification"

Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 32 - "TS Config - HTTP"

Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 33 - "Prisma Internal Class"

Cohesion: 0.29
Nodes (4): config, LogOptions, PrismaClient, PrismaClientConstructor

### Community 34 - "TS Config - Errors"

Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 35 - "TS Config - Logger"

Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 36 - "TS Config - Middleware"

Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 37 - "Workspace Package Metadata"

Cohesion: 0.29
Nodes (6): license, name, private, publishConfig, access, version

### Community 38 - "User Service Routes"

Cohesion: 0.43
Nodes (7): user-service API Reference (REST endpoints), Login Flow (email+password, fingerprint, JWT issuance), Rate Limits (5 OTP-send/hr, 5 verify attempts/TTL), Redis Data Model (auth:\* keys), Refresh Token Rotation & Reuse Detection, Security Model (bcrypt OTPs, sha256 refresh tokens, fingerprinting), Multi-Device Session Management (Redis set per user)

### Community 40 - "Community 40"

Cohesion: 0.47
Nodes (3): config, nextJsConfig, config

### Community 41 - "Community 41"

Cohesion: 0.40
Nodes (3): REDACT_PATHS, \_\_dirname, logger

### Community 45 - "Community 45"

Cohesion: 0.40
Nodes (4): compilerOptions, jsx, extends, $schema

### Community 46 - "Community 46"

Cohesion: 0.38
Nodes (4): AUTH_DURATIONS, AccessTokenPayload, RefreshTokenPayload, generateOtp()

### Community 47 - "Community 47"

Cohesion: 0.36
Nodes (4): COOKIE_MAX_AGE, COOKIE_NAMES, DURATION_TO_MS, getDeviceFingerprint()

### Community 58 - "Community 58"

Cohesion: 0.15
Nodes (13): 12. Rate limits & abuse prevention, 15. Configuration reference, 2. High-level architecture, 3. Component diagram, 4. Async registration flow (user-service ↔ notification-service), 7. Session management, 8. Redis data model, See also (+5 more)

### Community 59 - "Community 59"

Cohesion: 0.29
Nodes (5): Common Commands, Global Operations, graphify, JSDoc Guidelines, Service-Specific Operations

### Community 60 - "Community 60"

Cohesion: 0.39
Nodes (8): Graceful Shutdown, Health Monitoring, Infrastructure Guidelines, Kafka Architecture, Startup Sequence, Async Registration Flow (send-otp -> Kafka -> notification-service), Failure Modes & Rollback (Kafka publish, Redis down, Postgres down), OTPRequestedV1 Kafka Contract

### Community 61 - "Community 61"

Cohesion: 0.25
Nodes (8): Backend, Cache, Database, Infrastructure, Messaging, Observability, Technology Stack, Validation

### Community 62 - "Community 62"

Cohesion: 0.33
Nodes (6): API Gateway, Booking Service, Microservices, Payment Service, Search Service, User Service

### Community 63 - "Community 63"

Cohesion: 0.33
Nodes (6): Grafana, Loki, Observability, OpenTelemetry, Prometheus, Tempo

### Community 64 - "Community 64"

Cohesion: 0.33
Nodes (6): 13. Failure modes & rollback, Graceful shutdown, Kafka publish fails after Redis writes, `notification-service` is down, Postgres is down, Redis is down

### Community 65 - "Community 65"

Cohesion: 0.33
Nodes (6): 16. Local development, Build, One-time setup, Prerequisites, Run, Smoke test

### Community 66 - "Community 66"

Cohesion: 0.40
Nodes (5): 10. API reference, Authenticated (require `auth_token` cookie), Cookie contract, Health, Public (unauthenticated)

### Community 67 - "Community 67"

Cohesion: 0.40
Nodes (5): 14. Startup, shutdown, and observability, Health endpoints, Logging & tracing, Shutdown sequence, Startup sequence (parallelised where possible)

### Community 68 - "Community 68"

Cohesion: 0.50
Nodes (4): 6. Token refresh & rotation, Fingerprint, Refresh token rotation, Reuse detection

### Community 69 - "Community 69"

Cohesion: 0.50
Nodes (4): 9. Kafka contract, `OTPRequestedV1` payload, Published events, Why a UUID for `eventId`?

### Community 70 - "Community 70"

Cohesion: 0.67
Nodes (3): 1. Responsibilities & non-responsibilities, Does NOT own, Owns

### Community 72 - "Community 72"

Cohesion: 0.29
Nodes (4): app, router, authControllerPromise, router

### Community 73 - "Community 73"

Cohesion: 0.22
Nodes (9): Error Handling Flow, Error Handling Guidelines, Health Probes & Bootstrap Readiness, High-Level Architecture, Idempotency for Side-Effecting Consumers, Logging & PII, Monorepo Structure, Service Internal Pattern (+1 more)

### Community 77 - "Community 77"

Cohesion: 0.05
Nodes (36): 1. send-otp (no auth required), 1s; with a token bucket, they get capacity (10) + refill (a few, 2. verify-otp (sets auth_token cookie), 3. /auth/sessions (auth required; gateway must inject X-User-Id), 4. Try to forge X-User-Id from outside the gateway, 5. Direct host-side access must be refused, 6. Exceed the auth-bucket capacity; expect 429, 7. Token-bucket boundary check (regression for the fixed-window bug) (+28 more)

### Community 78 - "Community 78"

Cohesion: 0.18
Nodes (10): CircuitBreaker, CircuitBreakerRegistry, CircuitBreakerState, CircuitBreakerOptions, CircuitOpenError, DEFAULT_OPTIONS, BackoffOptions, withExponentialBackoff() (+2 more)

### Community 79 - "Community 79"

Cohesion: 0.08
Nodes (26): dependencies, @opentelemetry/api, @opentelemetry/auto-instrumentations-node, @opentelemetry/exporter-trace-otlp-http, @opentelemetry/resources, @opentelemetry/sdk-node, @opentelemetry/sdk-trace-base, @opentelemetry/semantic-conventions (+18 more)

### Community 80 - "Community 80"

Cohesion: 0.29
Nodes (4): OTPRequestedV1, OTPRequestedV1Type, UserLoggedInV1, UserLoggedInV1Type

### Community 81 - "Community 81"

Cohesion: 0.10
Nodes (21): dependencies, devDependencies, @repo/typescript-config, @types/node, vitest, exports, ./propagation, import (+13 more)

### Community 83 - "Community 83"

Cohesion: 0.29
Nodes (7): 0a. `@irctc/telemetry`, 0b. `@irctc/resilience` — custom circuit breaker (V1, hand-rolled), 0c. `@irctc/ratelimit` — token bucket over Redis (Lua-atomic), 0d. `@irctc/idempotency` — three-phase Redis pattern, 0e. `@irctc/service-identity` — V1 placeholder, V2 mTLS, 0f. Reuse note for all five packages, Phase 0 — New shared packages

### Community 84 - "Community 84"

Cohesion: 0.29
Nodes (7): API Gateway + Traefik + Distributed Tracing — Implementation Plan, `apps/api-gateway/package.json`, `apps/api-gateway/tsconfig.json`, Architecture at a glance, Context, File tree, Phase 2 — `apps/api-gateway` service

### Community 85 - "Community 85"

Cohesion: 0.29
Nodes (6): compilerOptions, composite, outDir, rootDir, extends, include

### Community 86 - "Community 86"

Cohesion: 0.29
Nodes (6): compilerOptions, composite, outDir, rootDir, extends, include

### Community 87 - "Community 87"

Cohesion: 0.40
Nodes (3): resolveOtlpTracesUrl(), startTelemetry(), TelemetryOptions

### Community 88 - "Community 88"

Cohesion: 0.33
Nodes (6): Files to edit, New files, Phase 1 — Auth lives in the gateway only, Verification, What moves where, Why a tiny package, not a per-service copy, not the full middleware

### Community 89 - "Community 89"

Cohesion: 0.60
Nodes (4): buildConsumerSpanContext(), extractTraceContextFromKafkaHeaders(), KafkaHeaderMap, normaliseKafkaHeaders()

### Community 91 - "Community 91"

Cohesion: 0.18
Nodes (5): AuthResponseDto, LoginRequestDto, VerifyOtpRequestDto, AuthService, UserResponseDto

### Community 92 - "Community 92"

Cohesion: 0.18
Nodes (7): ModelName, NullTypes, QueryMode, SortOrder, TransactionIsolationLevel, UserScalarFieldEnum, User

### Community 93 - "Community 93"

Cohesion: 0.25
Nodes (6): getConsumer(), getProducer(), initKafka(), kafka, getConsumer(), createConsumer()

### Community 95 - "Community 95"

Cohesion: 0.29
Nodes (4): OtpEmailInput, renderOtpEmail(), renderWelcomeEmail(), WelcomeEmailInput

### Community 96 - "Community 96"

Cohesion: 0.33
Nodes (3): env, getEmailVendor(), EmailVendor

### Community 98 - "Community 98"

Cohesion: 0.40
Nodes (3): getProducer(), initKafka(), kafka

## Knowledge Gaps

- **725 isolated node(s):** `name`, `version`, `private`, `type`, `main` (+720 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `AuthController` connect `Health Check Endpoints` to `Community 47`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `successResponse()` connect `Health Check Endpoints` to `HTTP Package Utilities`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `AuthResponseDto` connect `Community 91` to `Community 46`, `Auth Response & Prisma Client`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _726 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Prisma Generated Types` be split into smaller, more focused modules?**
  _Cohesion score 0.020202020202020204 - nodes in this community are weakly interconnected._
- **Should `Prisma User Model` be split into smaller, more focused modules?**
  _Cohesion score 0.034482758620689655 - nodes in this community are weakly interconnected._
- **Should `Kafka Client Package` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
