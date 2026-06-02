export interface LoggerContext {
  service?: string;
  userId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
}
