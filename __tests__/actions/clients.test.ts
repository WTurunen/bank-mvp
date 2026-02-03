import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  getCurrentUserId: vi.fn().mockResolvedValue('test-user-id'),
}))

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    client: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import {
  createClient,
  updateClient,
  archiveClient,
  restoreClient,
  getClient,
  getClients,
} from '@/app/actions/clients'

const mockClient = {
  id: 'client-1',
  userId: 'test-user-id',
  name: 'Acme Corp',
  email: 'acme@example.com',
  phone: '+1-555-123-4567',
  address: '123 Main St',
  archivedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

describe('createClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a client with required fields', async () => {
    vi.mocked(db.client.create).mockResolvedValue(mockClient)

    const result = await createClient({
      name: 'Acme Corp',
      email: 'acme@example.com',
    })

    expect(db.client.create).toHaveBeenCalledWith({
      data: {
        userId: 'test-user-id',
        name: 'Acme Corp',
        email: 'acme@example.com',
        phone: undefined,
        address: undefined,
      },
    })
    expect(result).toBe('client-1')
  })

  it('creates a client with all fields', async () => {
    vi.mocked(db.client.create).mockResolvedValue(mockClient)

    await createClient({
      name: 'Acme Corp',
      email: 'acme@example.com',
      phone: '+1-555-123-4567',
      address: '123 Main St',
    })

    expect(db.client.create).toHaveBeenCalledWith({
      data: {
        userId: 'test-user-id',
        name: 'Acme Corp',
        email: 'acme@example.com',
        phone: '+1-555-123-4567',
        address: '123 Main St',
      },
    })
  })

  it('revalidates the clients path after creation', async () => {
    vi.mocked(db.client.create).mockResolvedValue(mockClient)

    await createClient({
      name: 'Acme Corp',
      email: 'acme@example.com',
    })

    expect(revalidatePath).toHaveBeenCalledWith('/clients')
  })

  it('throws user-friendly error for duplicate email', async () => {
    const prismaError = new Error('Unique constraint failed')
    // @ts-expect-error - Adding Prisma error code to Error object
    prismaError.code = 'P2002'
    vi.mocked(db.client.create).mockRejectedValue(prismaError)

    await expect(
      createClient({
        name: 'Acme Corp',
        email: 'duplicate@example.com',
      })
    ).rejects.toThrow('A client with this email already exists')
  })
})

describe('updateClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates a client', async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(mockClient)
    vi.mocked(db.client.update).mockResolvedValue(mockClient)

    await updateClient('client-1', {
      name: 'Updated Corp',
      email: 'updated@example.com',
    })

    expect(db.client.update).toHaveBeenCalledWith({
      where: { id: 'client-1' },
      data: {
        name: 'Updated Corp',
        email: 'updated@example.com',
        phone: undefined,
        address: undefined,
      },
    })
  })

  it('revalidates paths after update', async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(mockClient)
    vi.mocked(db.client.update).mockResolvedValue(mockClient)

    await updateClient('client-1', {
      name: 'Updated Corp',
      email: 'updated@example.com',
    })

    expect(revalidatePath).toHaveBeenCalledWith('/clients')
    expect(revalidatePath).toHaveBeenCalledWith('/clients/client-1')
  })

  it('throws user-friendly error for duplicate email', async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(mockClient)
    const prismaError = new Error('Unique constraint failed')
    // @ts-expect-error - Adding Prisma error code to Error object
    prismaError.code = 'P2002'
    vi.mocked(db.client.update).mockRejectedValue(prismaError)

    await expect(
      updateClient('client-1', {
        name: 'Updated Corp',
        email: 'duplicate@example.com',
      })
    ).rejects.toThrow('A client with this email already exists')
  })
})

describe('archiveClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets archivedAt timestamp', async () => {
    const now = new Date()
    vi.setSystemTime(now)
    vi.mocked(db.client.findFirst).mockResolvedValue(mockClient)
    vi.mocked(db.client.update).mockResolvedValue({
      ...mockClient,
      archivedAt: now,
    })

    await archiveClient('client-1')

    expect(db.client.update).toHaveBeenCalledWith({
      where: { id: 'client-1' },
      data: { archivedAt: expect.any(Date) },
    })
  })

  it('revalidates paths after archive', async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(mockClient)
    vi.mocked(db.client.update).mockResolvedValue(mockClient)

    await archiveClient('client-1')

    expect(revalidatePath).toHaveBeenCalledWith('/clients')
    expect(revalidatePath).toHaveBeenCalledWith('/clients/client-1')
  })
})

describe('restoreClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clears archivedAt timestamp', async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(mockClient)
    vi.mocked(db.client.update).mockResolvedValue({
      ...mockClient,
      archivedAt: null,
    })

    await restoreClient('client-1')

    expect(db.client.update).toHaveBeenCalledWith({
      where: { id: 'client-1' },
      data: { archivedAt: null },
    })
  })

  it('revalidates paths after restore', async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(mockClient)
    vi.mocked(db.client.update).mockResolvedValue(mockClient)

    await restoreClient('client-1')

    expect(revalidatePath).toHaveBeenCalledWith('/clients')
    expect(revalidatePath).toHaveBeenCalledWith('/clients/client-1')
  })
})

describe('getClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a client by id', async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(mockClient)

    const result = await getClient('client-1')

    expect(db.client.findFirst).toHaveBeenCalledWith({
      where: { id: 'client-1', userId: 'test-user-id' },
      include: { invoices: true },
    })
    expect(result).toEqual(mockClient)
  })

  it('returns null for non-existent client', async () => {
    vi.mocked(db.client.findFirst).mockResolvedValue(null)

    const result = await getClient('non-existent')

    expect(result).toBeNull()
  })
})

describe('getClients', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns active clients by default', async () => {
    vi.mocked(db.client.findMany).mockResolvedValue([mockClient])

    const result = await getClients()

    expect(db.client.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id', archivedAt: null },
      include: { _count: { select: { invoices: true } } },
      orderBy: { name: 'asc' },
    })
    expect(result).toEqual([mockClient])
  })

  it('includes archived clients when requested', async () => {
    const archivedClient = { ...mockClient, archivedAt: new Date() }
    vi.mocked(db.client.findMany).mockResolvedValue([mockClient, archivedClient])

    const result = await getClients(true)

    expect(db.client.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id' },
      include: { _count: { select: { invoices: true } } },
      orderBy: { name: 'asc' },
    })
    expect(result).toHaveLength(2)
  })
})
