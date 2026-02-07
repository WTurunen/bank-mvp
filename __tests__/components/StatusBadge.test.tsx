import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/status-badge'

describe('StatusBadge', () => {
  it('renders draft status', () => {
    render(<StatusBadge status="draft" />)
    expect(screen.getByRole('status')).toHaveTextContent('Draft')
  })

  it('renders sent status', () => {
    render(<StatusBadge status="sent" />)
    expect(screen.getByRole('status')).toHaveTextContent('Sent')
  })

  it('renders paid status', () => {
    render(<StatusBadge status="paid" />)
    expect(screen.getByRole('status')).toHaveTextContent('Paid')
  })

  it('renders overdue status', () => {
    render(<StatusBadge status="overdue" />)
    expect(screen.getByRole('status')).toHaveTextContent('Overdue')
  })

  it('includes an icon with aria-hidden', () => {
    render(<StatusBadge status="draft" />)
    const icon = screen.getByRole('status').querySelector('[aria-hidden="true"]')
    expect(icon).toBeTruthy()
  })
})
