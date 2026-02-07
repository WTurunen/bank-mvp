export const RATE_LIMIT_CONFIG = {
  // Authenticated users: 100 requests per minute
  authenticated: {
    tokens: 100,
    interval: 60 * 1000, // 1 minute in ms
  },
  // Unauthenticated users: 20 requests per minute
  unauthenticated: {
    tokens: 20,
    interval: 60 * 1000,
  },
  // Login/register: 5 attempts per minute (prevent brute force)
  auth: {
    tokens: 5,
    interval: 60 * 1000,
  },
} as const;
