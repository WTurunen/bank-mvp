# Testing & TDD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add comprehensive testing demonstrating production-quality TDD practices.

**Architecture:** Centralized validation in `src/lib/validation.ts` (pure functions). Form component imports and displays errors but never validates. Test structure by layer: `__tests__/lib/`, `__tests__/components/`.

**Tech Stack:** Vitest, Testing Library, React 19, TypeScript

---

## Task 1: Set Up Test Directory Structure

**Files:**
- Create: `src/__tests__/lib/.gitkeep`
- Create: `src/__tests__/components/.gitkeep`
- Modify: `src/test/setup.ts`

**Step 1: Create test directories**

```bash
mkdir -p src/__tests__/lib src/__tests__/components
```

**Step 2: Update test setup with user-event**

First, install @testing-library/user-event:

```bash
npm install -D @testing-library/user-event
```

**Step 3: Update setup.ts**

Replace `src/test/setup.ts` with:

```typescript
import '@testing-library/react'
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: set up test directory structure and mocks

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: TDD - validateLineItemNumeric

**Files:**
- Create: `src/__tests__/lib/validation.test.ts`
- Create: `src/lib/validation.ts`

**Step 1: Write the failing test**

Create `src/__tests__/lib/validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { validateLineItemNumeric, VALIDATION_MESSAGES } from '@/lib/validation'

describe('validateLineItemNumeric', () => {
  it('returns valid for a number', () => {
    const result = validateLineItemNumeric(42)
    expect(result.valid).toBe(true)
  })

  it('returns invalid for NaN', () => {
    const result = validateLineItemNumeric(NaN)
    expect(result.valid).toBe(false)
    expect(result.message).toBe(VALIDATION_MESSAGES.VALUE_NOT_NUMERIC)
  })

  it('returns invalid for undefined', () => {
    const result = validateLineItemNumeric(undefined)
    expect(result.valid).toBe(false)
    expect(result.field).toBe('lineItem')
  })

  it('returns invalid for a string', () => {
    const result = validateLineItemNumeric('abc')
    expect(result.valid).toBe(false)
  })

  it('returns valid for zero', () => {
    const result = validateLineItemNumeric(0)
    expect(result.valid).toBe(true)
  })

  it('returns valid for negative numbers', () => {
    const result = validateLineItemNumeric(-5)
    expect(result.valid).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: FAIL - module not found

**Step 3: Write minimal implementation**

Create `src/lib/validation.ts`:

```typescript
export const VALIDATION_MESSAGES = {
  VALUE_NOT_NUMERIC: 'Value must be a number',
  QUANTITY_NOT_POSITIVE: 'Quantity must be greater than zero',
  PRICE_NEGATIVE: 'Price cannot be negative',
  NO_LINE_ITEMS: 'At least one line item is required',
  DUE_DATE_BEFORE_INVOICE: 'Due date must be on or after invoice date',
} as const

export type ValidationResult = {
  valid: boolean
  field: string
  message: string
}

export function validateLineItemNumeric(value: unknown): ValidationResult {
  const isNumeric = typeof value === 'number' && !isNaN(value)

  return {
    valid: isNumeric,
    field: 'lineItem',
    message: isNumeric ? '' : VALIDATION_MESSAGES.VALUE_NOT_NUMERIC,
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: PASS (6 tests)

**Step 5: Commit**

```bash
git add src/__tests__/lib/validation.test.ts src/lib/validation.ts
git commit -m "feat: add validateLineItemNumeric with TDD

Red-green cycle: numeric validation for line item values

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: TDD - validateLineItemQuantity

**Files:**
- Modify: `src/__tests__/lib/validation.test.ts`
- Modify: `src/lib/validation.ts`

**Step 1: Write the failing test**

Add to `src/__tests__/lib/validation.test.ts`:

```typescript
import { validateLineItemNumeric, validateLineItemQuantity, VALIDATION_MESSAGES } from '@/lib/validation'

// ... existing tests ...

describe('validateLineItemQuantity', () => {
  it('returns valid for positive quantity', () => {
    const result = validateLineItemQuantity(5)
    expect(result.valid).toBe(true)
  })

  it('returns invalid for zero', () => {
    const result = validateLineItemQuantity(0)
    expect(result.valid).toBe(false)
    expect(result.message).toBe(VALIDATION_MESSAGES.QUANTITY_NOT_POSITIVE)
  })

  it('returns invalid for negative quantity', () => {
    const result = validateLineItemQuantity(-1)
    expect(result.valid).toBe(false)
    expect(result.field).toBe('quantity')
  })

  it('returns valid for decimal quantities', () => {
    const result = validateLineItemQuantity(1.5)
    expect(result.valid).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: FAIL - validateLineItemQuantity not exported

**Step 3: Write minimal implementation**

Add to `src/lib/validation.ts`:

```typescript
export function validateLineItemQuantity(quantity: number): ValidationResult {
  const isPositive = quantity > 0

  return {
    valid: isPositive,
    field: 'quantity',
    message: isPositive ? '' : VALIDATION_MESSAGES.QUANTITY_NOT_POSITIVE,
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: PASS (10 tests)

**Step 5: Commit**

```bash
git add src/__tests__/lib/validation.test.ts src/lib/validation.ts
git commit -m "feat: add validateLineItemQuantity with TDD

Red-green cycle: quantity must be positive

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: TDD - validateLineItemPrice

**Files:**
- Modify: `src/__tests__/lib/validation.test.ts`
- Modify: `src/lib/validation.ts`

**Step 1: Write the failing test**

Add to `src/__tests__/lib/validation.test.ts`:

```typescript
import {
  validateLineItemNumeric,
  validateLineItemQuantity,
  validateLineItemPrice,
  VALIDATION_MESSAGES
} from '@/lib/validation'

// ... existing tests ...

describe('validateLineItemPrice', () => {
  it('returns valid for positive price', () => {
    const result = validateLineItemPrice(100)
    expect(result.valid).toBe(true)
  })

  it('returns valid for zero price', () => {
    const result = validateLineItemPrice(0)
    expect(result.valid).toBe(true)
  })

  it('returns invalid for negative price', () => {
    const result = validateLineItemPrice(-50)
    expect(result.valid).toBe(false)
    expect(result.message).toBe(VALIDATION_MESSAGES.PRICE_NEGATIVE)
    expect(result.field).toBe('unitPrice')
  })

  it('returns valid for decimal prices', () => {
    const result = validateLineItemPrice(99.99)
    expect(result.valid).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: FAIL - validateLineItemPrice not exported

**Step 3: Write minimal implementation**

Add to `src/lib/validation.ts`:

```typescript
export function validateLineItemPrice(price: number): ValidationResult {
  const isNonNegative = price >= 0

  return {
    valid: isNonNegative,
    field: 'unitPrice',
    message: isNonNegative ? '' : VALIDATION_MESSAGES.PRICE_NEGATIVE,
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: PASS (14 tests)

**Step 5: Commit**

```bash
git add src/__tests__/lib/validation.test.ts src/lib/validation.ts
git commit -m "feat: add validateLineItemPrice with TDD

Red-green cycle: price must be non-negative

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: TDD - validateLineItems

**Files:**
- Modify: `src/__tests__/lib/validation.test.ts`
- Modify: `src/lib/validation.ts`

**Step 1: Write the failing test**

Add to `src/__tests__/lib/validation.test.ts`:

```typescript
import {
  validateLineItemNumeric,
  validateLineItemQuantity,
  validateLineItemPrice,
  validateLineItems,
  VALIDATION_MESSAGES
} from '@/lib/validation'

// ... existing tests ...

describe('validateLineItems', () => {
  it('returns invalid for empty array', () => {
    const result = validateLineItems([])
    expect(result.valid).toBe(false)
    expect(result.message).toBe(VALIDATION_MESSAGES.NO_LINE_ITEMS)
  })

  it('returns valid for array with one item', () => {
    const result = validateLineItems([{ description: 'Service', quantity: 1, unitPrice: 100 }])
    expect(result.valid).toBe(true)
  })

  it('returns valid for array with multiple items', () => {
    const result = validateLineItems([
      { description: 'Service A', quantity: 1, unitPrice: 100 },
      { description: 'Service B', quantity: 2, unitPrice: 50 },
    ])
    expect(result.valid).toBe(true)
  })

  it('returns field as lineItems', () => {
    const result = validateLineItems([])
    expect(result.field).toBe('lineItems')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: FAIL - validateLineItems not exported

**Step 3: Write minimal implementation**

Add to `src/lib/validation.ts`:

```typescript
export type LineItemInput = {
  description: string
  quantity: number
  unitPrice: number
}

export function validateLineItems(items: LineItemInput[]): ValidationResult {
  const hasItems = items.length > 0

  return {
    valid: hasItems,
    field: 'lineItems',
    message: hasItems ? '' : VALIDATION_MESSAGES.NO_LINE_ITEMS,
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: PASS (18 tests)

**Step 5: Commit**

```bash
git add src/__tests__/lib/validation.test.ts src/lib/validation.ts
git commit -m "feat: add validateLineItems with TDD

Red-green cycle: at least one line item required

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: TDD - validateDueDate

**Files:**
- Modify: `src/__tests__/lib/validation.test.ts`
- Modify: `src/lib/validation.ts`

**Step 1: Write the failing test**

Add to `src/__tests__/lib/validation.test.ts`:

```typescript
import {
  validateLineItemNumeric,
  validateLineItemQuantity,
  validateLineItemPrice,
  validateLineItems,
  validateDueDate,
  VALIDATION_MESSAGES
} from '@/lib/validation'

// ... existing tests ...

describe('validateDueDate', () => {
  it('returns valid when due date equals invoice date', () => {
    const date = new Date('2026-01-26')
    const result = validateDueDate(date, date)
    expect(result.valid).toBe(true)
  })

  it('returns valid when due date is after invoice date', () => {
    const invoiceDate = new Date('2026-01-26')
    const dueDate = new Date('2026-02-26')
    const result = validateDueDate(invoiceDate, dueDate)
    expect(result.valid).toBe(true)
  })

  it('returns invalid when due date is before invoice date', () => {
    const invoiceDate = new Date('2026-01-26')
    const dueDate = new Date('2026-01-15')
    const result = validateDueDate(invoiceDate, dueDate)
    expect(result.valid).toBe(false)
    expect(result.message).toBe(VALIDATION_MESSAGES.DUE_DATE_BEFORE_INVOICE)
  })

  it('returns field as dueDate', () => {
    const invoiceDate = new Date('2026-01-26')
    const dueDate = new Date('2026-01-15')
    const result = validateDueDate(invoiceDate, dueDate)
    expect(result.field).toBe('dueDate')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: FAIL - validateDueDate not exported

**Step 3: Write minimal implementation**

Add to `src/lib/validation.ts`:

```typescript
export function validateDueDate(invoiceDate: Date, dueDate: Date): ValidationResult {
  const isValid = dueDate >= invoiceDate

  return {
    valid: isValid,
    field: 'dueDate',
    message: isValid ? '' : VALIDATION_MESSAGES.DUE_DATE_BEFORE_INVOICE,
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: PASS (22 tests)

**Step 5: Commit**

```bash
git add src/__tests__/lib/validation.test.ts src/lib/validation.ts
git commit -m "feat: add validateDueDate with TDD

Red-green cycle: due date must be on or after invoice date

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: TDD - validateInvoice (aggregate)

**Files:**
- Modify: `src/__tests__/lib/validation.test.ts`
- Modify: `src/lib/validation.ts`

**Step 1: Write the failing test**

Add to `src/__tests__/lib/validation.test.ts`:

```typescript
import {
  validateLineItemNumeric,
  validateLineItemQuantity,
  validateLineItemPrice,
  validateLineItems,
  validateDueDate,
  validateInvoice,
  VALIDATION_MESSAGES
} from '@/lib/validation'

// ... existing tests ...

describe('validateInvoice', () => {
  const validInvoice = {
    invoiceDate: new Date('2026-01-26'),
    dueDate: new Date('2026-02-26'),
    lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
  }

  it('returns empty array for valid invoice', () => {
    const results = validateInvoice(validInvoice)
    expect(results).toEqual([])
  })

  it('returns error when due date before invoice date', () => {
    const invoice = {
      ...validInvoice,
      dueDate: new Date('2026-01-15'),
    }
    const results = validateInvoice(invoice)
    expect(results).toHaveLength(1)
    expect(results[0].field).toBe('dueDate')
  })

  it('returns error when no line items', () => {
    const invoice = {
      ...validInvoice,
      lineItems: [],
    }
    const results = validateInvoice(invoice)
    expect(results).toHaveLength(1)
    expect(results[0].field).toBe('lineItems')
  })

  it('returns error for invalid quantity', () => {
    const invoice = {
      ...validInvoice,
      lineItems: [{ description: 'Service', quantity: 0, unitPrice: 100 }],
    }
    const results = validateInvoice(invoice)
    expect(results.some(r => r.field === 'quantity')).toBe(true)
  })

  it('returns error for negative price', () => {
    const invoice = {
      ...validInvoice,
      lineItems: [{ description: 'Service', quantity: 1, unitPrice: -50 }],
    }
    const results = validateInvoice(invoice)
    expect(results.some(r => r.field === 'unitPrice')).toBe(true)
  })

  it('returns multiple errors when multiple validations fail', () => {
    const invoice = {
      invoiceDate: new Date('2026-01-26'),
      dueDate: new Date('2026-01-15'),
      lineItems: [],
    }
    const results = validateInvoice(invoice)
    expect(results.length).toBeGreaterThanOrEqual(2)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: FAIL - validateInvoice not exported

**Step 3: Write minimal implementation**

Add to `src/lib/validation.ts`:

```typescript
export type InvoiceFormData = {
  invoiceDate: Date
  dueDate: Date
  lineItems: LineItemInput[]
}

export function validateInvoice(invoice: InvoiceFormData): ValidationResult[] {
  const errors: ValidationResult[] = []

  // Validate due date
  const dueDateResult = validateDueDate(invoice.invoiceDate, invoice.dueDate)
  if (!dueDateResult.valid) {
    errors.push(dueDateResult)
  }

  // Validate line items exist
  const lineItemsResult = validateLineItems(invoice.lineItems)
  if (!lineItemsResult.valid) {
    errors.push(lineItemsResult)
  }

  // Validate each line item
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
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/__tests__/lib/validation.test.ts
```

Expected: PASS (28 tests)

**Step 5: Commit**

```bash
git add src/__tests__/lib/validation.test.ts src/lib/validation.ts
git commit -m "feat: add validateInvoice aggregate with TDD

Collects all validation errors into single array

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Invoice Form Component Tests - Setup

**Files:**
- Create: `src/__tests__/components/invoice-form.test.tsx`

**Step 1: Create test file with rendering tests**

Create `src/__tests__/components/invoice-form.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InvoiceForm } from '@/components/invoice-form'

// Mock the server actions
vi.mock('@/app/actions/invoices', () => ({
  createInvoice: vi.fn(),
  updateInvoice: vi.fn(),
}))

describe('InvoiceForm', () => {
  describe('rendering', () => {
    it('renders client name input', () => {
      render(<InvoiceForm />)
      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument()
    })

    it('renders client email input', () => {
      render(<InvoiceForm />)
      expect(screen.getByLabelText(/client email/i)).toBeInTheDocument()
    })

    it('renders due date input', () => {
      render(<InvoiceForm />)
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument()
    })

    it('renders create invoice button for new invoice', () => {
      render(<InvoiceForm />)
      expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument()
    })

    it('renders update invoice button when editing', () => {
      const invoice = {
        id: '1',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        dueDate: new Date('2026-02-26'),
        notes: null,
        lineItems: [{ id: '1', description: 'Service', quantity: 1, unitPrice: 100 }],
      }
      render(<InvoiceForm invoice={invoice} />)
      expect(screen.getByRole('button', { name: /update invoice/i })).toBeInTheDocument()
    })

    it('pre-fills form when editing existing invoice', () => {
      const invoice = {
        id: '1',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        dueDate: new Date('2026-02-26'),
        notes: 'Test notes',
        lineItems: [{ id: '1', description: 'Service', quantity: 1, unitPrice: 100 }],
      }
      render(<InvoiceForm invoice={invoice} />)
      expect(screen.getByLabelText(/client name/i)).toHaveValue('Test Client')
      expect(screen.getByLabelText(/client email/i)).toHaveValue('test@example.com')
    })
  })
})
```

**Step 2: Run tests**

```bash
npm test -- src/__tests__/components/invoice-form.test.tsx
```

Expected: PASS (6 tests)

**Step 3: Commit**

```bash
git add src/__tests__/components/invoice-form.test.tsx
git commit -m "test: add InvoiceForm rendering tests

Tests basic rendering and edit mode pre-filling

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Invoice Form Component Tests - Line Items

**Files:**
- Modify: `src/__tests__/components/invoice-form.test.tsx`

**Step 1: Add line item interaction tests**

Add to `src/__tests__/components/invoice-form.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvoiceForm } from '@/components/invoice-form'

// ... existing code ...

describe('InvoiceForm', () => {
  // ... existing rendering tests ...

  describe('line items', () => {
    it('starts with one line item', () => {
      render(<InvoiceForm />)
      const descriptionInputs = screen.getAllByPlaceholderText(/service or product/i)
      expect(descriptionInputs).toHaveLength(1)
    })

    it('can add a new line item', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      const addButton = screen.getByRole('button', { name: /add line item/i })
      await user.click(addButton)

      const descriptionInputs = screen.getAllByPlaceholderText(/service or product/i)
      expect(descriptionInputs).toHaveLength(2)
    })

    it('can remove a line item when more than one exists', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      // Add a second line item
      const addButton = screen.getByRole('button', { name: /add line item/i })
      await user.click(addButton)

      // Remove one
      const removeButtons = screen.getAllByRole('button', { name: /x/i })
      await user.click(removeButtons[0])

      const descriptionInputs = screen.getAllByPlaceholderText(/service or product/i)
      expect(descriptionInputs).toHaveLength(1)
    })

    it('cannot remove the last line item', () => {
      render(<InvoiceForm />)
      const removeButton = screen.getByRole('button', { name: /x/i })
      expect(removeButton).toBeDisabled()
    })
  })
})
```

**Step 2: Run tests**

```bash
npm test -- src/__tests__/components/invoice-form.test.tsx
```

Expected: PASS (10 tests)

**Step 3: Commit**

```bash
git add src/__tests__/components/invoice-form.test.tsx
git commit -m "test: add InvoiceForm line item interaction tests

Tests adding and removing line items

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Invoice Form Component Tests - Totals

**Files:**
- Modify: `src/__tests__/components/invoice-form.test.tsx`

**Step 1: Add total calculation tests**

Add to the line items describe block in `src/__tests__/components/invoice-form.test.tsx`:

```typescript
    it('displays correct line item total', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      // Find quantity and price inputs (they don't have labels, find by position)
      const inputs = screen.getAllByRole('textbox')
      const qtyInput = inputs.find(i => (i as HTMLInputElement).value === '1')
      const priceInput = inputs.find(i => (i as HTMLInputElement).placeholder === '0.00')

      if (qtyInput && priceInput) {
        await user.clear(qtyInput)
        await user.type(qtyInput, '2')
        await user.clear(priceInput)
        await user.type(priceInput, '50')
      }

      // Check that $100.00 appears (2 * 50)
      expect(screen.getByText('$100.00')).toBeInTheDocument()
    })

    it('displays correct invoice total with multiple items', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      // Set first item: qty 2, price 50 = 100
      const inputs = screen.getAllByRole('textbox')
      const qtyInput = inputs.find(i => (i as HTMLInputElement).value === '1')
      const priceInput = inputs.find(i => (i as HTMLInputElement).placeholder === '0.00')

      if (qtyInput && priceInput) {
        await user.clear(qtyInput)
        await user.type(qtyInput, '2')
        await user.type(priceInput, '50')
      }

      // Add second item
      const addButton = screen.getByRole('button', { name: /add line item/i })
      await user.click(addButton)

      // Set second item: qty 3, price 25 = 75
      const allInputs = screen.getAllByRole('textbox')
      const qtyInputs = allInputs.filter(i => (i as HTMLInputElement).value === '1')
      const priceInputs = allInputs.filter(i => (i as HTMLInputElement).placeholder === '0.00')

      if (qtyInputs[1] && priceInputs[0]) {
        await user.clear(qtyInputs[1])
        await user.type(qtyInputs[1], '3')
        await user.type(priceInputs[0], '25')
      }

      // Total should be 175 (100 + 75)
      expect(screen.getByText(/total:.*\$175\.00/i)).toBeInTheDocument()
    })
```

**Step 2: Run tests**

```bash
npm test -- src/__tests__/components/invoice-form.test.tsx
```

Expected: PASS (12 tests)

**Step 3: Commit**

```bash
git add src/__tests__/components/invoice-form.test.tsx
git commit -m "test: add InvoiceForm total calculation tests

Tests line item and invoice totals update correctly

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Wire Validation into Form

**Files:**
- Modify: `src/components/invoice-form.tsx`
- Modify: `src/__tests__/components/invoice-form.test.tsx`

**Step 1: Write the failing tests for validation display**

Add to `src/__tests__/components/invoice-form.test.tsx`:

```typescript
import { createInvoice, updateInvoice } from '@/app/actions/invoices'

// ... existing code ...

describe('InvoiceForm', () => {
  // ... existing tests ...

  describe('validation display', () => {
    it('shows error when submitting with no line items with values', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      // Fill required fields
      await user.type(screen.getByLabelText(/client name/i), 'Test Client')
      await user.type(screen.getByLabelText(/client email/i), 'test@example.com')

      // Submit without filling line item price
      await user.click(screen.getByRole('button', { name: /create invoice/i }))

      // Should show error
      expect(screen.getByText(/at least one line item/i)).toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('calls createInvoice with form data when valid', async () => {
      const user = userEvent.setup()
      const mockCreate = vi.mocked(createInvoice)
      mockCreate.mockResolvedValue('new-id')

      render(<InvoiceForm />)

      await user.type(screen.getByLabelText(/client name/i), 'Test Client')
      await user.type(screen.getByLabelText(/client email/i), 'test@example.com')

      // Fill line item
      const inputs = screen.getAllByRole('textbox')
      const descInput = inputs.find(i => (i as HTMLInputElement).placeholder?.includes('Service'))
      const priceInput = inputs.find(i => (i as HTMLInputElement).placeholder === '0.00')

      if (descInput) await user.type(descInput, 'Consulting')
      if (priceInput) await user.type(priceInput, '100')

      await user.click(screen.getByRole('button', { name: /create invoice/i }))

      expect(mockCreate).toHaveBeenCalled()
    })

    it('does not submit when validation fails', async () => {
      const user = userEvent.setup()
      const mockCreate = vi.mocked(createInvoice)

      render(<InvoiceForm />)

      // Only fill name, leave everything else empty
      await user.type(screen.getByLabelText(/client name/i), 'Test Client')
      await user.type(screen.getByLabelText(/client email/i), 'test@example.com')

      await user.click(screen.getByRole('button', { name: /create invoice/i }))

      expect(mockCreate).not.toHaveBeenCalled()
    })
  })
})
```

**Step 2: Run tests to see current state**

```bash
npm test -- src/__tests__/components/invoice-form.test.tsx
```

Note: These tests should mostly pass with existing validation, but we're now testing it explicitly.

**Step 3: Commit**

```bash
git add src/__tests__/components/invoice-form.test.tsx
git commit -m "test: add InvoiceForm validation and submission tests

Tests error display and form submission behavior

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Run Full Test Suite & Verify

**Step 1: Run all tests**

```bash
npm test:run
```

Expected: All tests pass

**Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors

**Step 3: Run lint**

```bash
npm run lint
```

Expected: No errors

**Step 4: Final commit if any cleanup needed**

If all passes, no commit needed.

---

## Task 13: Final Review & Summary

**Step 1: Review test count**

```bash
npm test:run -- --reporter=verbose
```

Expected:
- ~28 validation tests (TDD)
- ~15 component tests
- 12 existing utility tests
- Total: ~55 tests

**Step 2: Review git log for TDD pattern**

```bash
git log --oneline -20
```

Should show clear red-green-refactor commits for each validation rule.

**Step 3: Create summary commit**

```bash
git add -A
git commit -m "docs: complete testing & TDD implementation

Summary:
- Centralized validation in src/lib/validation.ts
- 28+ TDD-driven validation tests
- 15+ InvoiceForm component tests
- All validation logic in single source of truth

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>" --allow-empty
```

---

## Success Checklist

- [ ] `src/__tests__/lib/validation.test.ts` - 28+ tests
- [ ] `src/__tests__/components/invoice-form.test.tsx` - 15+ tests
- [ ] `src/lib/validation.ts` - Single source of validation
- [ ] All error messages in VALIDATION_MESSAGES
- [ ] Git history shows TDD commits
- [ ] `npm test` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
