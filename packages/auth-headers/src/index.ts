import type { IncomingHttpHeaders } from "node:http";

export const HEADER_USER_ID = "x-user-id";
export const HEADER_USER_EMAIL = "x-user-email";
export const HEADER_SESSION_ID = "x-session-id";

export interface AuthUser {
  userId: string;
  email: string;
  sessionId: string;
}

function getHeaderString(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function readUserFromHeaders(
  headers: Record<string, string | string[] | undefined> | IncomingHttpHeaders,
): AuthUser | null {
  const userId = getHeaderString(headers[HEADER_USER_ID]);
  const email = getHeaderString(headers[HEADER_USER_EMAIL]);
  const sessionId = getHeaderString(headers[HEADER_SESSION_ID]);

  if (!userId || !email || !sessionId) {
    return null;
  }

  return {
    userId,
    email,
    sessionId,
  };
}
