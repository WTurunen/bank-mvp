import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
}))

import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { registerUser } from '@/app/actions/auth'

describe('registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers a new user successfully', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null)
    vi.mocked(db.user.create).mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
    } as never)

    const result = await registerUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result).toEqual({ success: true })
    expect(hashPassword).toHaveBeenCalledWith('password123')
    expect(db.user.create).toHaveBeenCalledWith({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
      },
    })
  })

  it('rejects short name', async () => {
    const result = await registerUser({
      name: 'A',
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result).toEqual({ success: false, error: 'Name must be at least 2 characters' })
    expect(db.user.create).not.toHaveBeenCalled()
  })

  it('rejects empty name', async () => {
    const result = await registerUser({
      name: '',
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result).toEqual({ success: false, error: 'Name must be at least 2 characters' })
  })

  it('rejects invalid email', async () => {
    const result = await registerUser({
      name: 'Test User',
      email: 'not-an-email',
      password: 'password123',
    })

    expect(result).toEqual({ success: false, error: 'Invalid email address' })
  })

  it('rejects empty email', async () => {
    const result = await registerUser({
      name: 'Test User',
      email: '',
      password: 'password123',
    })

    expect(result).toEqual({ success: false, error: 'Invalid email address' })
  })

  it('rejects short password', async () => {
    const result = await registerUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'short',
    })

    expect(result).toEqual({ success: false, error: 'Password must be at least 8 characters' })
  })

  it('rejects empty password', async () => {
    const result = await registerUser({
      name: 'Test User',
      email: 'test@example.com',
      password: '',
    })

    expect(result).toEqual({ success: false, error: 'Password must be at least 8 characters' })
  })

  it('rejects duplicate email', async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: 'existing-user',
      name: 'Existing',
      email: 'test@example.com',
      passwordHash: 'hash',
    } as never)

    const result = await registerUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result).toEqual({ success: false, error: 'An account with this email already exists' })
    expect(db.user.create).not.toHaveBeenCalled()
  })
})
