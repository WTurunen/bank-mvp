import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrintButton } from '@/components/print-button'

describe('PrintButton', () => {
  const originalPrint = window.print

  afterEach(() => {
    window.print = originalPrint
  })

  it('renders a button with "Print Invoice" text', () => {
    render(<PrintButton />)
    expect(screen.getByRole('button', { name: /print invoice/i })).toBeInTheDocument()
  })

  it('calls window.print when clicked', async () => {
    const printSpy = vi.fn()
    window.print = printSpy

    const user = userEvent.setup()
    render(<PrintButton />)
    await user.click(screen.getByRole('button', { name: /print invoice/i }))

    expect(printSpy).toHaveBeenCalledTimes(1)
  })
})
