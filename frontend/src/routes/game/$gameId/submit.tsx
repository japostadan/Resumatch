import { createFileRoute } from '@tanstack/react-router'
import { SubmitStatement } from '../../../components/submitStatement/SubmitStatement'

// game/$gameId/submit.tsx → "/game/:gameId/submit"
export const Route = createFileRoute('/game/$gameId/submit')({
  component: SubmitStatement,
})
