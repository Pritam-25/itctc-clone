/**
 * Single source of truth for Kafka header names used by consumer
 * services. Defined in the shared package so producers and consumers
 * across services agree on the wire format.
 *
 * Header values are kebab-case (HTTP-ish). DLQ reason values live
 * alongside, in snake_case (machine-friendly enums).
 */
export const KAFKA_HEADERS = {
  EVENT_ID: "x-event-id",
  SCHEMA_VERSION: "x-schema-version",
  DLQ_REASON: "x-dlq-reason",
  DLQ_TIMESTAMP: "x-dlq-timestamp",
  ORIGINAL_TOPIC: "x-original-topic",
} as const;
