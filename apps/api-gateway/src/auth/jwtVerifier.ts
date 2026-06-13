import jwt from "jsonwebtoken";
import type { AuthUser } from "@irctc/auth-headers";

interface AccessTokenPayload {
  sub: string;
  email: string;
  sessionId: string;
  type: "access";
}

export function verifyAccessToken(token: string): AuthUser | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // If JWT_SECRET is not configured, we shouldn't fail silently, but for robust verification
    // we require it.
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as AccessTokenPayload;

    if (
      decoded.type !== "access" ||
      !decoded.sub ||
      !decoded.email ||
      !decoded.sessionId
    ) {
      return null;
    }

    return {
      userId: decoded.sub,
      email: decoded.email,
      sessionId: decoded.sessionId,
    };
  } catch {
    return null;
  }
}
