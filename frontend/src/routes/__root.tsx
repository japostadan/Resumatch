import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { useColorScheme } from "../hooks/useColorScheme";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  // Applies the persisted scheme to <html data-theme> on every route, not
  // just ones that render Header/ThemeToggle — otherwise a direct load or
  // reload of a Shell-only screen (Create Game, Lobby, Vote) never applies
  // the saved preference and silently falls back to dark.
  useColorScheme();

  return (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </>
  );
}
