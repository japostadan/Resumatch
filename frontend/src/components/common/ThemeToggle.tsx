import { useColorScheme } from "../../hooks/useColorScheme";

export function ThemeToggle() {
  const { scheme, toggleScheme } = useColorScheme();

  return (
    <button
      type="button"
      onClick={toggleScheme}
      aria-label={scheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="grid size-6 place-items-center rounded-full border border-line text-xs text-ink transition hover:border-violet"
    >
      {scheme === "dark" ? "☾" : "☀"}
    </button>
  );
}
