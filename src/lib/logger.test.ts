import { describe, it, expect } from 'vitest'
import { createLogger, logRequest, logError, logger } from './logger'

describe('createLogger', () => {
  it('returns a child logger with standard methods', () => {
    const log = createLogger({ action: 'test', userId: 'user-1' })
    expect(log).toBeDefined()
    expect(typeof log.info).toBe('function')
    expect(typeof log.error).toBe('function')
    expect(typeof log.warn).toBe('function')
    expect(typeof log.debug).toBe('function')
  })

  it('accepts arbitrary context keys', () => {
    const log = createLogger({ action: 'test', invoiceId: 'inv-1', clientId: 'cl-1' })
    expect(log).toBeDefined()
  })
})

describe('logRequest', () => {
  it('does not throw for 2xx status codes', () => {
    expect(() => logRequest('GET', '/test', 200, 50, 'user-1')).not.toThrow()
  })

  it('does not throw for 4xx status codes', () => {
    expect(() => logRequest('POST', '/test', 404, 30)).not.toThrow()
  })

  it('does not throw for 5xx status codes', () => {
    expect(() => logRequest('PUT', '/test', 500, 100)).not.toThrow()
  })

  it('works without userId', () => {
    expect(() => logRequest('DELETE', '/test', 204, 10)).not.toThrow()
  })
})

describe('logError', () => {
  it('handles Error instances', () => {
    expect(() => logError(new Error('test error'), { action: 'test' })).not.toThrow()
  })

  it('handles string errors', () => {
    expect(() => logError('string error', { action: 'test' })).not.toThrow()
  })

  it('uses custom message when provided', () => {
    expect(() =>
      logError(new Error('fail'), { action: 'test', message: 'Custom message' })
    ).not.toThrow()
  })

  it('handles non-Error non-string values', () => {
    expect(() => logError(42, { action: 'test' })).not.toThrow()
  })
})

describe('logger', () => {
  it('is a pino logger instance', () => {
    expect(logger).toBeDefined()
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.child).toBe('function')
  })
})
