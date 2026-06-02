import { getRequestId } from "../context/getRequestId.js";
import { getTraceId } from "../context/getTraceId.js";

type MetaExtra = Record<string, unknown>;

export const createMeta = (extra?: MetaExtra) => ({
  ...extra,
  requestId: getRequestId(),
  traceId: getTraceId(),
  timestamp: new Date().toISOString(),
});
