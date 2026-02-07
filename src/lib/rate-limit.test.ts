import { describe, it, expect } from 'vitest'
import { checkRateLimit, RATE_LIMIT_CONFIG } from './rate-limit'

describe('checkRateLimit', () => {
  it('allows requests within the limit', async () => {
    const key = `test-allow-${Date.now()}`
    const result = await checkRateLimit(key, 'authenticated')
    expect(result.success).toBe(true)
    expect(result.remaining).toBeGreaterThanOrEqual(0)
    expect(result.reset).toBeGreaterThan(Date.now() - 1000)
  })

  it('returns remaining count that decreases', async () => {
    const key = `test-decrement-${Date.now()}`
    const first = await checkRateLimit(key, 'authenticated')
    const second = await checkRateLimit(key, 'authenticated')
    expect(second.remaining).toBeLessThan(first.remaining)
  })

  it('uses different buckets for different types', async () => {
    const key = `test-types-${Date.now()}`
    const authResult = await checkRateLimit(key, 'authenticated')
    const unauthResult = await checkRateLimit(key, 'unauthenticated')
    expect(authResult.success).toBe(true)
    expect(unauthResult.success).toBe(true)
  })

  it('uses different buckets for different keys', async () => {
    const key1 = `test-keys-a-${Date.now()}`
    const key2 = `test-keys-b-${Date.now()}`
    const result1 = await checkRateLimit(key1, 'auth')
    const result2 = await checkRateLimit(key2, 'auth')
    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
    expect(result1.remaining).toBe(result2.remaining)
  })

  it('returns reset timestamp in the future', async () => {
    const key = `test-reset-${Date.now()}`
    const result = await checkRateLimit(key, 'authenticated')
    expect(result.reset).toBeGreaterThan(Date.now())
  })

  it('remaining is an integer', async () => {
    const key = `test-integer-${Date.now()}`
    const result = await checkRateLimit(key, 'unauthenticated')
    expect(Number.isInteger(result.remaining)).toBe(true)
  })
})

describe('RATE_LIMIT_CONFIG', () => {
  it('has three tiers with expected token counts', () => {
    expect(RATE_LIMIT_CONFIG.authenticated.tokens).toBe(100)
    expect(RATE_LIMIT_CONFIG.unauthenticated.tokens).toBe(20)
    expect(RATE_LIMIT_CONFIG.auth.tokens).toBe(5)
  })

  it('uses 60-second intervals for all tiers', () => {
    expect(RATE_LIMIT_CONFIG.authenticated.interval).toBe(60000)
    expect(RATE_LIMIT_CONFIG.unauthenticated.interval).toBe(60000)
    expect(RATE_LIMIT_CONFIG.auth.interval).toBe(60000)
  })
})
