import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/stat-card'

describe('StatCard', () => {
  it('renders label and value', () => {
    render(
      <StatCard icon={<span>icon</span>} label="Total" value="$1,000" variant="blue" />
    )
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('$1,000')).toBeInTheDocument()
  })

  it('renders subtext when provided', () => {
    render(
      <StatCard icon={<span>icon</span>} label="Revenue" value="$5,000" subtext="This month" variant="green" />
    )
    expect(screen.getByText('This month')).toBeInTheDocument()
  })

  it('does not render subtext when not provided', () => {
    render(
      <StatCard icon={<span>icon</span>} label="Count" value="42" variant="red" />
    )
    expect(screen.queryByText('This month')).not.toBeInTheDocument()
  })

  it('renders the icon', () => {
    render(
      <StatCard icon={<span data-testid="test-icon">$</span>} label="Total" value="100" variant="blue" />
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })
})
