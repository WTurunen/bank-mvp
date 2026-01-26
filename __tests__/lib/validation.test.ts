import { describe, it, expect } from 'vitest'
import {
  validateDueDate,
  validateLineItems,
  validateLineItemQuantity,
  validateLineItemPrice,
  validateLineItemNumeric,
  validateHasCompleteLineItem,
  validateInvoice,
  VALIDATION_MESSAGES,
} from '@/lib/validation'
import { createMockLineItem, createMockInvoice } from '../setup'

describe('validateDueDate', () => {
  it('returns valid when due date equals invoice date', () => {
    const date = new Date('2026-01-25')
    const result = validateDueDate(date, date)
    expect(result.valid).toBe(true)
  })

  it('returns valid when due date is after invoice date', () => {
    const invoiceDate = new Date('2026-01-25')
    const dueDate = new Date('2026-02-25')
    const result = validateDueDate(invoiceDate, dueDate)
    expect(result.valid).toBe(true)
  })

  it('returns invalid when due date is before invoice date', () => {
    const invoiceDate = new Date('2026-01-25')
    const dueDate = new Date('2026-01-20')
    const result = validateDueDate(invoiceDate, dueDate)
    expect(result.valid).toBe(false)
    expect(result.field).toBe('dueDate')
    expect(result.message).toBe(VALIDATION_MESSAGES.DUE_DATE_BEFORE_INVOICE)
  })
})

describe('validateLineItems', () => {
  it('returns valid when at least one line item exists', () => {
    const items = [createMockLineItem()]
    const result = validateLineItems(items)
    expect(result.valid).toBe(true)
  })

  it('returns valid when multiple line items exist', () => {
    const items = [createMockLineItem(), createMockLineItem()]
    const result = validateLineItems(items)
    expect(result.valid).toBe(true)
  })

  it('returns invalid when no line items', () => {
    const result = validateLineItems([])
    expect(result.valid).toBe(false)
    expect(result.field).toBe('lineItems')
    expect(result.message).toBe(VALIDATION_MESSAGES.NO_LINE_ITEMS)
  })
})

describe('validateLineItemQuantity', () => {
  it('returns valid for positive quantity', () => {
    const result = validateLineItemQuantity(1)
    expect(result.valid).toBe(true)
  })

  it('returns valid for quantity greater than 1', () => {
    const result = validateLineItemQuantity(10)
    expect(result.valid).toBe(true)
  })

  it('returns valid for decimal quantity', () => {
    const result = validateLineItemQuantity(0.5)
    expect(result.valid).toBe(true)
  })

  it('returns invalid for zero quantity', () => {
    const result = validateLineItemQuantity(0)
    expect(result.valid).toBe(false)
    expect(result.field).toBe('quantity')
    expect(result.message).toBe(VALIDATION_MESSAGES.QUANTITY_NOT_POSITIVE)
  })

  it('returns invalid for negative quantity', () => {
    const result = validateLineItemQuantity(-5)
    expect(result.valid).toBe(false)
    expect(result.field).toBe('quantity')
    expect(result.message).toBe(VALIDATION_MESSAGES.QUANTITY_NOT_POSITIVE)
  })
})

describe('validateLineItemPrice', () => {
  it('returns valid for positive price', () => {
    const result = validateLineItemPrice(100)
    expect(result.valid).toBe(true)
  })

  it('returns valid for zero price (free item)', () => {
    const result = validateLineItemPrice(0)
    expect(result.valid).toBe(true)
  })

  it('returns valid for decimal price', () => {
    const result = validateLineItemPrice(99.99)
    expect(result.valid).toBe(true)
  })

  it('returns invalid for negative price', () => {
    const result = validateLineItemPrice(-50)
    expect(result.valid).toBe(false)
    expect(result.field).toBe('unitPrice')
    expect(result.message).toBe(VALIDATION_MESSAGES.PRICE_NEGATIVE)
  })
})

describe('validateLineItemNumeric', () => {
  it('returns valid for integer', () => {
    const result = validateLineItemNumeric(42)
    expect(result.valid).toBe(true)
  })

  it('returns valid for float', () => {
    const result = validateLineItemNumeric(3.14)
    expect(result.valid).toBe(true)
  })

  it('returns valid for zero', () => {
    const result = validateLineItemNumeric(0)
    expect(result.valid).toBe(true)
  })

  it('returns invalid for NaN', () => {
    const result = validateLineItemNumeric(NaN)
    expect(result.valid).toBe(false)
    expect(result.field).toBe('value')
    expect(result.message).toBe(VALIDATION_MESSAGES.VALUE_NOT_NUMERIC)
  })

  it('returns invalid for string', () => {
    const result = validateLineItemNumeric('abc')
    expect(result.valid).toBe(false)
    expect(result.field).toBe('value')
    expect(result.message).toBe(VALIDATION_MESSAGES.VALUE_NOT_NUMERIC)
  })

  it('returns invalid for undefined', () => {
    const result = validateLineItemNumeric(undefined)
    expect(result.valid).toBe(false)
    expect(result.field).toBe('value')
    expect(result.message).toBe(VALIDATION_MESSAGES.VALUE_NOT_NUMERIC)
  })

  it('returns invalid for null', () => {
    const result = validateLineItemNumeric(null)
    expect(result.valid).toBe(false)
    expect(result.field).toBe('value')
    expect(result.message).toBe(VALIDATION_MESSAGES.VALUE_NOT_NUMERIC)
  })
})

describe('validateHasCompleteLineItem', () => {
  it('returns valid when at least one line item has description and positive price', () => {
    const items = [createMockLineItem({ description: 'Service', unitPrice: 100 })]
    const result = validateHasCompleteLineItem(items)
    expect(result.valid).toBe(true)
  })

  it('returns valid when one of multiple items is complete', () => {
    const items = [
      createMockLineItem({ description: '', unitPrice: 0 }),
      createMockLineItem({ description: 'Service', unitPrice: 50 }),
    ]
    const result = validateHasCompleteLineItem(items)
    expect(result.valid).toBe(true)
  })

  it('returns invalid when no items have description', () => {
    const items = [createMockLineItem({ description: '', unitPrice: 100 })]
    const result = validateHasCompleteLineItem(items)
    expect(result.valid).toBe(false)
    expect(result.field).toBe('lineItems')
    expect(result.message).toBe(VALIDATION_MESSAGES.NO_COMPLETE_LINE_ITEM)
  })

  it('returns invalid when no items have positive price', () => {
    const items = [createMockLineItem({ description: 'Service', unitPrice: 0 })]
    const result = validateHasCompleteLineItem(items)
    expect(result.valid).toBe(false)
    expect(result.field).toBe('lineItems')
    expect(result.message).toBe(VALIDATION_MESSAGES.NO_COMPLETE_LINE_ITEM)
  })

  it('returns invalid for empty array', () => {
    const result = validateHasCompleteLineItem([])
    expect(result.valid).toBe(false)
  })
})

describe('validateInvoice', () => {
  it('returns empty array for valid invoice', () => {
    const invoice = createMockInvoice()
    const results = validateInvoice(invoice)
    expect(results).toEqual([])
  })

  it('returns error for due date before invoice date', () => {
    const invoice = createMockInvoice({
      invoiceDate: new Date('2026-02-01'),
      dueDate: new Date('2026-01-15'),
    })
    const results = validateInvoice(invoice)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.field === 'dueDate')).toBe(true)
  })

  it('returns error for empty line items', () => {
    const invoice = createMockInvoice({ lineItems: [] })
    const results = validateInvoice(invoice)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.field === 'lineItems')).toBe(true)
  })

  it('returns error for line item with zero quantity', () => {
    const invoice = createMockInvoice({
      lineItems: [createMockLineItem({ quantity: 0 })],
    })
    const results = validateInvoice(invoice)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.field === 'quantity')).toBe(true)
  })

  it('returns error for line item with negative price', () => {
    const invoice = createMockInvoice({
      lineItems: [createMockLineItem({ unitPrice: -10 })],
    })
    const results = validateInvoice(invoice)
    expect(results.length).toBeGreaterThan(0)
    expect(results.some((r) => r.field === 'unitPrice')).toBe(true)
  })

  it('returns multiple errors when multiple validations fail', () => {
    const invoice = createMockInvoice({
      invoiceDate: new Date('2026-02-01'),
      dueDate: new Date('2026-01-15'),
      lineItems: [createMockLineItem({ quantity: -1, unitPrice: -10 })],
    })
    const results = validateInvoice(invoice)
    expect(results.length).toBeGreaterThanOrEqual(3) // dueDate, quantity, price
  })
})
