import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Home } from '../components/home/Home'

describe('Home', () => {
  it('renders the headline', () => {
    render(<Home />)
    expect(
      screen.getByRole('heading', { name: /how personal is your personal statement/i }),
    ).toBeInTheDocument()
  })

  it('shows the Host and Player entry points as disabled', () => {
    render(<Home />)
    expect(screen.getByRole('button', { name: /create a game/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /join a game/i })).toBeDisabled()
  })

  it('shows the three development stages with their status', () => {
    render(<Home />)
    expect(screen.getByText('Game engine')).toBeInTheDocument()
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('Game API')).toBeInTheDocument()
    expect(screen.getByText('Up next')).toBeInTheDocument()
    expect(screen.getByText('Game screens')).toBeInTheDocument()
    expect(screen.getByText('Later')).toBeInTheDocument()
  })
})
