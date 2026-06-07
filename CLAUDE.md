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
- `packages/`: Shared cross-cutting concerns:
  - `@irctc/errors`: Centralized error handling and normalization.
  - `@irctc/http`: Standardized API response formats.
  - `@irctc/logger`: Structured logging with Pino and OpenTelemetry.
  - `@irctc/middleware`: Common Express middlewares (validation, error handling, request ID).
  - `@irctc/kafka`: Event-driven communication wrappers.
  - `@irctc/telemetry`: OpenTelemetry instrumentation.
- `infra/`: Configuration for Docker, Kubernetes, and observability (Grafana, Loki, Tempo, Prometheus).

### Service Internal Pattern

Each microservice typically follows a layered architecture:
`Routes` $\rightarrow$ `Controllers` $\rightarrow$ `Services` $\rightarrow$ `Repositories` $\rightarrow$ `Prisma/External APIs`

- **Routes**: Define endpoints and apply validation middleware (`zod` via `@irctc/middleware`).
- **Controllers**: Handle HTTP request/response flow, call services, and use mappers to format data.
- **Services**: Contain business logic, coordinate between repositories, and handle domain-specific errors.
- **Repositories**: Abstract data access (Prisma) and maintain the dependency injection pattern.
- **DTOs & Mappers**: Ensure strict separation between database entities and the API contract.

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
