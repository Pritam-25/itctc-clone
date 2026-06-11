# Graph Report - itctc-clone (2026-06-10)

## Corpus Check

- 104 files · ~19,007 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 727 nodes · 852 edges · 40 communities (35 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `372b3f15`
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
- [[_COMMUNITY_TS Config - Errors|TS Config - Errors]]
- [[_COMMUNITY_TS Config - Logger|TS Config - Logger]]
- [[_COMMUNITY_TS Config - Middleware|TS Config - Middleware]]
- [[_COMMUNITY_Workspace Package Metadata|Workspace Package Metadata]]

## God Nodes (most connected - your core abstractions)

1. `IRCTC Clone` - 20 edges
2. `compilerOptions` - 19 edges
3. `compilerOptions` - 15 edges
4. `AuthService` - 14 edges
5. `paths` - 14 edges
6. `AuthController` - 12 edges
7. `successResponse()` - 11 edges
8. `AuthResponseDto` - 9 edges
9. `ERROR_CODES` - 8 edges
10. `JSDoc Standards` - 8 edges

## Surprising Connections (you probably didn't know these)

- `startServer()` --calls--> `registerErrorMessages()` [INFERRED]
  apps/user-service/src/server.ts → packages/errors/src/registry.ts
- `errorResponse()` --calls--> `createErrorResponse()` [INFERRED]
  packages/http/src/response/apiResponse.ts → packages/errors/src/createErrorResponse.ts
- `errorResponse()` --calls--> `normalizeError()` [INFERRED]
  packages/http/src/response/apiResponse.ts → packages/errors/src/normalizeError.ts
- `errorHandlerMiddleware()` --calls--> `normalizeError()` [INFERRED]
  packages/middleware/src/errorHandler.ts → packages/errors/src/normalizeError.ts
- `shutdown()` --calls--> `disconnectRedis()` [INFERRED]
  apps/user-service/src/server.ts → apps/user-service/src/config/redis.ts

## Import Cycles

- 3-file cycle: `apps/user-service/src/generated/prisma/commonInputTypes.ts -> apps/user-service/src/generated/prisma/internal/prismaNamespace.ts -> apps/user-service/src/generated/prisma/models.ts -> apps/user-service/src/generated/prisma/commonInputTypes.ts`
- 3-file cycle: `apps/user-service/src/generated/prisma/internal/prismaNamespace.ts -> apps/user-service/src/generated/prisma/models.ts -> apps/user-service/src/generated/prisma/models/User.ts -> apps/user-service/src/generated/prisma/internal/prismaNamespace.ts`

## Communities (40 total, 5 thin omitted)

### Community 0 - "Prisma Generated Types"

Cohesion: 0.02
Nodes (98): Args, At, AtLeast, AtLoose, AtStrict, BatchPayload, Boolean, BooleanFieldRefInput (+90 more)

### Community 1 - "User Service Server & DTOs"

Cohesion: 0.06
Nodes (26): LoginRequestDto, LoginSchema, VerifyOtpRequestSchema, RegisterRequestDto, RegisterSchema, AUTH_DURATIONS, COOKIE_MAX_AGE, COOKIE_NAMES (+18 more)

### Community 2 - "Prisma User Model"

Cohesion: 0.03
Nodes (57): AggregateUser, BoolFieldUpdateOperationsInput, DateTimeFieldUpdateOperationsInput, GetUserAggregateType, GetUserGroupByPayload, Prisma\_\_UserClient, StringFieldUpdateOperationsInput, UserAggregateArgs (+49 more)

### Community 3 - "Community 3"

Cohesion: 0.08
Nodes (10): AuthResponseDto, VerifyOtpRequestDto, globalForPrisma, AuthMapper, UserMapper, PrismaClient, User, AuthRepository (+2 more)

### Community 4 - "Kafka Client Package"

Cohesion: 0.05
Nodes (38): dependencies, bcryptjs, cookie-parser, cors, dotenv, express, helmet, ioredis (+30 more)

### Community 5 - "User Service Dependencies"

Cohesion: 0.05
Nodes (37): API Gateway, Architecture, Backend, Booking Service, Build, Cache, Database, Database Setup (+29 more)

### Community 6 - "Auth Response & Prisma Client"

Cohesion: 0.06
Nodes (35): compilerOptions, declaration, declarationMap, exactOptionalPropertyTypes, isolatedModules, jsx, module, moduleDetection (+27 more)

### Community 7 - "TS Config - Service Base"

Cohesion: 0.09
Nodes (16): statusCode, StatusCodeKey, StatusCodeValue, getRequestId(), getTraceId(), getRequestContext(), RequestContext, requestContextStorage (+8 more)

### Community 8 - "Env & Server Bootstrap"

Cohesion: 0.06
Nodes (29): devDependencies, prettier, turbo, typescript, engines, node, name, packageManager (+21 more)

### Community 9 - "HTTP Package Utilities"

Cohesion: 0.16
Nodes (18): ApiError, createErrorResponse(), ErrorInput, ERROR_CODES, ErrorCode, ErrorContract, ERROR_MESSAGES, ERROR_STATUS_MAP (+10 more)

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

Cohesion: 0.26
Nodes (3): AuthController, successResponse(), getDeviceFingerprint()

### Community 17 - "Kafka Package Dependencies"

Cohesion: 0.14
Nodes (13): Avoid, Class JSDoc, Goal, Important Guarantees, Inline Comments, JSDoc Standards, Method JSDoc, Preferred Style (+5 more)

### Community 18 - "Logger Package"

Cohesion: 0.15
Nodes (13): dependencies, devDependencies, @repo/typescript-config, exports, import, main, name, private (+5 more)

### Community 19 - "TS Config - Base"

Cohesion: 0.18
Nodes (9): Common Commands, Error Handling Flow, Error Handling Guidelines, Global Operations, High-Level Architecture, Monorepo Structure, Service Internal Pattern, Service-Specific Operations (+1 more)

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

Cohesion: 0.33
Nodes (3): disconnectRedis(), globalForRedis, shutdown()

### Community 28 - "TS Config - Next.js"

Cohesion: 0.47
Nodes (3): config, nextJsConfig, config

### Community 29 - "Health Service Checks"

Cohesion: 0.40
Nodes (3): REDACT_PATHS, \_\_dirname, logger

### Community 30 - "TS Config - User Service"

Cohesion: 0.40
Nodes (4): compilerOptions, jsx, extends, $schema

## Knowledge Gaps

- **461 isolated node(s):** `allow`, `name`, `version`, `private`, `type` (+456 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `Kafka Client Package` to `Community 3`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `AuthController` connect `Telemetry/Library Deps` to `User Service Server & DTOs`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **What connects `allow`, `name`, `version` to the rest of the system?**
  _461 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Prisma Generated Types` be split into smaller, more focused modules?**
  _Cohesion score 0.020202020202020204 - nodes in this community are weakly interconnected._
- **Should `User Service Server & DTOs` be split into smaller, more focused modules?**
  _Cohesion score 0.05536723163841808 - nodes in this community are weakly interconnected._
- **Should `Prisma User Model` be split into smaller, more focused modules?**
  _Cohesion score 0.034482758620689655 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.08461538461538462 - nodes in this community are weakly interconnected._
