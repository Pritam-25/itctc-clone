/**
 * Reasons a message may be routed to a DLQ. Defined here so consumer
 * services and any future DLQ replayer agree on the wire format.
 *
 * The notification-service runner does NOT currently write to a DLQ
 * (kafkajs's built-in retry handles transient errors). This constant
 * is here for future DLQ-aware runners.
 */
export const DLQ_REASONS = {
  SCHEMA_VALIDATION: "schema_validation",
  RETRY_EXHAUSTED: "retry_exhausted",
} as const;

export type DlqReason = (typeof DLQ_REASONS)[keyof typeof DLQ_REASONS];
