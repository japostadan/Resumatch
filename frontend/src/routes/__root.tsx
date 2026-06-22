import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <main className="p-8">
        <Outlet />
      </main>

      {/* Remove TanStackRouterDevtools in production */}
      <TanStackRouterDevtools />
    </>
  )
}
