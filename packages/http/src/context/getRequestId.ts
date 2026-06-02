import { getRequestContext } from "./requestContext.js";

export const getRequestId = (): string | undefined =>
  getRequestContext()?.requestId;
