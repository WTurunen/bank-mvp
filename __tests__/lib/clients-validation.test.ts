import { describe, it, expect } from 'vitest'
import {
  validateClientName,
  validateClientEmail,
  validateClient,
  CLIENT_VALIDATION_MESSAGES,
} from '@/lib/clients-validation'

describe('validateClientName', () => {
  it('returns valid for non-empty name', () => {
    const result = validateClientName('Acme Corp')
    expect(result.valid).toBe(true)
    expect(result.field).toBe('name')
  })

  it('returns valid for single character name', () => {
    const result = validateClientName('A')
    expect(result.valid).toBe(true)
  })

  it('returns invalid for empty name', () => {
    const result = validateClientName('')
    expect(result.valid).toBe(false)
    expect(result.field).toBe('name')
    expect(result.message).toBe(CLIENT_VALIDATION_MESSAGES.NAME_REQUIRED)
  })

  it('returns invalid for whitespace-only name', () => {
    const result = validateClientName('   ')
    expect(result.valid).toBe(false)
    expect(result.field).toBe('name')
    expect(result.message).toBe(CLIENT_VALIDATION_MESSAGES.NAME_REQUIRED)
  })
})

describe('validateClientEmail', () => {
  it('returns valid for standard email', () => {
    const result = validateClientEmail('test@example.com')
    expect(result.valid).toBe(true)
    expect(result.field).toBe('email')
  })

  it('returns valid for email with subdomain', () => {
    const result = validateClientEmail('user@mail.example.com')
    expect(result.valid).toBe(true)
  })

  it('returns valid for email with plus sign', () => {
    const result = validateClientEmail('user+tag@example.com')
    expect(result.valid).toBe(true)
  })

  it('returns invalid for empty email', () => {
    const result = validateClientEmail('')
    expect(result.valid).toBe(false)
    expect(result.field).toBe('email')
    expect(result.message).toBe(CLIENT_VALIDATION_MESSAGES.EMAIL_REQUIRED)
  })

  it('returns invalid for whitespace-only email', () => {
    const result = validateClientEmail('   ')
    expect(result.valid).toBe(false)
    expect(result.field).toBe('email')
    expect(result.message).toBe(CLIENT_VALIDATION_MESSAGES.EMAIL_REQUIRED)
  })

  it('returns invalid for email without @', () => {
    const result = validateClientEmail('testexample.com')
    expect(result.valid).toBe(false)
    expect(result.field).toBe('email')
    expect(result.message).toBe(CLIENT_VALIDATION_MESSAGES.EMAIL_INVALID)
  })

  it('returns invalid for email without domain', () => {
    const result = validateClientEmail('test@')
    expect(result.valid).toBe(false)
    expect(result.field).toBe('email')
    expect(result.message).toBe(CLIENT_VALIDATION_MESSAGES.EMAIL_INVALID)
  })

  it('returns invalid for email without local part', () => {
    const result = validateClientEmail('@example.com')
    expect(result.valid).toBe(false)
    expect(result.field).toBe('email')
    expect(result.message).toBe(CLIENT_VALIDATION_MESSAGES.EMAIL_INVALID)
  })
})

describe('validateClient', () => {
  it('returns empty array for valid client with required fields only', () => {
    const result = validateClient({
      name: 'Acme Corp',
      email: 'acme@example.com',
    })
    expect(result).toEqual([])
  })

  it('returns empty array for valid client with all fields', () => {
    const result = validateClient({
      name: 'Acme Corp',
      email: 'acme@example.com',
      phone: '+1-555-123-4567',
      address: '123 Main St\nNew York, NY 10001',
    })
    expect(result).toEqual([])
  })

  it('returns error for missing name', () => {
    const result = validateClient({
      name: '',
      email: 'acme@example.com',
    })
    expect(result.length).toBe(1)
    expect(result[0].field).toBe('name')
    expect(result[0].message).toBe(CLIENT_VALIDATION_MESSAGES.NAME_REQUIRED)
  })

  it('returns error for missing email', () => {
    const result = validateClient({
      name: 'Acme Corp',
      email: '',
    })
    expect(result.length).toBe(1)
    expect(result[0].field).toBe('email')
    expect(result[0].message).toBe(CLIENT_VALIDATION_MESSAGES.EMAIL_REQUIRED)
  })

  it('returns error for invalid email', () => {
    const result = validateClient({
      name: 'Acme Corp',
      email: 'not-an-email',
    })
    expect(result.length).toBe(1)
    expect(result[0].field).toBe('email')
    expect(result[0].message).toBe(CLIENT_VALIDATION_MESSAGES.EMAIL_INVALID)
  })

  it('returns multiple errors when both name and email are invalid', () => {
    const result = validateClient({
      name: '',
      email: 'invalid',
    })
    expect(result.length).toBe(2)
    expect(result.some((r) => r.field === 'name')).toBe(true)
    expect(result.some((r) => r.field === 'email')).toBe(true)
  })

  it('accepts null/undefined optional fields', () => {
    const result = validateClient({
      name: 'Acme Corp',
      email: 'acme@example.com',
      phone: null as unknown as undefined,
      address: undefined,
    })
    expect(result).toEqual([])
  })
})
