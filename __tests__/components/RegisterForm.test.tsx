import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock auth action
vi.mock('@/app/actions/auth', () => ({
  registerUser: vi.fn(),
}))

import { registerUser } from '@/app/actions/auth'
import { RegisterForm } from '@/components/register-form'

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders name, email, and password fields', () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders create account button', () => {
    render(<RegisterForm />)
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('renders link to login page', () => {
    render(<RegisterForm />)
    expect(screen.getByText(/sign in/i)).toHaveAttribute('href', '/login')
  })

  it('registers user and redirects on success', async () => {
    vi.mocked(registerUser).mockResolvedValue({ success: true })

    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      })
      expect(mockPush).toHaveBeenCalledWith('/login?registered=true')
    })
  })

  it('shows error on failed registration', async () => {
    vi.mocked(registerUser).mockResolvedValue({ success: false, error: 'Email already exists' })

    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'dupe@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    vi.mocked(registerUser).mockImplementation(() => new Promise(() => {}))

    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByLabelText(/name/i), 'Test User')
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating account/i })).toBeDisabled()
    })
  })
})
