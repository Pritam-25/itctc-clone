# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Global Operations

- Build all: `pnpm build`
- Run all in dev mode: `pnpm dev`
- Lint all: `pnpm lint`
- Type check all: `pnpm check-types`
- Format all: `pnpm format`

### Service-Specific Operations

- Run a specific service: `pnpm --filter <service-name> dev`
- Build a specific service: `pnpm --filter <service-name> build`
- Generate Prisma client: `pnpm --filter <service-name> prisma generate`
- Run Prisma migrations: `pnpm --filter <service-name> prisma migrate dev`

## High-Level Architecture

### System Design

The project is a distributed railway reservation system using a Microservices architecture built with Turborepo and `pnpm` workspaces. It follows Domain Driven Design (DDD) and Clean Architecture principles.

### Monorepo Structure

- `apps/`: Contains the microservices:
  - `api-gateway`: Entry point, routing, authentication middleware, rate limiting.
  - `user-service`: User registration, auth, and profile management.
  - `booking-service`: Seat allocation and reservation logic.
  - `payment-service`: Payment processing and verification.
  - `search-service`: Train and station searches with Redis caching.
  - `notification-service`: Event-driven notifications.
- `packages/`: Shared cross-cutting concerns:
  - `@irctc/errors`: Centralized error handling and normalization.
  - `@irctc/http`: Standardized API response formats.
  - `@irctc/logger`: Structured logging with Pino and OpenTelemetry.
  - `@irctc/middleware`: Common Express middlewares (validation, error handling, request ID).
  - `@irctc/kafka`: Shared Kafka client, producer, and consumer factory.
  - `@irctc/contracts`: Versioned event schemas (Zod) for inter-service communication.
  - `@irctc/telemetry`: OpenTelemetry instrumentation.
- `infra/`: Configuration for Docker, Kubernetes, and observability (Grafana, Loki, Tempo, Prometheus).

### Service Internal Pattern

Each microservice typically follows a layered architecture:
`Routes` $\rightarrow$ `Controllers` $\rightarrow$ `Services` $\rightarrow$ `Repositories` $\rightarrow$ `Prisma/External APIs`

- **Routes**: Define endpoints and apply validation middleware (`zod` via `@irctc/middleware`).
- **Controllers**: Handle HTTP request/response flow, call services, and use mappers to format data.
- **Services**: Contain business logic, coordinate between repositories, and handle domain-specific errors.
- **Repositories**: Abstract data access (Prisma, Redis) and maintain the dependency injection pattern.
- **DTOs & Mappers**: Ensure strict separation between database entities and the API contract.

### Infrastructure Guidelines

#### Startup Sequence

Services must not accept traffic until all critical dependencies are ready.
`initPrisma()` $\rightarrow$ `initRedis()` $\rightarrow$ `initKafka()` $\rightarrow$ `app.listen()`

#### Graceful Shutdown

To prevent data loss and ensure clean termination in K8s/Docker:

1. Stop HTTP server (drain requests).
2. Disconnect Kafka consumers.
3. Disconnect Kafka producer.
4. Disconnect Redis.
5. Disconnect Prisma.
6. Exit process.

#### Health Monitoring

Every service must implement:

- `/health/live`: Basic process check (200 OK).
- `/health/ready`: Deep check of Prisma, Redis, and Kafka connectivity (200 OK or 503 Service Unavailable).

#### Kafka Architecture

- **Ownership**: Each service owns its own producer and consumer groups.
- **Shared Library**: Use `@irctc/kafka` for client/producer/consumer plumbing.
- **Contracts**: All events must be defined as versioned Zod schemas in `@irctc/contracts`.
- **Producer Defaults**: `allowAutoTopicCreation: false`, `idempotent: true`, `maxInFlightRequests: 5`.

### Error Handling Flow

1. Services throw `ApiError` from `@irctc/errors`.
2. Middleware captures errors and uses `normalizeError` to convert various error types (including Prisma errors) into a `NormalizedError`.
3. `createErrorResponse` transforms this into a standard `ErrorContract` (code, message, details).
4. The response is wrapped in `errorResponse` from `@irctc/http` for the final client output.

#### Error Handling Guidelines

- **Avoid Hardcoded Strings**: Never pass raw strings as error codes or messages in `ApiError`.
- **Use Constants**: Always use the `ERROR_CODES` and `ERROR_MESSAGES` constants defined in the service's `utils/errors` directory.
- **Maintainability**: This ensures that all error messages are centralized, translation-ready, and consistent across the service.
- **Registry**: Service-specific errors are registered with the global `@irctc/errors` registry during service startup to ensure proper normalization.
- **Centralized error constants are for user-facing errors only.** `ERROR_MESSAGES` is registered with `@irctc/errors` and surfaced in HTTP responses. Do NOT use it for developer log lines (`logger.error("…")`); write a short, specific log message and reference the `ERROR_CODES.*` key in a comment if the log corresponds to a user-facing failure code.

### Logging & PII

The Pino logger in `packages/logger` already redacts credentials and secrets via `REDACT_PATHS` (`password`, `token`, `otp`, `cardNumber`, `cvv`, `upiPin`, `*.password`, etc.). It does **not** redact PII.

**Rules — apply to every service:**

- **Never log PII in application logs.** Forbidden in log bound objects: `email`, `firstName`, `lastName`, `phone`, `address`, `dateOfBirth`, full event/request payloads, full `req.body`, full `req.user`, and full DTOs.
- **Use stable, non-PII identifiers instead.** `eventId` and `userId` (or `sessionId` for unauthenticated flows) are always safe. The `OTPRequestedV1` contract does not guarantee a `userId` — log `eventId` only.
- **Never log a whole event or request object.** Zod `safeParse` failures should log `result.error.issues` only; HTTP request errors should log `req.id` + a redacted field summary, not the body.
- **Kafka message keys must not be PII.** Use `userId` (or `eventId` for anonymous flows) as the partition key. Email-as-key both leaks PII on the wire and ties partition routing to mutable user data.
- **When adding new log statements, do a self-check:** does the bound object contain any field that could identify a real person? If yes, replace it with `eventId`/`userId`/`sessionId` or drop it.
- **Code review must flag any new `email:` / `firstName:` field in a `logger.*` call.** Same for any change to `REDACT_PATHS` in `packages/logger/src/constants.ts` — that file is the trust boundary for log redaction.

### Idempotency for Side-Effecting Consumers

Any Kafka consumer that triggers an irreversible side effect (email, SMS, payment, external API write) MUST use the two-phase idempotency pattern in `@irctc/notification-service` (and any new service that follows the same shape): `reserveIfNew` → do the work → `markProcessed` on success, `release` on failure and rethrow. The single-call `markIfNew` style drops notifications permanently on a single transient provider failure, because the redelivery is short-circuited as a duplicate. Redis keys store explicit `PROCESSING` (short lease TTL) vs `PROCESSED` (full dedupe TTL) values so in-flight work, completed dedupe, and crash recovery are distinguishable. See `IdempotencyRepository` in `apps/notification-service/src/repositories/idempotency.repository.ts` for the canonical API.

### Health Probes & Bootstrap Readiness

- **Every dependency probe inside `/health/ready` must have a bounded timeout** (target 5s) wrapped via `Promise.race` with a `clearTimeout` in `finally`. Default KafkaJS / Prisma / ioredis timeouts are 30s+; without an explicit bound, a slow dependency will hang `Promise.all` in `runReadinessChecks` and make orchestrators (k8s, load balancers) unable to mark the pod NotReady in time.
- **Always `await initRedis()` (and equivalent) before wiring repositories that depend on the client.** `lazyConnect: false` starts the connect handshake, but the client is not safe to use until the `ready` event fires. The `initRedis()` helper in `apps/notification-service/src/config/redis.ts` is the canonical pattern — replicate it in any new service that uses Redis.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## JSDoc Guidelines

When generating TypeScript:

- Add concise production-grade JSDoc.
- Trim module/package JSDoc to concise contract-level guidance (e.g., purpose, key API endpoints, and operational side-effects) and avoid walkthroughs/tutorials.
- Every service class must have a class-level JSDoc.
- Every public service method must have workflow-oriented JSDoc.
- Document side effects, Redis usage, Kafka publishing, security behavior, and failure guarantees when relevant.
- Avoid tutorial-style comments.
- Avoid line-by-line comments.
- Prefer explaining WHY over WHAT.
