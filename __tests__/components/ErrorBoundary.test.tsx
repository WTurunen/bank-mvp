import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}))

import * as Sentry from '@sentry/nextjs'
import { ErrorBoundary } from '@/components/error-boundary'

describe('ErrorBoundary', () => {
  const mockError = Object.assign(new Error('Test error'), { digest: 'abc123' })
  const mockReset = vi.fn()

  it('renders error message', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('displays error digest when available', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />)
    expect(screen.getByText('Error ID: abc123')).toBeInTheDocument()
  })

  it('does not display error digest when not available', () => {
    const errorNoDigest = new Error('No digest') as Error & { digest?: string }
    render(<ErrorBoundary error={errorNoDigest} reset={mockReset} />)
    expect(screen.queryByText(/Error ID:/)).not.toBeInTheDocument()
  })

  it('reports error to Sentry', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />)
    expect(Sentry.captureException).toHaveBeenCalledWith(mockError)
  })

  it('calls reset when "Try again" is clicked', async () => {
    const user = userEvent.setup()
    render(<ErrorBoundary error={mockError} reset={mockReset} />)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('has a "Go home" link', () => {
    render(<ErrorBoundary error={mockError} reset={mockReset} />)
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument()
  })
})
