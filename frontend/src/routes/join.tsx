import { createFileRoute } from '@tanstack/react-router'
import { JoinGame } from '../components/joinGame/JoinGame'

export const Route = createFileRoute('/join')({
  component: JoinGame,
})