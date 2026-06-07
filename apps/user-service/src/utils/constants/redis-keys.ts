export const REDIS_KEYS = {
  authSession: (sessionId: string) => `auth:session:${sessionId}`,
  userSessions: (userId: string) => `auth:user:${userId}:sessions`,
  otp: (sessionId: string) => `auth:otp:${sessionId}`,
  registrationSession: (sessionId: string) => `auth:registration:${sessionId}`,
  blacklistToken: (tokenId: string) => `auth:blacklist:${tokenId}`,
} as const;
