import { RateLimiter } from "limiter";

export const RATE_LIMIT_CONFIG = {
  authenticated: { tokens: 100, interval: 60 * 1000 },
  unauthenticated: { tokens: 20, interval: 60 * 1000 },
  auth: { tokens: 5, interval: 60 * 1000 },
} as const;

const limiters = new Map<string, RateLimiter>();

type RateLimitType = keyof typeof RATE_LIMIT_CONFIG;

function getLimiter(key: string, type: RateLimitType): RateLimiter {
  const cacheKey = `${type}:${key}`;
  if (!limiters.has(cacheKey)) {
    const config = RATE_LIMIT_CONFIG[type];
    limiters.set(
      cacheKey,
      new RateLimiter({
        tokensPerInterval: config.tokens,
        interval: config.interval,
      })
    );
  }
  return limiters.get(cacheKey)!;
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  reset: number;
};

export async function checkRateLimit(
  key: string,
  type: RateLimitType
): Promise<RateLimitResult> {
  const limiter = getLimiter(key, type);
  const remaining = await limiter.removeTokens(1);
  return {
    success: remaining >= 0,
    remaining: Math.max(0, Math.floor(remaining)),
    reset: Date.now() + RATE_LIMIT_CONFIG[type].interval,
  };
}
