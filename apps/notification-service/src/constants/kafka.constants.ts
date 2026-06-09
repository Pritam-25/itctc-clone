/**
 * Kafka header names that notification-service uses on the producer side
 * (e.g. when forwarding invalid events to a future DLQ from the consumer).
 *
 * The runner's DLQ writes use headers from `@irctc/kafka` constants; this
 * file mirrors the values locally so service code does not need to import
 * from the package just to set a header name. They MUST stay in sync.
 */
export const KAFKA_HEADERS = {
  EVENT_ID: "x-event-id",
  SCHEMA_VERSION: "x-schema-version",
  DLQ_REASON: "x-dlq-reason",
  DLQ_TIMESTAMP: "x-dlq-timestamp",
  ORIGINAL_TOPIC: "x-original-topic",
} as const;
