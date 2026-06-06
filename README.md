# IRCTC Clone

Production-grade railway ticket booking platform built using Microservices Architecture, TypeScript, PostgreSQL, Redis, Kafka, OpenTelemetry, and Kubernetes.

---

## Overview

IRCTC Clone is a distributed railway reservation system inspired by the Indian Railway Catering and Tourism Corporation (IRCTC).

The project is designed to demonstrate:

- Microservices Architecture
- Domain Driven Design (DDD)
- Clean Architecture
- Event Driven Communication
- Distributed Tracing
- Observability
- Scalable Infrastructure

The system is built as a Turborepo monorepo using pnpm workspaces.

---

## Architecture

```text
                    ┌──────────────┐
                    │ API Gateway  │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼

 ┌─────────────┐   ┌──────────────┐   ┌─────────────┐
 │ User Service│   │Search Service│   │ Booking Svc │
 └──────┬──────┘   └──────┬───────┘   └──────┬──────┘
        │                 │                 │
        └─────────┬───────┴───────┬─────────┘
                  │               │
                  ▼               ▼

           ┌─────────────┐  ┌─────────────┐
           │ Kafka Broker│  │ Redis Cache │
           └──────┬──────┘  └─────────────┘
                  │
                  ▼

           ┌─────────────┐
           │Payment Svc  │
           └─────────────┘
```

---

## Microservices

### User Service

Responsible for:

- Registration
- Authentication
- Authorization
- JWT Management
- Refresh Tokens
- User Profile Management

### Search Service

Responsible for:

- Train Search
- Station Search
- Availability Search
- Caching Search Results

### Booking Service

Responsible for:

- Seat Allocation
- Booking Creation
- Booking Validation
- Reservation Logic

### Payment Service

Responsible for:

- Payment Processing
- Payment Verification
- Payment Events

### API Gateway

Responsible for:

- Routing
- Authentication Middleware
- Rate Limiting
- Request Validation
- Request Tracing

---

## Monorepo Structure

```text
apps/
│
├── api-gateway
├── user-service
├── booking-service
├── payment-service
└── search-service

packages/
│
├── contracts
├── errors
├── http
├── kafka
├── logger
├── middleware
├── telemetry
└── typescript-config

infra/
│
├── docker
├── k8s
├── grafana
├── loki
├── tempo
├── alloy
└── prometheus
```

---

## Technology Stack

### Backend

- Node.js
- TypeScript
- Express.js

### Database

- PostgreSQL
- Prisma ORM

### Cache

- Redis
- ioredis

### Messaging

- Apache Kafka
- kafkajs

### Validation

- Zod
- ts-rest

### Observability

- OpenTelemetry
- Grafana
- Loki
- Tempo
- Prometheus
- Alloy

### Infrastructure

- Docker
- Kubernetes

---

## Prerequisites

Install:

- Node.js 22+
- pnpm
- Docker
- Docker Compose
- PostgreSQL
- Redis
- Kafka

---

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd itctc-clone
```

Install dependencies:

```bash
pnpm install
```

---

## Environment Variables

Create:

```bash
apps/user-service/.env
```

Example:

```env
NODE_ENV=development

PORT=4001

DATABASE_URL=

REDIS_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

KAFKA_BROKERS=
```

---

## Database Setup

Generate Prisma Client:

```bash
pnpm --filter user-service prisma generate
```

Run migrations:

```bash
pnpm --filter user-service prisma migrate dev
```

---

## Running Infrastructure

Start PostgreSQL, Redis, Kafka and Observability stack:

```bash
docker compose up -d
```

---

## Development

Run all services:

```bash
pnpm dev
```

Run specific service:

```bash
pnpm --filter user-service dev
```

Run API Gateway:

```bash
pnpm --filter api-gateway dev
```

---

## Build

Build all packages and applications:

```bash
pnpm build
```

Build a specific service:

```bash
pnpm --filter user-service build
```

---

## Lint

```bash
pnpm lint
```

---

## Type Check

```bash
pnpm typecheck
```

---

## Testing

```bash
pnpm test
```

---

## Observability

### Grafana

Visualize:

- Logs
- Metrics
- Traces
- Service Health

### Loki

Centralized Log Aggregation

### Tempo

Distributed Tracing

### Prometheus

Metrics Collection

### OpenTelemetry

Trace Propagation Across:

- HTTP
- Kafka
- Redis

---

## Logging

Structured JSON logging powered by:

- Pino
- OpenTelemetry Trace Correlation

Development logs are human-readable.

Production logs are optimized for:

- Grafana Loki
- Distributed Tracing
- Centralized Monitoring

---

## Future Roadmap

- Waitlist Management
- Dynamic Pricing
- Tatkal Booking
- Notification Service
- Email Service
- SMS Service
- Admin Dashboard
- Seat Recommendation Engine
- AI-Powered Demand Prediction

---

## License

MIT
