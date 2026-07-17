import { LogoMark } from "./motifs";
import { ThemeToggle } from "./ThemeToggle";

function Header() {
  return (
    <header className="border-b-2 border-line">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-4 px-8 py-4">
        <span className="flex items-center gap-2.5 text-sm font-bold tracking-wide uppercase">
          <LogoMark className="glow text-violet" />
          Resumatch
        </span>
        <span className="ml-auto flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-status" />
            v0.1 · in development
          </span>
          <ThemeToggle />
        </span>
      </div>
    </header>
  );
}

export { Header };
