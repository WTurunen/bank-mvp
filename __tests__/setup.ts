// Test factories - consistent test data
export type MockLineItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export type MockInvoice = {
  id: string
  clientName: string
  clientEmail: string
  invoiceDate: Date
  dueDate: Date
  notes: string | null
  lineItems: MockLineItem[]
}

export function createMockLineItem(overrides?: Partial<MockLineItem>): MockLineItem {
  return {
    id: crypto.randomUUID(),
    description: 'Test Service',
    quantity: 1,
    unitPrice: 100,
    ...overrides,
  }
}

export function createMockInvoice(overrides?: Partial<MockInvoice>): MockInvoice {
  const invoiceDate = new Date()
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  return {
    id: crypto.randomUUID(),
    clientName: 'Test Client',
    clientEmail: 'test@example.com',
    invoiceDate,
    dueDate,
    notes: null,
    lineItems: [createMockLineItem()],
    ...overrides,
  }
}
