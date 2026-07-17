import { useEffect, useState } from "react";

export type ColorScheme = "dark" | "light";

const STORAGE_KEY = "resumatch-theme";

function readInitialScheme(): ColorScheme {
  return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

// Applies the scheme to <html data-theme> (index.css's light-mode rules key
// off that attribute) and persists it, so a reload keeps the choice.
export function useColorScheme() {
  const [scheme, setScheme] = useState<ColorScheme>(readInitialScheme);

  useEffect(() => {
    document.documentElement.dataset.theme = scheme;
    window.localStorage.setItem(STORAGE_KEY, scheme);
  }, [scheme]);

  function toggleScheme() {
    setScheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return { scheme, toggleScheme };
}
