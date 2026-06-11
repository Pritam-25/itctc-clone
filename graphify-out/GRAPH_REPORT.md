# Graph Report - itctc-clone  (2026-06-11)

## Corpus Check
- 169 files · ~43,129 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1155 nodes · 1300 edges · 72 communities (60 shown, 12 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fc1d4238`
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
- [[_COMMUNITY_TS Config - Errors|TS Config - Errors]]
- [[_COMMUNITY_TS Config - Logger|TS Config - Logger]]
- [[_COMMUNITY_TS Config - Middleware|TS Config - Middleware]]
- [[_COMMUNITY_Workspace Package Metadata|Workspace Package Metadata]]
- [[_COMMUNITY_User Service Routes|User Service Routes]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 56|Community 56]]
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

## God Nodes (most connected - your core abstractions)
1. `IRCTC Clone` - 20 edges
2. `compilerOptions` - 19 edges
3. ``user-service`` - 19 edges
4. `compilerOptions` - 18 edges
5. `paths` - 15 edges
6. `successResponse()` - 15 edges
7. `compilerOptions` - 15 edges
8. `AuthService` - 14 edges
9. `AuthController` - 12 edges
10. `paths` - 11 edges

## Surprising Connections (you probably didn't know these)
- `liveCheck()` --calls--> `successResponse()`  [INFERRED]
  apps/user-service/src/controllers/health.controller.ts → packages/http/src/response/apiResponse.ts
- `readyCheck()` --calls--> `successResponse()`  [INFERRED]
  apps/user-service/src/controllers/health.controller.ts → packages/http/src/response/apiResponse.ts
- `getConsumer()` --calls--> `createConsumer()`  [INFERRED]
  apps/notification-service/src/config/kafka.ts → packages/kafka/src/client/consumer.ts
- `bootstrap()` --calls--> `createConsumer()`  [INFERRED]
  apps/notification-service/src/container/notification.container.ts → packages/kafka/src/client/consumer.ts
- `liveCheck()` --calls--> `successResponse()`  [INFERRED]
  apps/notification-service/src/health/health.controller.ts → packages/http/src/response/apiResponse.ts

## Import Cycles
- 3-file cycle: `apps/user-service/src/generated/prisma/commonInputTypes.ts -> apps/user-service/src/generated/prisma/internal/prismaNamespace.ts -> apps/user-service/src/generated/prisma/models.ts -> apps/user-service/src/generated/prisma/commonInputTypes.ts`
- 3-file cycle: `apps/user-service/src/generated/prisma/internal/prismaNamespace.ts -> apps/user-service/src/generated/prisma/models.ts -> apps/user-service/src/generated/prisma/models/User.ts -> apps/user-service/src/generated/prisma/internal/prismaNamespace.ts`

## Communities (72 total, 12 thin omitted)

### Community 0 - "Prisma Generated Types"
Cohesion: 0.02
Nodes (98): Args, At, AtLeast, AtLoose, AtStrict, BatchPayload, Boolean, BooleanFieldRefInput (+90 more)

### Community 1 - "User Service Server & DTOs"
Cohesion: 0.06
Nodes (23): RegisterRequestDto, AUTH_DURATIONS, COOKIE_MAX_AGE, COOKIE_NAMES, DURATION_TO_MS, REDIS_KEYS, build(), getAuthController() (+15 more)

### Community 2 - "Prisma User Model"
Cohesion: 0.03
Nodes (57): AggregateUser, BoolFieldUpdateOperationsInput, DateTimeFieldUpdateOperationsInput, GetUserAggregateType, GetUserGroupByPayload, Prisma__UserClient, StringFieldUpdateOperationsInput, UserAggregateArgs (+49 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (20): app, AuthResponseDto, LoginRequestDto, LoginSchema, VerifyOtpRequestDto, VerifyOtpRequestSchema, RegisterSchema, globalForPrisma (+12 more)

### Community 4 - "Kafka Client Package"
Cohesion: 0.05
Nodes (40): dependencies, bcryptjs, cookie-parser, cors, dotenv, express, helmet, ioredis (+32 more)

### Community 5 - "User Service Dependencies"
Cohesion: 0.05
Nodes (37): API Gateway, Architecture, Backend, Booking Service, Build, Cache, Database, Database Setup (+29 more)

### Community 6 - "Auth Response & Prisma Client"
Cohesion: 0.05
Nodes (36): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, jsx, module, moduleDetection (+28 more)

### Community 7 - "TS Config - Service Base"
Cohesion: 0.09
Nodes (14): statusCode, StatusCodeKey, StatusCodeValue, getRequestId(), getTraceId(), getRequestContext(), RequestContext, requestContextStorage (+6 more)

### Community 8 - "Env & Server Bootstrap"
Cohesion: 0.06
Nodes (29): devDependencies, prettier, turbo, typescript, engines, node, name, packageManager (+21 more)

### Community 9 - "HTTP Package Utilities"
Cohesion: 0.14
Nodes (20): startServer(), errorResponse(), ApiError, createErrorResponse(), ErrorInput, ERROR_CODES, ErrorCode, ErrorContract (+12 more)

### Community 10 - "Notification Service Dependencies"
Cohesion: 0.08
Nodes (20): ModelName, NullTypes, QueryMode, SortOrder, TransactionIsolationLevel, UserScalarFieldEnum, User, BoolFilter (+12 more)

### Community 11 - "TS Config - Package Base"
Cohesion: 0.10
Nodes (20): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-only-warn, eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-turbo (+12 more)

### Community 12 - "Root Workspace Config"
Cohesion: 0.11
Nodes (18): dependencies, @irctc/errors, @irctc/http, @irctc/logger, zod, devDependencies, @repo/typescript-config, @types/express (+10 more)

### Community 13 - "Errors Package Core"
Cohesion: 0.12
Nodes (16): dependencies, @irctc/errors, @opentelemetry/api, devDependencies, @repo/typescript-config, @types/node, exports, import (+8 more)

### Community 14 - "ESLint Config Package"
Cohesion: 0.12
Nodes (16): dependencies, @opentelemetry/api, pino, devDependencies, pino-pretty, @repo/typescript-config, exports, import (+8 more)

### Community 15 - "HTTP Package Dependencies"
Cohesion: 0.12
Nodes (16): compilerOptions, declaration, declarationMap, esModuleInterop, incremental, isolatedModules, lib, module (+8 more)

### Community 16 - "Telemetry/Library Deps"
Cohesion: 0.13
Nodes (11): router, AuthController, liveCheck(), readyCheck(), liveCheck(), readyCheck(), HealthChecks, HealthService (+3 more)

### Community 17 - "Kafka Package Dependencies"
Cohesion: 0.05
Nodes (36): 1. send-otp (no auth required), 1s; with a token bucket, they get capacity (10) + refill (a few, 2. verify-otp (sets auth_token cookie), 3. /auth/sessions (auth required; gateway must inject X-User-Id), 4. Try to forge X-User-Id from outside the gateway, 5. Direct host-side access must be refused, 6. Exceed the auth-bucket capacity; expect 429, 7. Token-bucket boundary check (regression for the fixed-window bug) (+28 more)

### Community 18 - "Logger Package"
Cohesion: 0.15
Nodes (13): dependencies, devDependencies, @repo/typescript-config, exports, import, main, name, private (+5 more)

### Community 19 - "TS Config - Base"
Cohesion: 0.10
Nodes (19): Common Commands, Error Handling Flow, Error Handling Guidelines, Global Operations, Graceful Shutdown, graphify, Health Monitoring, Health Probes & Bootstrap Readiness (+11 more)

### Community 20 - "Middleware Dependencies"
Cohesion: 0.20
Nodes (9): compilerOptions, allowJs, jsx, module, moduleResolution, noEmit, plugins, extends (+1 more)

### Community 21 - "Contracts Package"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 22 - "Prisma Filter Types"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 23 - "Health Check Endpoints"
Cohesion: 0.29
Nodes (4): config, LogOptions, PrismaClient, PrismaClientConstructor

### Community 24 - "Notification Constants"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 25 - "Prisma Browser Namespace"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 26 - "User Auth Container & Publisher"
Cohesion: 0.29
Nodes (6): license, name, private, publishConfig, access, version

### Community 27 - "Community 27"
Cohesion: 0.06
Nodes (33): dependencies, cors, dotenv, express, helmet, ioredis, @irctc/contracts, @irctc/errors (+25 more)

### Community 28 - "TS Config - Next.js"
Cohesion: 0.47
Nodes (3): config, nextJsConfig, config

### Community 29 - "Health Service Checks"
Cohesion: 0.40
Nodes (3): REDACT_PATHS, __dirname, logger

### Community 30 - "TS Config - User Service"
Cohesion: 0.40
Nodes (4): compilerOptions, jsx, extends, $schema

### Community 31 - "TS Config - Notification"
Cohesion: 0.09
Nodes (12): EmailContent, EmailProvider, SendEmailCommand, EmailProviderFactory, EmailProviderFactoryDeps, SendGridProvider, OtpNotificationService, WelcomeNotificationService (+4 more)

### Community 32 - "TS Config - HTTP"
Cohesion: 0.06
Nodes (31): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, module, moduleDetection, noUncheckedIndexedAccess (+23 more)

### Community 34 - "TS Config - Errors"
Cohesion: 0.07
Nodes (9): KafkaProducerManager, KafkaConsumerRunner, LoggerLike, MessageHandler, DLQ_REASONS, DlqReason, KAFKA_HEADERS, RetryPolicies (+1 more)

### Community 37 - "Workspace Package Metadata"
Cohesion: 0.14
Nodes (13): 12. Rate limits & abuse prevention, 15. Configuration reference, 2. High-level architecture, 3. Component diagram, 4. Async registration flow (user-service ↔ notification-service), 5. Login flow, 7. Session management, Fingerprinting (+5 more)

### Community 38 - "User Service Routes"
Cohesion: 0.08
Nodes (14): env, getConsumer(), getProducer(), initKafka(), kafka, startServer(), getConsumer(), getProducer() (+6 more)

### Community 40 - "Community 40"
Cohesion: 0.08
Nodes (26): dependencies, @opentelemetry/api, @opentelemetry/auto-instrumentations-node, @opentelemetry/exporter-trace-otlp-http, @opentelemetry/resources, @opentelemetry/sdk-node, @opentelemetry/sdk-trace-base, @opentelemetry/semantic-conventions (+18 more)

### Community 41 - "Community 41"
Cohesion: 0.12
Nodes (16): dependencies, @irctc/logger, kafkajs, devDependencies, @repo/typescript-config, @types/node, exports, import (+8 more)

### Community 42 - "Community 42"
Cohesion: 0.13
Nodes (15): dependencies, zod, devDependencies, @repo/typescript-config, @types/node, exports, import, main (+7 more)

### Community 43 - "Community 43"
Cohesion: 0.15
Nodes (8): IDEMPOTENCY_KEYS, IDEMPOTENCY_STATE, IdempotencyState, KAFKA_HEADERS, DLQ_REASONS, PROCESSING_STATUS, ProcessingStatus, Topics

### Community 46 - "Community 46"
Cohesion: 0.36
Nodes (5): HealthChecks, HealthService, probeDatabase(), probeKafka(), probeRedis()

### Community 48 - "Community 48"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 49 - "Community 49"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, exclude, extends, include

### Community 50 - "Community 50"
Cohesion: 0.29
Nodes (4): OTPRequestedV1, OTPRequestedV1Type, UserLoggedInV1, UserLoggedInV1Type

### Community 51 - "Community 51"
Cohesion: 0.10
Nodes (20): 0a. `@irctc/telemetry`, 0b. `@irctc/resilience` — custom circuit breaker (V1, hand-rolled), 0c. `@irctc/ratelimit` — token bucket over Redis (Lua-atomic), 0d. `@irctc/idempotency` — three-phase Redis pattern, 0e. `@irctc/service-identity` — V1 placeholder, V2 mTLS, 0f. Reuse note for all five packages, API Gateway + Traefik + Distributed Tracing — Implementation Plan, `apps/api-gateway/package.json` (+12 more)

### Community 53 - "Community 53"
Cohesion: 0.29
Nodes (6): compilerOptions, composite, outDir, rootDir, extends, include

### Community 54 - "Community 54"
Cohesion: 0.40
Nodes (3): resolveOtlpTracesUrl(), startTelemetry(), TelemetryOptions

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (6): 13. Failure modes & rollback, Graceful shutdown, Kafka publish fails after Redis writes, `notification-service` is down, Postgres is down, Redis is down

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (6): 16. Local development, Build, One-time setup, Prerequisites, Run, Smoke test

### Community 60 - "Community 60"
Cohesion: 0.60
Nodes (4): buildConsumerSpanContext(), extractTraceContextFromKafkaHeaders(), KafkaHeaderMap, normaliseKafkaHeaders()

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

### Community 65 - "Community 65"
Cohesion: 0.67
Nodes (3): 1. Responsibilities & non-responsibilities, Does NOT own, Owns

## Knowledge Gaps
- **702 isolated node(s):** `Global Operations`, `Service-Specific Operations`, `System Design`, `Monorepo Structure`, `Service Internal Pattern` (+697 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `successResponse()` connect `Telemetry/Library Deps` to `TS Config - Service Base`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `Kafka Client Package` to `Community 3`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `Global Operations`, `Service-Specific Operations`, `System Design` to the rest of the system?**
  _702 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Prisma Generated Types` be split into smaller, more focused modules?**
  _Cohesion score 0.020202020202020204 - nodes in this community are weakly interconnected._
- **Should `User Service Server & DTOs` be split into smaller, more focused modules?**
  _Cohesion score 0.05909090909090909 - nodes in this community are weakly interconnected._
- **Should `Prisma User Model` be split into smaller, more focused modules?**
  _Cohesion score 0.034482758620689655 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05451127819548872 - nodes in this community are weakly interconnected._