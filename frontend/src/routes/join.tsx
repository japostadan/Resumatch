import { createFileRoute } from '@tanstack/react-router'
import { JoinGame } from '../components/joinGame/JoinGame'

// join.tsx → "/join"
export const Route = createFileRoute('/join')({
  component: JoinGame,
})
