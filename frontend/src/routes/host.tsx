import { createFileRoute } from '@tanstack/react-router'
import { CreateGame } from '../components/createGame/CreateGame'

// host.tsx → "/host"
export const Route = createFileRoute('/host')({
  component: CreateGame,
})
