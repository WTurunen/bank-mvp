import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('hashPassword', () => {
  it('returns a bcrypt hash', async () => {
    const hash = await hashPassword('testpassword')
    expect(hash).toMatch(/^\$2[aby]?\$/)
    expect(hash).not.toBe('testpassword')
  })

  it('produces different hashes for the same password (salt)', async () => {
    const hash1 = await hashPassword('samepassword')
    const hash2 = await hashPassword('samepassword')
    expect(hash1).not.toBe(hash2)
  })
})

describe('verifyPassword', () => {
  it('returns true for matching password', async () => {
    const hash = await hashPassword('correct-password')
    const result = await verifyPassword('correct-password', hash)
    expect(result).toBe(true)
  })

  it('returns false for non-matching password', async () => {
    const hash = await hashPassword('correct-password')
    const result = await verifyPassword('wrong-password', hash)
    expect(result).toBe(false)
  })
})
