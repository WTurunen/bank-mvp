import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, calculateInvoiceTotal, cn } from './utils'

describe('formatCurrency', () => {
  it('formats positive amounts with dollar sign and two decimals', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('formats zero as $0.00', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats negative amounts', () => {
    expect(formatCurrency(-100)).toBe('-$100.00')
  })

  it('rounds to two decimal places', () => {
    expect(formatCurrency(10.999)).toBe('$11.00')
  })
})

describe('formatDate', () => {
  it('formats date as Month Day, Year', () => {
    const date = new Date('2026-01-25')
    expect(formatDate(date)).toBe('Jan 25, 2026')
  })
})

describe('calculateInvoiceTotal', () => {
  it('returns 0 for empty array', () => {
    expect(calculateInvoiceTotal([])).toBe(0)
  })

  it('calculates total for single line item', () => {
    const items = [{ quantity: 2, unitPrice: 50 }]
    expect(calculateInvoiceTotal(items)).toBe(100)
  })

  it('calculates total for multiple line items', () => {
    const items = [
      { quantity: 2, unitPrice: 50 },
      { quantity: 3, unitPrice: 25 },
    ]
    expect(calculateInvoiceTotal(items)).toBe(175)
  })

  it('handles decimal quantities and prices', () => {
    const items = [{ quantity: 1.5, unitPrice: 10.5 }]
    expect(calculateInvoiceTotal(items)).toBe(15.75)
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible')
  })

  it('merges tailwind classes correctly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })
})
