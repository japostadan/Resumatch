// Define prop types – always type your component props!
interface UserCardProps {
  name: string
  role: string
}

// UserCard is a simple presentational component.
// Put reusable UI pieces like this in src/components/.
export function UserCard({ name, role }: UserCardProps) {
  return (
    <div className="border border-border bg-surface rounded-lg px-4 py-3 mb-2">
      <strong className="font-semibold">{name}</strong>
      {' — '}
      <em className="text-muted">{role}</em>
    </div>
  )
}
