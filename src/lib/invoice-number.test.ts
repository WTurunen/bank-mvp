import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}))

import { db } from '@/lib/db'
import { getNextInvoiceNumber } from './invoice-number'

describe('getNextInvoiceNumber', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns formatted invoice number when counter exists', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ counter: 1 }])

    const result = await getNextInvoiceNumber('user-1')
    expect(result).toBe('INV-001')
    expect(db.$queryRaw).toHaveBeenCalledTimes(1)
  })

  it('pads counter to 3 digits', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ counter: 42 }])

    const result = await getNextInvoiceNumber('user-1')
    expect(result).toBe('INV-042')
  })

  it('handles counter above 999', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ counter: 1234 }])

    const result = await getNextInvoiceNumber('user-1')
    expect(result).toBe('INV-1234')
  })

  it('creates counter when none exists and returns number', async () => {
    // First queryRaw returns empty (no counter)
    vi.mocked(db.$queryRaw)
      .mockResolvedValueOnce([])       // UPDATE returns nothing
      .mockResolvedValueOnce([{ counter: 1 }])  // SELECT returns counter

    const result = await getNextInvoiceNumber('user-1')
    expect(result).toBe('INV-001')
    expect(db.$executeRaw).toHaveBeenCalledTimes(1)
  })

  it('throws when counter creation fails', async () => {
    vi.mocked(db.$queryRaw)
      .mockResolvedValueOnce([])   // UPDATE returns nothing
      .mockResolvedValueOnce([])   // SELECT also returns nothing

    await expect(getNextInvoiceNumber('user-1')).rejects.toThrow(
      'Failed to initialize invoice counter'
    )
  })
})
