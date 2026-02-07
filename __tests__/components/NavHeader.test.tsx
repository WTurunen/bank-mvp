import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn().mockReturnValue({ data: null }),
  signOut: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/'),
}))

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { NavHeader } from '@/components/nav-header'

describe('NavHeader', () => {
  it('renders the app name', () => {
    render(<NavHeader />)
    expect(screen.getByText('Invoice Manager')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<NavHeader />)
    expect(screen.getByText('Invoices')).toBeInTheDocument()
    expect(screen.getByText('Clients')).toBeInTheDocument()
  })

  it('shows "Sign in" when not authenticated', () => {
    vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated', update: vi.fn() })
    render(<NavHeader />)
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })

  it('shows "Sign out" when authenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { name: 'Test', email: 'test@test.com' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    })
    render(<NavHeader />)
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('highlights active nav item for invoices path', () => {
    vi.mocked(usePathname).mockReturnValue('/invoices/123')
    vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated', update: vi.fn() })
    render(<NavHeader />)
    const invoicesLink = screen.getByText('Invoices').closest('a')
    expect(invoicesLink?.className).toContain('text-blue-600')
  })

  it('highlights active nav item for clients path', () => {
    vi.mocked(usePathname).mockReturnValue('/clients')
    vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated', update: vi.fn() })
    render(<NavHeader />)
    const clientsLink = screen.getByText('Clients').closest('a')
    expect(clientsLink?.className).toContain('text-blue-600')
  })
})
