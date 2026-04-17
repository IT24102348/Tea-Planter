import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatCard } from './StatCard'
import { Activity } from 'lucide-react'

describe('StatCard Component', () => {
  it('renders the title and value correctly', () => {
    render(<StatCard title="Total Harvest" value="1,250 kg" icon={Activity} color="green" />)
    
    expect(screen.getByText('Total Harvest')).toBeDefined()
    expect(screen.getByText('1,250 kg')).toBeDefined()
  })

  it('applies the correct color class', () => {
    const { container } = render(<StatCard title="Test" value="100" icon={Activity} color="blue" />)
    const iconContainer = container.querySelector('.bg-blue-100')
    expect(iconContainer).not.toBeNull()
  })
})
