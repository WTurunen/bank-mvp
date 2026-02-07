import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Prisma } from '@prisma/client'

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: vi.fn(),
  },
}))

import { db } from '@/lib/db'
import { withTransaction } from './transaction'

describe('withTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes callback within a transaction', async () => {
    const callback = vi.fn().mockResolvedValue('result')
    vi.mocked(db.$transaction).mockImplementation(async (cb) => cb({} as never))

    await withTransaction(callback)

    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('returns the callback result', async () => {
    const callback = vi.fn().mockResolvedValue({ id: '123' })
    vi.mocked(db.$transaction).mockImplementation(async (cb) => cb({} as never))

    const result = await withTransaction(callback)
    expect(result).toEqual({ id: '123' })
  })

  it('passes options to $transaction', async () => {
    const callback = vi.fn().mockResolvedValue('ok')
    vi.mocked(db.$transaction).mockImplementation(async (cb) => cb({} as never))

    await withTransaction(callback, {
      timeout: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })

    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 10000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  })

  it('throws non-retryable errors immediately', async () => {
    const error = new Error('Some error')
    vi.mocked(db.$transaction).mockRejectedValue(error)

    await expect(withTransaction(vi.fn())).rejects.toThrow('Some error')
    expect(db.$transaction).toHaveBeenCalledTimes(1) // No retries
  })

  it('retries on P2034 (deadlock) and succeeds', async () => {
    const deadlockError = new Prisma.PrismaClientKnownRequestError('Deadlock', {
      code: 'P2034',
      clientVersion: '5.0.0',
    })

    vi.mocked(db.$transaction)
      .mockRejectedValueOnce(deadlockError)
      .mockImplementation(async (cb) => cb({} as never))

    const callback = vi.fn().mockResolvedValue('recovered')
    const result = await withTransaction(callback, { maxRetries: 3 })

    expect(result).toBe('recovered')
    expect(db.$transaction).toHaveBeenCalledTimes(2)
  })

  it('throws after max retries on repeated P2034', async () => {
    const deadlockError = new Prisma.PrismaClientKnownRequestError('Deadlock', {
      code: 'P2034',
      clientVersion: '5.0.0',
    })

    vi.mocked(db.$transaction).mockRejectedValue(deadlockError)

    await expect(withTransaction(vi.fn(), { maxRetries: 2 })).rejects.toThrow()
    expect(db.$transaction).toHaveBeenCalledTimes(2)
  })
})
