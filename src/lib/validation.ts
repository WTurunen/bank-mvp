export type ValidationResult = {
  valid: boolean
  field: string
  message: string
}

export const VALIDATION_MESSAGES = {
  DUE_DATE_BEFORE_INVOICE: 'Due date must be on or after invoice date',
  NO_LINE_ITEMS: 'At least one line item is required',
  NO_COMPLETE_LINE_ITEM: 'Please add at least one line item with a description and price.',
  QUANTITY_NOT_POSITIVE: 'Quantity must be greater than zero',
  PRICE_NEGATIVE: 'Price cannot be negative',
  VALUE_NOT_NUMERIC: 'Value must be a number',
}

export type LineItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export type InvoiceFormData = {
  id: string
  clientName: string
  clientEmail: string
  invoiceDate: Date
  dueDate: Date
  notes: string | null
  lineItems: LineItem[]
}

function validResult(field: string): ValidationResult {
  return { valid: true, field, message: '' }
}

function invalidResult(field: string, message: string): ValidationResult {
  return { valid: false, field, message }
}

export function validateDueDate(
  invoiceDate: Date,
  dueDate: Date
): ValidationResult {
  const invoiceTime = new Date(invoiceDate).setHours(0, 0, 0, 0)
  const dueTime = new Date(dueDate).setHours(0, 0, 0, 0)

  if (dueTime < invoiceTime) {
    return invalidResult('dueDate', VALIDATION_MESSAGES.DUE_DATE_BEFORE_INVOICE)
  }
  return validResult('dueDate')
}

export function validateLineItems(items: LineItem[]): ValidationResult {
  if (items.length === 0) {
    return invalidResult('lineItems', VALIDATION_MESSAGES.NO_LINE_ITEMS)
  }
  return validResult('lineItems')
}

export function validateLineItemQuantity(quantity: number): ValidationResult {
  if (quantity <= 0) {
    return invalidResult('quantity', VALIDATION_MESSAGES.QUANTITY_NOT_POSITIVE)
  }
  return validResult('quantity')
}

export function validateLineItemPrice(price: number): ValidationResult {
  if (price < 0) {
    return invalidResult('unitPrice', VALIDATION_MESSAGES.PRICE_NEGATIVE)
  }
  return validResult('unitPrice')
}

export function validateLineItemNumeric(value: unknown): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return invalidResult('value', VALIDATION_MESSAGES.VALUE_NOT_NUMERIC)
  }
  return validResult('value')
}

export function validateHasCompleteLineItem(items: LineItem[]): ValidationResult {
  const hasComplete = items.some(
    (item) => item.description && item.unitPrice > 0
  )
  if (!hasComplete) {
    return invalidResult('lineItems', VALIDATION_MESSAGES.NO_COMPLETE_LINE_ITEM)
  }
  return validResult('lineItems')
}

export function validateInvoice(invoice: InvoiceFormData): ValidationResult[] {
  const errors: ValidationResult[] = []

  const dueDateResult = validateDueDate(invoice.invoiceDate, invoice.dueDate)
  if (!dueDateResult.valid) {
    errors.push(dueDateResult)
  }

  const lineItemsResult = validateLineItems(invoice.lineItems)
  if (!lineItemsResult.valid) {
    errors.push(lineItemsResult)
  }

  const completeLineItemResult = validateHasCompleteLineItem(invoice.lineItems)
  if (!completeLineItemResult.valid) {
    errors.push(completeLineItemResult)
  }

  for (const item of invoice.lineItems) {
    const quantityResult = validateLineItemQuantity(item.quantity)
    if (!quantityResult.valid) {
      errors.push(quantityResult)
    }

    const priceResult = validateLineItemPrice(item.unitPrice)
    if (!priceResult.valid) {
      errors.push(priceResult)
    }
  }

  return errors
}
