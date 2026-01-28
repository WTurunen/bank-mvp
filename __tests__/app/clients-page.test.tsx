import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientsPage from '@/app/clients/page'

// Mock Next.js modules
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock the actions
vi.mock('@/app/actions/clients', () => ({
  getClients: vi.fn(),
  restoreClient: vi.fn(),
}))

import { getClients } from '@/app/actions/clients'

const mockClients = [
  {
    id: 'client-1',
    name: 'Acme Corp',
    email: 'acme@example.com',
    companyName: 'Acme Corporation',
    phone: '+1-555-123-4567',
    address: '123 Main St',
    archivedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    _count: { invoices: 5 },
  },
  {
    id: 'client-2',
    name: 'Globex Ltd',
    email: 'globex@example.com',
    companyName: null,
    phone: null,
    address: null,
    archivedAt: null,
    createdAt: new Date('2026-01-02'),
    updatedAt: new Date('2026-01-02'),
    _count: { invoices: 2 },
  },
]

describe('ClientsPage error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays error message when getClients fails', async () => {
    vi.mocked(getClients).mockRejectedValue(new Error('Database connection failed'))

    render(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Database connection failed')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('shows generic error message for non-Error objects', async () => {
    vi.mocked(getClients).mockRejectedValue('Unknown error')

    render(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load clients')).toBeInTheDocument()
    })
  })

  it('retry button reloads clients', async () => {
    // First call fails
    vi.mocked(getClients).mockRejectedValueOnce(new Error('Network error'))
    // Second call succeeds
    vi.mocked(getClients).mockResolvedValueOnce(mockClients)

    render(<ClientsPage />)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    // Click retry
    const retryButton = screen.getByRole('button', { name: /retry/i })
    await userEvent.click(retryButton)

    // Wait for loading to finish and clients to appear
    await waitFor(() => {
      expect(screen.queryByText('Network error')).not.toBeInTheDocument()
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    // Verify getClients was called twice (initial + retry)
    expect(getClients).toHaveBeenCalledTimes(2)
  })

  it('clears error state when retrying', async () => {
    vi.mocked(getClients).mockRejectedValueOnce(new Error('Initial error'))
    vi.mocked(getClients).mockResolvedValueOnce(mockClients)

    render(<ClientsPage />)

    await waitFor(() => {
      expect(screen.getByText('Initial error')).toBeInTheDocument()
    })

    // Click retry
    const retryButton = screen.getByRole('button', { name: /retry/i })
    await userEvent.click(retryButton)

    // Error should be cleared immediately when retry starts
    await waitFor(() => {
      expect(screen.queryByText('Initial error')).not.toBeInTheDocument()
    })
  })
})
