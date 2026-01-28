import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientForm } from '@/components/client-form'

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
const mockCreateClient = vi.fn()
const mockUpdateClient = vi.fn()
const mockArchiveClient = vi.fn()
vi.mock('@/app/actions/clients', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
  updateClient: (...args: unknown[]) => mockUpdateClient(...args),
  archiveClient: (...args: unknown[]) => mockArchiveClient(...args),
}))

describe('ClientForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('shows all fields for new client', () => {
      render(<ClientForm />)

      expect(screen.getByLabelText(/^name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create client/i })).toBeInTheDocument()
    })

    it('shows empty form for new client', () => {
      render(<ClientForm />)

      expect(screen.getByLabelText(/^name/i)).toHaveValue('')
      expect(screen.getByLabelText(/email/i)).toHaveValue('')
      expect(screen.getByLabelText(/phone/i)).toHaveValue('')
      expect(screen.getByLabelText(/address/i)).toHaveValue('')
    })

    it('pre-fills data when editing existing client', () => {
      const existingClient = {
        id: 'client-1',
        name: 'Acme Corp',
        email: 'acme@example.com',
        phone: '+1-555-123-4567',
        address: '123 Main St',
        archivedAt: null,
        invoiceCount: 0,
      }

      render(<ClientForm client={existingClient} />)

      expect(screen.getByLabelText(/^name/i)).toHaveValue('Acme Corp')
      expect(screen.getByLabelText(/email/i)).toHaveValue('acme@example.com')
      expect(screen.getByLabelText(/phone/i)).toHaveValue('+1-555-123-4567')
      expect(screen.getByLabelText(/address/i)).toHaveValue('123 Main St')
    })

    it('shows Update Client button when editing', () => {
      const existingClient = {
        id: 'client-1',
        name: 'Acme Corp',
        email: 'acme@example.com',
        phone: null,
        address: null,
        archivedAt: null,
        invoiceCount: 0,
      }

      render(<ClientForm client={existingClient} />)

      expect(screen.getByRole('button', { name: /update client/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /create client/i })).not.toBeInTheDocument()
    })

    it('shows archive button when editing', () => {
      const existingClient = {
        id: 'client-1',
        name: 'Acme Corp',
        email: 'acme@example.com',
        phone: null,
        address: null,
        archivedAt: null,
        invoiceCount: 0,
      }

      render(<ClientForm client={existingClient} />)

      expect(screen.getByRole('button', { name: /archive/i })).toBeInTheDocument()
    })

    it('does not show archive button for new client', () => {
      render(<ClientForm />)

      expect(screen.queryByRole('button', { name: /archive/i })).not.toBeInTheDocument()
    })

    it('shows back link', () => {
      render(<ClientForm />)

      expect(screen.getByRole('link', { name: /back/i })).toHaveAttribute('href', '/clients')
    })
  })

  describe('validation', () => {
    it('shows error when name is empty', async () => {
      const user = userEvent.setup()
      render(<ClientForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /create client/i }))

      await waitFor(() => {
        expect(screen.getByText(/client name is required/i)).toBeInTheDocument()
      })
    })

    it('shows error when email is empty', async () => {
      const user = userEvent.setup()
      render(<ClientForm />)

      await user.type(screen.getByLabelText(/^name/i), 'Test Client')
      await user.click(screen.getByRole('button', { name: /create client/i }))

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      })
    })

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup()
      render(<ClientForm />)

      await user.type(screen.getByLabelText(/^name/i), 'Test Client')
      await user.type(screen.getByLabelText(/email/i), 'invalid-email')
      await user.click(screen.getByRole('button', { name: /create client/i }))

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument()
      })
    })

    it('clears error when user starts typing', async () => {
      const user = userEvent.setup()
      render(<ClientForm />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.click(screen.getByRole('button', { name: /create client/i }))

      await waitFor(() => {
        expect(screen.getByText(/client name is required/i)).toBeInTheDocument()
      })

      await user.type(screen.getByLabelText(/^name/i), 'A')

      expect(screen.queryByText(/client name is required/i)).not.toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('calls createClient with form data when valid', async () => {
      const user = userEvent.setup()
      mockCreateClient.mockResolvedValue('new-client-id')
      render(<ClientForm />)

      await user.type(screen.getByLabelText(/^name/i), 'Test Client')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+1-555-000-0000')
      await user.type(screen.getByLabelText(/address/i), '456 Test Ave')

      await user.click(screen.getByRole('button', { name: /create client/i }))

      await waitFor(() => {
        expect(mockCreateClient).toHaveBeenCalledTimes(1)
      })

      expect(mockCreateClient).toHaveBeenCalledWith({
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+1-555-000-0000',
        address: '456 Test Ave',
      })
    })

    it('redirects to clients list after creation', async () => {
      const user = userEvent.setup()
      mockCreateClient.mockResolvedValue('new-client-id')
      render(<ClientForm />)

      await user.type(screen.getByLabelText(/^name/i), 'Test Client')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')

      await user.click(screen.getByRole('button', { name: /create client/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/clients')
      })
    })

    it('calls updateClient when editing existing client', async () => {
      const user = userEvent.setup()
      mockUpdateClient.mockResolvedValue(undefined)

      const existingClient = {
        id: 'client-1',
        name: 'Old Name',
        email: 'old@example.com',
        phone: null,
        address: null,
        archivedAt: null,
        invoiceCount: 0,
      }

      render(<ClientForm client={existingClient} />)

      const nameInput = screen.getByLabelText(/^name/i)
      await user.clear(nameInput)
      await user.type(nameInput, 'New Name')

      await user.click(screen.getByRole('button', { name: /update client/i }))

      await waitFor(() => {
        expect(mockUpdateClient).toHaveBeenCalledTimes(1)
      })

      expect(mockUpdateClient).toHaveBeenCalledWith('client-1', expect.objectContaining({
        name: 'New Name',
      }))
    })

    it('refreshes router after updating', async () => {
      const user = userEvent.setup()
      mockUpdateClient.mockResolvedValue(undefined)

      const existingClient = {
        id: 'client-1',
        name: 'Test',
        email: 'test@example.com',
        phone: null,
        address: null,
        archivedAt: null,
        invoiceCount: 0,
      }

      render(<ClientForm client={existingClient} />)

      await user.click(screen.getByRole('button', { name: /update client/i }))

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('prevents submission when validation fails', async () => {
      const user = userEvent.setup()
      render(<ClientForm />)

      // Try to submit without required fields
      await user.click(screen.getByRole('button', { name: /create client/i }))

      expect(mockCreateClient).not.toHaveBeenCalled()
    })

    it('shows error message when server action fails', async () => {
      const user = userEvent.setup()
      mockCreateClient.mockRejectedValue(new Error('Server error'))

      render(<ClientForm />)

      await user.type(screen.getByLabelText(/^name/i), 'Test Client')
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')

      await user.click(screen.getByRole('button', { name: /create client/i }))

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument()
      })
    })
  })

  describe('archive functionality', () => {
    it('calls archiveClient when archive button is clicked', async () => {
      const user = userEvent.setup()
      mockArchiveClient.mockResolvedValue(undefined)

      const existingClient = {
        id: 'client-1',
        name: 'Test',
        email: 'test@example.com',
        phone: null,
        address: null,
        archivedAt: null,
        invoiceCount: 0,
      }

      render(<ClientForm client={existingClient} />)

      await user.click(screen.getByRole('button', { name: /archive/i }))

      await waitFor(() => {
        expect(mockArchiveClient).toHaveBeenCalledWith('client-1')
      })
    })

    it('redirects to clients list after archiving', async () => {
      const user = userEvent.setup()
      mockArchiveClient.mockResolvedValue(undefined)

      const existingClient = {
        id: 'client-1',
        name: 'Test',
        email: 'test@example.com',
        phone: null,
        address: null,
        archivedAt: null,
        invoiceCount: 0,
      }

      render(<ClientForm client={existingClient} />)

      await user.click(screen.getByRole('button', { name: /archive/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/clients')
      })
    })

    it('shows invoice count warning when client has invoices', () => {
      const existingClient = {
        id: 'client-1',
        name: 'Test',
        email: 'test@example.com',
        phone: null,
        address: null,
        archivedAt: null,
        invoiceCount: 5,
      }

      render(<ClientForm client={existingClient} />)

      expect(screen.getByText(/5 invoices/i)).toBeInTheDocument()
    })
  })
})
