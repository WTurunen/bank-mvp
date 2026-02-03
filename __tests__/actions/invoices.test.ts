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
      findMany: vi.fn(),
      delete: vi.fn(),
    },
    lineItem: {
      deleteMany: vi.fn(),
    },
    client: {
      findFirst: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import {
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoices,
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
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
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
    expect(result).toBe('invoice-1')
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
    expect(result).toBe('invoice-1')
  })

  it('rejects invalid clientId', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)
    vi.mocked(db.client.findFirst).mockResolvedValue(null)

    await expect(
      createInvoice({
        clientId: 'invalid-client-id',
        clientName: 'Acme Corp',
        clientEmail: 'acme@example.com',
        dueDate: '2026-02-01',
        lineItems: [
          { description: 'Service', quantity: 1, unitPrice: 100 },
        ],
      })
    ).rejects.toThrow('Client not found')

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

    await expect(
      updateInvoice('invoice-1', {
        clientId: 'invalid-client-id',
        clientName: 'Updated Corp',
        clientEmail: 'updated@example.com',
        dueDate: '2026-02-01',
        lineItems: [
          { description: 'Service', quantity: 1, unitPrice: 100 },
        ],
      })
    ).rejects.toThrow('Client not found')

    expect(db.invoice.update).not.toHaveBeenCalled()
  })

  it('throws error for non-existent invoice', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

    await expect(
      updateInvoice('non-existent', {
        clientName: 'Updated Corp',
        clientEmail: 'updated@example.com',
        dueDate: '2026-02-01',
        lineItems: [
          { description: 'Service', quantity: 1, unitPrice: 100 },
        ],
      })
    ).rejects.toThrow('Invoice not found')
  })

  it('revalidates paths after update', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(mockInvoice)
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

    await expect(
      updateInvoiceStatus('non-existent', 'sent')
    ).rejects.toThrow('Invoice not found')
  })
})

describe('deleteInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes an invoice', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(mockInvoice)
    vi.mocked(db.invoice.delete).mockResolvedValue(mockInvoice)

    await deleteInvoice('invoice-1')

    expect(db.invoice.delete).toHaveBeenCalledWith({
      where: { id: 'invoice-1' },
    })
  })

  it('throws error for non-existent invoice', async () => {
    vi.mocked(db.invoice.findFirst).mockResolvedValue(null)

    await expect(deleteInvoice('non-existent')).rejects.toThrow(
      'Invoice not found'
    )
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

    const result = await getInvoices()

    expect(db.invoice.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id' },
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].lineItems[0].quantity).toBe(1)
    expect(result[0].lineItems[0].unitPrice).toBe(100)
  })

  it('filters by clientId when provided', async () => {
    vi.mocked(db.invoice.findMany).mockResolvedValue([])

    await getInvoices('client-1')

    expect(db.invoice.findMany).toHaveBeenCalledWith({
      where: { userId: 'test-user-id', clientId: 'client-1' },
      include: { lineItems: true },
      orderBy: { createdAt: 'desc' },
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
      where: { id: 'invoice-1', userId: 'test-user-id' },
      include: { lineItems: true },
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
