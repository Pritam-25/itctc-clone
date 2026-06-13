import type { Request, Response, NextFunction, RequestHandler } from "express";
import {
  HEADER_USER_ID,
  HEADER_USER_EMAIL,
  HEADER_SESSION_ID,
  type AuthUser,
} from "@irctc/auth-headers";

export const proxyHeadersMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as Request & { user?: AuthUser }).user;

  if (user) {
    // Keep only the headers injected by our auth middleware
    req.headers[HEADER_USER_ID] = user.userId;
    req.headers[HEADER_USER_EMAIL] = user.email;
    req.headers[HEADER_SESSION_ID] = user.sessionId;

    // Delete any other x-user-* headers that might have been forged
    for (const key of Object.keys(req.headers)) {
      if (
        key.startsWith("x-user-") &&
        key !== HEADER_USER_ID &&
        key !== HEADER_USER_EMAIL &&
        key !== HEADER_SESSION_ID
      ) {
        delete req.headers[key];
      }
    }
  } else {
    // Delete all x-user-* headers
    for (const key of Object.keys(req.headers)) {
      if (key.startsWith("x-user-")) {
        delete req.headers[key];
      }
    }
  }

  next();
};
