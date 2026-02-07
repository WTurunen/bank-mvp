import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

// Mock auth
vi.mock('@/lib/auth', () => ({
  getCurrentUserId: vi.fn().mockResolvedValue('test-user-id'),
}))

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    invoice: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    lineItem: {
      deleteMany: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
  },
}))

// Mock transaction helper — passes the mocked db as the tx client
vi.mock('@/lib/transaction', () => ({
  withTransaction: vi.fn(async (callback) => {
    const { db } = await import('@/lib/db')
    return callback(db)
  }),
}))

// Mock invoice number generator
vi.mock('@/lib/invoice-number', () => ({
  getNextInvoiceNumber: vi.fn().mockResolvedValue('INV-001'),
}))

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import {
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  restoreInvoice,
  getInvoices,
  getInvoicesList,
  getDashboardStats,
  getInvoice,
} from '@/app/actions/invoices'

const mockInvoice = {
  id: 'invoice-1',
  userId: 'test-user-id',
  invoiceNumber: 'INV-001',
  clientId: 'client-1',
  clientName: 'Acme Corp',
  clientEmail: 'acme@example.com',
  clientPhone: '+1-555-123-4567',
  clientAddress: '123 Main St',
  status: 'draft',
  issueDate: new Date('2026-01-01'),
  dueDate: new Date('2026-02-01'),
  notes: 'Test notes',
  archivedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  version: 0,
}

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

describe('createInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an invoice without clientId', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)
    vi.mocked(db.invoice.create).mockResolvedValue(mockInvoice)

    const result = await createInvoice({
      clientName: 'Acme Corp',
      clientEmail: 'acme@example.com',
      dueDate: '2026-02-01',
      lineItems: [
        { description: 'Service', quantity: 1, unitPrice: 100 },
      ],
    })

    expect(db.client.findFirst).not.toHaveBeenCalled()
    expect(db.invoice.create).toHaveBeenCalled()
    expect(result).toEqual({ success: true, data: 'invoice-1' })
  })

  it('creates an invoice with valid clientId', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)
    vi.mocked(db.client.findFirst).mockResolvedValue(mockClient)
    vi.mocked(db.invoice.create).mockResolvedValue(mockInvoice)

    const result = await createInvoice({
      clientId: 'client-1',
      clientName: 'Acme Corp',
      clientEmail: 'acme@example.com',
      dueDate: '2026-02-01',
      lineItems: [
        { description: 'Service', quantity: 1, unitPrice: 100 },
      ],
    })

    expect(db.client.findFirst).toHaveBeenCalledWith({
      where: { id: 'client-1', userId: 'test-user-id' },
    })
    expect(db.invoice.create).toHaveBeenCalled()
    expect(result).toEqual({ success: true, data: 'invoice-1' })
  })

  it('rejects invalid clientId', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)
    vi.mocked(db.client.findFirst).mockResolvedValue(null)

    const result = await createInvoice({
      clientId: 'invalid-client-id',
      clientName: 'Acme Corp',
      clientEmail: 'acme@example.com',
      dueDate: '2026-02-01',
      lineItems: [
        { description: 'Service', quantity: 1, unitPrice: 100 },
      ],
    })

    expect(result).toEqual({ success: false, error: 'Client not found' })
    expect(db.invoice.create).not.toHaveBeenCalled()
  })

  it('revalidates the root path after creation', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)
    vi.mocked(db.invoice.create).mockResolvedValue(mockInvoice)

    await createInvoice({
      clientName: 'Acme Corp',
      clientEmail: 'acme@example.com',
      dueDate: '2026-02-01',
      lineItems: [
        { description: 'Service', quantity: 1, unitPrice: 100 },
      ],
    })

    expect(revalidatePath).toHaveBeenCalledWith('/')
  })
})

describe('updateInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates an invoice with valid clientId', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(mockInvoice)
    vi.mocked(db.invoice.findUnique).mockResolvedValue(mockInvoice)
    vi.mocked(db.client.findFirst).mockResolvedValue(mockClient)
    vi.mocked(db.lineItem.deleteMany).mockResolvedValue({ count: 1 })
    vi.mocked(db.invoice.update).mockResolvedValue(mockInvoice)

    await updateInvoice('invoice-1', {
      clientId: 'client-1',
      clientName: 'Updated Corp',
      clientEmail: 'updated@example.com',
      dueDate: '2026-02-01',
      lineItems: [
        { description: 'Service', quantity: 1, unitPrice: 100 },
      ],
    })

    expect(db.client.findFirst).toHaveBeenCalledWith({
      where: { id: 'client-1', userId: 'test-user-id' },
    })
    expect(db.invoice.update).toHaveBeenCalled()
  })

  it('rejects invalid clientId', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(mockInvoice)
    vi.mocked(db.client.findFirst).mockResolvedValue(null)

    const result = await updateInvoice('invoice-1', {
      clientId: 'invalid-client-id',
      clientName: 'Updated Corp',
      clientEmail: 'updated@example.com',
      dueDate: '2026-02-01',
      lineItems: [
        { description: 'Service', quantity: 1, unitPrice: 100 },
      ],
    })

    expect(result).toEqual({ success: false, error: 'Client not found' })
    expect(db.invoice.update).not.toHaveBeenCalled()
  })

  it('throws error for non-existent invoice', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

    const result = await updateInvoice('non-existent', {
      clientName: 'Updated Corp',
      clientEmail: 'updated@example.com',
      dueDate: '2026-02-01',
      lineItems: [
        { description: 'Service', quantity: 1, unitPrice: 100 },
      ],
    })

    expect(result).toEqual({ success: false, error: 'Invoice not found' })
  })

  it('revalidates paths after update', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(mockInvoice)
    vi.mocked(db.invoice.findUnique).mockResolvedValue(mockInvoice)
    vi.mocked(db.lineItem.deleteMany).mockResolvedValue({ count: 1 })
    vi.mocked(db.invoice.update).mockResolvedValue(mockInvoice)

    await updateInvoice('invoice-1', {
      clientName: 'Updated Corp',
      clientEmail: 'updated@example.com',
      dueDate: '2026-02-01',
      lineItems: [
        { description: 'Service', quantity: 1, unitPrice: 100 },
      ],
    })

    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/invoices/invoice-1')
  })
})

describe('updateInvoiceStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates invoice status', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(mockInvoice)
    vi.mocked(db.invoice.update).mockResolvedValue({
      ...mockInvoice,
      status: 'sent',
    })

    await updateInvoiceStatus('invoice-1', 'sent')

    expect(db.invoice.update).toHaveBeenCalledWith({
      where: { id: 'invoice-1' },
      data: { status: 'sent' },
    })
  })

  it('throws error for non-existent invoice', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

    const result = await updateInvoiceStatus('non-existent', 'sent')

    expect(result).toEqual({ success: false, error: 'Invoice not found' })
  })
})

describe('deleteInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('archives an invoice (soft delete)', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(mockInvoice)
    vi.mocked(db.invoice.update).mockResolvedValue(mockInvoice)

    await deleteInvoice('invoice-1')

    expect(db.invoice.update).toHaveBeenCalledWith({
      where: { id: 'invoice-1' },
      data: { archivedAt: expect.any(Date) },
    })
  })

  it('throws error for non-existent invoice', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

    const result = await deleteInvoice('non-existent')

    expect(result).toEqual({ success: false, error: 'Invoice not found' })
  })
})

describe('getInvoices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all invoices for user', async () => {
    const mockInvoiceWithLineItems = {
      ...mockInvoice,
      lineItems: [
        {
          id: 'line-1',
          invoiceId: 'invoice-1',
          description: 'Service',
          quantity: { toNumber: () => 1 },
          unitPrice: { toNumber: () => 100 },
        },
      ],
    }
    vi.mocked(db.invoice.findMany).mockResolvedValue([mockInvoiceWithLineItems])
    vi.mocked(db.invoice.count).mockResolvedValue(1)

    const result = await getInvoices()

    expect(db.invoice.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id', archivedAt: null },
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    })
    expect(db.invoice.count).toHaveBeenCalledWith({
      where: { userId: 'test-user-id', archivedAt: null },
    })
    expect(result.data).toHaveLength(1)
    expect(result.data[0].lineItems[0].quantity).toBe(1)
    expect(result.data[0].lineItems[0].unitPrice).toBe(100)
    expect(result.pagination.totalCount).toBe(1)
    expect(result.pagination.page).toBe(1)
  })

  it('filters by clientId when provided', async () => {
    vi.mocked(db.invoice.findMany).mockResolvedValue([])
    vi.mocked(db.invoice.count).mockResolvedValue(0)

    await getInvoices('client-1')

    expect(db.invoice.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id', clientId: 'client-1', archivedAt: null },
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    })
    expect(db.invoice.count).toHaveBeenCalledWith({
      where: { userId: 'test-user-id', clientId: 'client-1', archivedAt: null },
    })
  })
})

describe('getInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an invoice by id', async () => {
    const mockInvoiceWithLineItems = {
      ...mockInvoice,
      lineItems: [
        {
          id: 'line-1',
          invoiceId: 'invoice-1',
          description: 'Service',
          quantity: { toNumber: () => 1 },
          unitPrice: { toNumber: () => 100 },
        },
      ],
    }
    vi.mocked(db.invoice.findFirst).mockResolvedValue(mockInvoiceWithLineItems)

    const result = await getInvoice('invoice-1')

    expect(db.invoice.findFirst).toHaveBeenCalledWith({
      where: { id: 'invoice-1', userId: 'test-user-id', archivedAt: null },
      include: {
        lineItems: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
    expect(result?.lineItems[0].quantity).toBe(1)
    expect(result?.lineItems[0].unitPrice).toBe(100)
  })

  it('returns null for non-existent invoice', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

    const result = await getInvoice('non-existent')

    expect(result).toBeNull()
  })
})

describe('restoreInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('restores an archived invoice', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue({
      ...mockInvoice,
      archivedAt: new Date(),
    })
    vi.mocked(db.invoice.update).mockResolvedValue(mockInvoice)

    const result = await restoreInvoice('invoice-1')

    expect(db.invoice.update).toHaveBeenCalledWith({
      where: { id: 'invoice-1' },
      data: { archivedAt: null },
    })
    expect(result).toEqual({ success: true, data: undefined })
  })

  it('returns error for non-existent invoice', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

    const result = await restoreInvoice('non-existent')
    expect(result).toEqual({ success: false, error: 'Invoice not found' })
  })

  it('returns error if invoice is not archived', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue({
      ...mockInvoice,
      archivedAt: null,
    })

    const result = await restoreInvoice('invoice-1')
    expect(result).toEqual({ success: false, error: 'Invoice is not archived' })
  })
})

describe('deleteInvoice - paid invoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects deleting a paid invoice', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue({
      ...mockInvoice,
      status: 'paid',
    })

    const result = await deleteInvoice('invoice-1')
    expect(result).toEqual({ success: false, error: 'Cannot delete a paid invoice' })
    expect(db.invoice.update).not.toHaveBeenCalled()
  })
})

describe('getInvoicesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns optimized list with computed totals', async () => {
    vi.mocked(db.invoice.findMany).mockResolvedValue([
      {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        clientName: 'Acme',
        status: 'draft',
        dueDate: new Date('2026-02-01'),
        archivedAt: null,
        lineItems: [
          { quantity: { toNumber: () => 2 }, unitPrice: { toNumber: () => 50 } },
        ],
      },
    ] as never)
    vi.mocked(db.invoice.count).mockResolvedValue(1)

    const result = await getInvoicesList()

    expect(result.data).toHaveLength(1)
    expect(result.data[0].total).toBe(100)
    expect(result.data[0].invoiceNumber).toBe('INV-001')
    expect(result.pagination.totalCount).toBe(1)
  })
})

describe('getDashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculates stats from invoices', async () => {
    const pastDate = new Date('2020-01-01')
    const futureDate = new Date('2099-01-01')

    vi.mocked(db.invoice.findMany).mockResolvedValue([
      {
        status: 'paid',
        dueDate: futureDate,
        lineItems: [
          { quantity: { toNumber: () => 1 }, unitPrice: { toNumber: () => 100 } },
        ],
      },
      {
        status: 'sent',
        dueDate: futureDate,
        lineItems: [
          { quantity: { toNumber: () => 2 }, unitPrice: { toNumber: () => 50 } },
        ],
      },
      {
        status: 'sent',
        dueDate: pastDate,
        lineItems: [
          { quantity: { toNumber: () => 1 }, unitPrice: { toNumber: () => 200 } },
        ],
      },
      {
        status: 'draft',
        dueDate: futureDate,
        lineItems: [
          { quantity: { toNumber: () => 1 }, unitPrice: { toNumber: () => 50 } },
        ],
      },
    ] as never)

    const stats = await getDashboardStats()

    expect(stats.totalPaid).toBe(100)
    expect(stats.totalOutstanding).toBe(300)
    expect(stats.totalOverdue).toBe(200)
    expect(stats.overdueCount).toBe(1)
    expect(stats.invoiceCount).toBe(4)
  })

  it('returns zeros when no invoices', async () => {
    vi.mocked(db.invoice.findMany).mockResolvedValue([])

    const stats = await getDashboardStats()

    expect(stats).toEqual({
      totalOutstanding: 0,
      totalPaid: 0,
      totalOverdue: 0,
      invoiceCount: 0,
      overdueCount: 0,
    })
  })
})

describe('createInvoice - validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects missing required fields', async () => {
    const result = await createInvoice({
      clientName: '',
      clientEmail: 'test@example.com',
      dueDate: '2026-02-01',
      lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
    })

    expect(result.success).toBe(false)
    expect(db.invoice.create).not.toHaveBeenCalled()
  })
})

describe('updateInvoice - version mismatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects when version does not match', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue({
      ...mockInvoice,
      version: 5,
    })

    const result = await updateInvoice('invoice-1', {
      clientName: 'Updated',
      clientEmail: 'test@example.com',
      dueDate: '2026-02-01',
      lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
      version: 3,
    })

    expect(result).toEqual({
      success: false,
      error: 'Invoice has been modified by another user. Please refresh and try again.',
    })
    expect(db.invoice.update).not.toHaveBeenCalled()
  })
})
