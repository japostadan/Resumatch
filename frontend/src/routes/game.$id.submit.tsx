import { createFileRoute } from '@tanstack/react-router'

function SubmitStatement() {
  const { id } = Route.useParams()

  return <h1>Submit statements for game {id}</h1>
}

export const Route = createFileRoute('/game/$id/submit')({
  component: SubmitStatement,
})