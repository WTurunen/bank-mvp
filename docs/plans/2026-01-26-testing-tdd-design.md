# Testing & TDD Design

## Overview

Add comprehensive testing to demonstrate production-quality practices:
- Retrofit tests for existing Invoice Form component
- Build validation rules using TDD (red-green-refactor)
- Structure tests for easy future expansion

## Test Structure

```
__tests__/
├── components/
│   └── InvoiceForm.test.tsx      # React component tests
├── actions/
│   └── invoice-actions.test.ts   # Server action tests (future)
├── lib/
│   └── validation.test.ts        # Pure validation logic (TDD)
└── setup.ts                      # Shared test utilities
```

**Layer responsibilities:**

- `lib/` - Pure functions with no dependencies. Validation rules live here.
- `components/` - React component behavior using Testing Library.
- `actions/` - Server action tests with mocked Prisma (future expansion).

## Validation Rules (TDD Target)

All validation lives in `src/lib/validation.ts`. No validation logic anywhere else.

### Rules to Implement

```typescript
// Rule 1: Due date must be after or equal to invoice date
validateDueDate(invoiceDate: Date, dueDate: Date): ValidationResult

// Rule 2: At least one line item required
validateLineItems(items: LineItem[]): ValidationResult

// Rule 3: Line item quantities must be positive
validateLineItemQuantity(quantity: number): ValidationResult

// Rule 4: Line item prices must be non-negative
validateLineItemPrice(price: number): ValidationResult

// Rule 5: Line item values must be numerical (not NaN, not strings)
validateLineItemNumeric(value: unknown): ValidationResult

// Aggregate: Run all validations, collect errors
validateInvoice(invoice: InvoiceFormData): ValidationResult[]
```

### ValidationResult Shape

```typescript
type ValidationResult = {
  valid: boolean
  field: string      // Which field failed (for error display)
  message: string    // User-friendly error message
}
```

### Centralized Error Messages

```typescript
export const VALIDATION_MESSAGES = {
  DUE_DATE_BEFORE_INVOICE: 'Due date must be on or after invoice date',
  NO_LINE_ITEMS: 'At least one line item is required',
  QUANTITY_NOT_POSITIVE: 'Quantity must be greater than zero',
  PRICE_NEGATIVE: 'Price cannot be negative',
  VALUE_NOT_NUMERIC: 'Value must be a number',
}
```

## Invoice Form Component Tests

### Test Categories

```typescript
describe('InvoiceForm', () => {
  describe('rendering', () => {
    // Shows all required fields
    // Pre-fills data when editing existing invoice
    // Shows empty form for new invoice
  })

  describe('line items', () => {
    // Can add a new line item
    // Can remove a line item
    // Updates totals when values change
  })

  describe('validation display', () => {
    // Shows error when due date before invoice date
    // Shows error when no line items
    // Shows error for invalid numeric input
    // Clears errors when corrected
  })

  describe('form submission', () => {
    // Calls onSubmit with form data when valid
    // Prevents submission when validation fails
  })
})
```

### Testing Approach

- Use `@testing-library/react` with `userEvent` for realistic interactions
- Test behavior, not implementation (no checking internal state)
- Mock the server action to isolate component logic
- Use `screen.getByRole` and accessible queries

## Integration

```
┌─────────────────────────────────────────┐
│           InvoiceForm.tsx               │
│  - Calls validation on blur/submit      │
│  - Displays validation errors           │
│  - Blocks submit if invalid             │
│  - NEVER validates directly             │
└─────────────────┬───────────────────────┘
                  │ imports
                  ▼
┌─────────────────────────────────────────┐
│           validation.ts                 │
│  - Pure functions, no side effects      │
│  - Returns structured error objects     │
│  - Single source of ALL validation      │
└─────────────────────────────────────────┘
```

**Critical constraint:** Form component only displays errors, never decides validation logic. All validation lives in `validation.ts`.

## Test Utilities

### Shared Setup (`__tests__/setup.ts`)

```typescript
// Test factories - consistent test data
createMockInvoice(overrides?: Partial<Invoice>): Invoice
createMockLineItem(overrides?: Partial<LineItem>): LineItem

// Form test helpers
fillInvoiceForm(data: Partial<InvoiceFormData>): Promise<void>
```

## Implementation Order

1. Set up test structure - Create `__tests__/` folders, update Vitest config if needed
2. TDD validation module - Build `validation.ts` test-first (red-green-refactor)
3. Retrofit form tests - Test current form behavior before modifying it
4. Wire validation into form - Add validation calls, update tests to cover new behavior
5. Verify everything passes - Run full suite, fix any regressions

## Commit Workflow

1. Make changes
2. Run code review before each commit
3. Fix any issues caught
4. Commit

## Success Criteria

- [ ] `__tests__/lib/validation.test.ts` - 15+ tests, all TDD-driven
- [ ] `__tests__/components/InvoiceForm.test.tsx` - 12+ tests covering interactions
- [ ] `src/lib/validation.ts` - Single source of all validation logic
- [ ] All error messages defined in one place
- [ ] Form component only displays errors, never validates directly
- [ ] `npm test` runs full suite with clear output
- [ ] Code reviewed before each commit
- [ ] Git history shows red-green-refactor TDD cycle

## What This Demonstrates

- TDD discipline (git history shows red-green-refactor)
- React Testing Library proficiency
- Clean architecture (separated concerns)
- Production habits (centralized validation, code review)
