import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

// __root.tsx is the layout that wraps ALL pages.
// Add your nav, header, footer here.
export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <nav className="flex gap-6 px-6 py-3 border-b border-border">
        <Link
          to="/"
          activeProps={{ className: 'font-semibold' }}
          className="no-underline text-inherit"
        >
          Home
        </Link>
        <Link
          to="/about"
          activeProps={{ className: 'font-semibold' }}
          className="no-underline text-inherit"
        >
          About
        </Link>
        <Link
          to="/users"
          activeProps={{ className: 'font-semibold' }}
          className="no-underline text-inherit"
        >
          Users
        </Link>
      </nav>

      {/* Outlet renders the matched child route */}
      <main className="p-8">
        <Outlet />
      </main>

      {/* Remove TanStackRouterDevtools in production */}
      <TanStackRouterDevtools />
    </>
  )
}
