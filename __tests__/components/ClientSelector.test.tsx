import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientSelector } from '@/components/client-selector'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

const mockClients = [
  {
    id: 'client-1',
    name: 'Acme Corp',
    email: 'acme@example.com',
    phone: '+1-555-123-4567',
    address: '123 Main St',
  },
  {
    id: 'client-2',
    name: 'Globex Ltd',
    email: 'globex@example.com',
    phone: null,
    address: null,
  },
  {
    id: 'client-3',
    name: 'Initech',
    email: 'initech@example.com',
    phone: null,
    address: '456 Office Park',
  },
]

describe('ClientSelector', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders a dropdown with placeholder', () => {
      render(<ClientSelector clients={mockClients} onSelect={mockOnSelect} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText(/select a client/i)).toBeInTheDocument()
    })

    it('shows all clients as options in the select', () => {
      render(<ClientSelector clients={mockClients} onSelect={mockOnSelect} />)

      const select = screen.getByRole('combobox')
      const options = within(select).getAllByRole('option')

      // 3 clients + 1 placeholder
      expect(options).toHaveLength(4)
      expect(options[1]).toHaveTextContent(/acme corp/i)
      expect(options[2]).toHaveTextContent(/globex ltd/i)
      expect(options[3]).toHaveTextContent(/initech/i)
    })

    it('displays client name with email in options', () => {
      render(<ClientSelector clients={mockClients} onSelect={mockOnSelect} />)

      const select = screen.getByRole('combobox')
      const options = within(select).getAllByRole('option')

      expect(options[1]).toHaveTextContent(/acme@example.com/i)
    })

    it('shows link to create new client', () => {
      render(<ClientSelector clients={mockClients} onSelect={mockOnSelect} />)

      const link = screen.getByRole('link', { name: /create.*client/i })
      expect(link).toHaveAttribute('href', '/clients/new')
    })

    it('shows selected client when value is provided', () => {
      const selectedClient = mockClients[0]
      render(
        <ClientSelector
          clients={mockClients}
          onSelect={mockOnSelect}
          value={selectedClient.id}
        />
      )

      const select = screen.getByRole('combobox')
      expect(select).toHaveValue('client-1')
    })
  })

  describe('selection', () => {
    it('calls onSelect with client data when a client is selected', async () => {
      const user = userEvent.setup()
      render(<ClientSelector clients={mockClients} onSelect={mockOnSelect} />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'client-1')

      expect(mockOnSelect).toHaveBeenCalledWith(mockClients[0])
    })

    it('passes full client data including optional fields', async () => {
      const user = userEvent.setup()
      render(<ClientSelector clients={mockClients} onSelect={mockOnSelect} />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'client-1')

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'client-1',
          name: 'Acme Corp',
          email: 'acme@example.com',
          phone: '+1-555-123-4567',
          address: '123 Main St',
        })
      )
    })

    it('handles clients with null optional fields', async () => {
      const user = userEvent.setup()
      render(<ClientSelector clients={mockClients} onSelect={mockOnSelect} />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'client-2')

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'client-2',
          name: 'Globex Ltd',
          email: 'globex@example.com',
          phone: null,
          address: null,
        })
      )
    })
  })

  describe('empty state', () => {
    it('shows helpful message when no clients exist', () => {
      render(<ClientSelector clients={[]} onSelect={mockOnSelect} />)

      expect(screen.getByText(/no clients yet/i)).toBeInTheDocument()
    })

    it('still shows create client link when no clients', () => {
      render(<ClientSelector clients={[]} onSelect={mockOnSelect} />)

      const link = screen.getByRole('link', { name: /create.*client/i })
      expect(link).toHaveAttribute('href', '/clients/new')
    })
  })

  describe('client info display', () => {
    it('shows selected client details summary', () => {
      const selectedClient = mockClients[0]
      render(
        <ClientSelector
          clients={mockClients}
          onSelect={mockOnSelect}
          value={selectedClient.id}
        />
      )

      // Summary section shows client name, email and other details
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument()
      expect(screen.getByText('123 Main St')).toBeInTheDocument()
    })

    it('does not show summary when no client selected', () => {
      render(<ClientSelector clients={mockClients} onSelect={mockOnSelect} />)

      // Address only appears in summary, not in select options
      expect(screen.queryByText('123 Main St')).not.toBeInTheDocument()
    })
  })
})
