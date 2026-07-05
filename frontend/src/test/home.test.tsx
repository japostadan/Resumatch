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

  it('links the Host and Player to the create-game and join screens', () => {
    render(<Home />)
    expect(screen.getByRole('link', { name: /create a game/i })).toHaveAttribute('href', '/host')
    expect(screen.getByRole('link', { name: /join a game/i })).toHaveAttribute('href', '/join')
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
