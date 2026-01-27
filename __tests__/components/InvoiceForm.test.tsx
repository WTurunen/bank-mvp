import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InvoiceForm } from '@/components/invoice-form'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock server actions
const mockCreateInvoice = vi.fn()
const mockUpdateInvoice = vi.fn()
vi.mock('@/app/actions/invoices', () => ({
  createInvoice: (...args: unknown[]) => mockCreateInvoice(...args),
  updateInvoice: (...args: unknown[]) => mockUpdateInvoice(...args),
}))

describe('InvoiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('shows all required fields for new invoice', () => {
      render(<InvoiceForm />)

      expect(screen.getByLabelText(/client name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/client email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument()
      expect(screen.getByText(/line items/i)).toBeInTheDocument()
      expect(screen.getByText(/notes/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create invoice/i })).toBeInTheDocument()
    })

    it('shows empty form for new invoice', () => {
      render(<InvoiceForm />)

      expect(screen.getByLabelText(/client name/i)).toHaveValue('')
      expect(screen.getByLabelText(/client email/i)).toHaveValue('')
    })

    it('pre-fills data when editing existing invoice', () => {
      const existingInvoice = {
        id: 'test-id',
        clientName: 'Acme Corp',
        clientEmail: 'billing@acme.com',
        dueDate: new Date('2026-02-28'),
        notes: 'Net 30',
        lineItems: [
          { id: 'item-1', description: 'Consulting', quantity: 10, unitPrice: 150 },
        ],
      }

      render(<InvoiceForm invoice={existingInvoice} />)

      expect(screen.getByLabelText(/client name/i)).toHaveValue('Acme Corp')
      expect(screen.getByLabelText(/client email/i)).toHaveValue('billing@acme.com')
      expect(screen.getByRole('button', { name: /update invoice/i })).toBeInTheDocument()
    })

    it('shows Update Invoice button when editing', () => {
      const existingInvoice = {
        id: 'test-id',
        clientName: 'Test',
        clientEmail: 'test@test.com',
        dueDate: new Date(),
        notes: null,
        lineItems: [{ id: 'item-1', description: 'Test', quantity: 1, unitPrice: 100 }],
      }

      render(<InvoiceForm invoice={existingInvoice} />)

      expect(screen.getByRole('button', { name: /update invoice/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /create invoice/i })).not.toBeInTheDocument()
    })
  })

  describe('line items', () => {
    it('can add a new line item', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      // Note: 2 inputs per line item (mobile + desktop views)
      const descriptionInputs = screen.getAllByPlaceholderText(/service or product/i)
      expect(descriptionInputs).toHaveLength(2)

      await user.click(screen.getByRole('button', { name: /add line item/i }))

      const updatedInputs = screen.getAllByPlaceholderText(/service or product/i)
      expect(updatedInputs).toHaveLength(4)
    })

    it('can remove a line item when multiple exist', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      // Add a second line item (2 inputs per line item: mobile + desktop)
      await user.click(screen.getByRole('button', { name: /add line item/i }))
      expect(screen.getAllByPlaceholderText(/service or product/i)).toHaveLength(4)

      // Remove one (2 remove buttons per line item: mobile + desktop)
      const removeButtons = screen.getAllByRole('button', { name: /remove line item/i })
      await user.click(removeButtons[0])

      expect(screen.getAllByPlaceholderText(/service or product/i)).toHaveLength(2)
    })

    it('cannot remove the last line item', async () => {
      render(<InvoiceForm />)

      const removeButtons = screen.getAllByRole('button', { name: /remove line item/i })
      // Both mobile and desktop remove buttons should be disabled
      removeButtons.forEach(btn => expect(btn).toBeDisabled())
    })

    it('updates totals when values change', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      // Find quantity and price inputs (use first of each - mobile/desktop duplicates)
      const quantityInputs = screen.getAllByDisplayValue('1')
      const priceInputs = screen.getAllByPlaceholderText('0.00')

      await user.clear(quantityInputs[0])
      await user.type(quantityInputs[0], '5')
      await user.type(priceInputs[0], '20')

      // Total should be 5 * 20 = 100 - appears multiple times (line totals + invoice total)
      const totals = screen.getAllByText(/\$100\.00/)
      expect(totals.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('validation display', () => {
    it('shows error when submitting without valid line items', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      // Fill all HTML5 required fields, but leave price at 0 (which fails business validation)
      await user.type(screen.getByLabelText(/client name/i), 'Test Client')
      await user.type(screen.getByLabelText(/client email/i), 'test@example.com')
      // Fill description to pass HTML5 required, but leave price empty (defaults to 0)
      const descInputs = screen.getAllByPlaceholderText(/service or product/i)
      await user.type(descInputs[0], 'Some service')

      await user.click(screen.getByRole('button', { name: /create invoice/i }))

      await waitFor(() => {
        expect(screen.getByText(/at least one line item/i)).toBeInTheDocument()
      })
    })

    it('clears error when user starts typing', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      // Fill all HTML5 required fields, but leave price at 0
      await user.type(screen.getByLabelText(/client name/i), 'Test Client')
      await user.type(screen.getByLabelText(/client email/i), 'test@example.com')
      const descInputs = screen.getAllByPlaceholderText(/service or product/i)
      await user.type(descInputs[0], 'Some service')

      // Submit to trigger error
      await user.click(screen.getByRole('button', { name: /create invoice/i }))

      await waitFor(() => {
        expect(screen.getByText(/at least one line item/i)).toBeInTheDocument()
      })

      // Type in price field - should clear error
      const priceInputs = screen.getAllByPlaceholderText('0.00')
      await user.type(priceInputs[0], '50')

      expect(screen.queryByText(/at least one line item/i)).not.toBeInTheDocument()
    })

    it('rejects invalid characters in numeric fields', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      const priceInputs = screen.getAllByPlaceholderText('0.00')

      // Try to type letters - should be rejected
      await user.type(priceInputs[0], 'abc')

      expect(priceInputs[0]).toHaveValue('')
    })

    it('accepts valid numeric input with comma', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      const priceInputs = screen.getAllByPlaceholderText('0.00')

      await user.type(priceInputs[0], '99,50')

      expect(priceInputs[0]).toHaveValue('99,50')
    })
  })

  describe('form submission', () => {
    it('calls createInvoice with form data when valid', async () => {
      const user = userEvent.setup()
      mockCreateInvoice.mockResolvedValue('new-invoice-id')
      render(<InvoiceForm />)

      await user.type(screen.getByLabelText(/client name/i), 'Test Client')
      await user.type(screen.getByLabelText(/client email/i), 'test@example.com')

      const descInputs = screen.getAllByPlaceholderText(/service or product/i)
      await user.type(descInputs[0], 'Web Development')

      const priceInputs = screen.getAllByPlaceholderText('0.00')
      await user.type(priceInputs[0], '500')

      await user.click(screen.getByRole('button', { name: /create invoice/i }))

      await waitFor(() => {
        expect(mockCreateInvoice).toHaveBeenCalledTimes(1)
      })

      expect(mockCreateInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          clientName: 'Test Client',
          clientEmail: 'test@example.com',
          lineItems: expect.arrayContaining([
            expect.objectContaining({
              description: 'Web Development',
              unitPrice: 500,
            }),
          ]),
        })
      )
    })

    it('redirects to new invoice after creation', async () => {
      const user = userEvent.setup()
      mockCreateInvoice.mockResolvedValue('new-invoice-id')
      render(<InvoiceForm />)

      await user.type(screen.getByLabelText(/client name/i), 'Test Client')
      await user.type(screen.getByLabelText(/client email/i), 'test@example.com')

      const descInputs = screen.getAllByPlaceholderText(/service or product/i)
      await user.type(descInputs[0], 'Service')

      const priceInputs = screen.getAllByPlaceholderText('0.00')
      await user.type(priceInputs[0], '100')

      await user.click(screen.getByRole('button', { name: /create invoice/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/invoices/new-invoice-id')
      })
    })

    it('calls updateInvoice when editing existing invoice', async () => {
      const user = userEvent.setup()
      mockUpdateInvoice.mockResolvedValue(undefined)

      const existingInvoice = {
        id: 'existing-id',
        clientName: 'Old Client',
        clientEmail: 'old@example.com',
        dueDate: new Date('2026-02-28'),
        notes: null,
        lineItems: [{ id: 'item-1', description: 'Old Service', quantity: 1, unitPrice: 100 }],
      }

      render(<InvoiceForm invoice={existingInvoice} />)

      // Update client name
      const nameInput = screen.getByLabelText(/client name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'New Client')

      await user.click(screen.getByRole('button', { name: /update invoice/i }))

      await waitFor(() => {
        expect(mockUpdateInvoice).toHaveBeenCalledTimes(1)
      })

      expect(mockUpdateInvoice).toHaveBeenCalledWith(
        'existing-id',
        expect.objectContaining({
          clientName: 'New Client',
        })
      )
    })

    it('refreshes router after updating', async () => {
      const user = userEvent.setup()
      mockUpdateInvoice.mockResolvedValue(undefined)

      const existingInvoice = {
        id: 'existing-id',
        clientName: 'Client',
        clientEmail: 'client@example.com',
        dueDate: new Date(),
        notes: null,
        lineItems: [{ id: 'item-1', description: 'Service', quantity: 1, unitPrice: 100 }],
      }

      render(<InvoiceForm invoice={existingInvoice} />)

      await user.click(screen.getByRole('button', { name: /update invoice/i }))

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('prevents submission when validation fails', async () => {
      const user = userEvent.setup()
      render(<InvoiceForm />)

      // Fill only some fields
      await user.type(screen.getByLabelText(/client name/i), 'Test')
      await user.type(screen.getByLabelText(/client email/i), 'test@test.com')
      // Don't fill line items

      await user.click(screen.getByRole('button', { name: /create invoice/i }))

      expect(mockCreateInvoice).not.toHaveBeenCalled()
    })

    it('shows error message when server action fails', async () => {
      const user = userEvent.setup()
      mockCreateInvoice.mockRejectedValue(new Error('Server error'))

      render(<InvoiceForm />)

      await user.type(screen.getByLabelText(/client name/i), 'Test')
      await user.type(screen.getByLabelText(/client email/i), 'test@test.com')

      const descInputs = screen.getAllByPlaceholderText(/service or product/i)
      await user.type(descInputs[0], 'Service')

      const priceInputs = screen.getAllByPlaceholderText('0.00')
      await user.type(priceInputs[0], '100')

      await user.click(screen.getByRole('button', { name: /create invoice/i }))

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument()
      })
    })
  })
})
