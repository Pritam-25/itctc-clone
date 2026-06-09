/**
 * Discriminated outcomes returned by OtpNotificationService.process().
 * The consumer treats anything other than PROCESSED as a no-op for retry
 * purposes; the runner only sees thrown errors.
 */
export const PROCESSING_STATUS = {
  PROCESSED: "processed",
  DUPLICATE: "duplicate",
  INVALID: "invalid",
} as const;

export type ProcessingStatus =
  (typeof PROCESSING_STATUS)[keyof typeof PROCESSING_STATUS];

/**
 * Reasons a message may be routed to a DLQ. Only retry exhaustion is
 * emitted by the consumer runner today; schema_validation is reserved
 * for handlers that prefer to forward parse failures explicitly rather
 * than return INVALID.
 */
export const DLQ_REASONS = {
  SCHEMA_VALIDATION: "schema_validation",
  RETRY_EXHAUSTED: "retry_exhausted",
} as const;
