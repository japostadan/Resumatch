# Linting & Formatting

We use **[oxlint](https://oxc.rs)** for linting and **[Prettier](https://prettier.io)**
for formatting. Both are configured once at the repo root and applied to every
workspace. The formatter is authoritative: don't hand-format, and don't argue with
it — let it decide. We use Prettier (rather than oxc's formatter) because the whole
team runs the Prettier editor extension, so editor and CI share one identical tool.

## The tools

| Tool     | Config file        | What it does                       |
| -------- | ------------------ | ---------------------------------- |
| oxlint   | `.oxlintrc.json`   | Catches bugs and bad patterns      |
| Prettier | `.prettierrc.json` | Enforces one consistent code style |

### What Prettier enforces (`.prettierrc.json`)

- Semicolons
- Double quotes
- 2-space indentation
- Trailing commas everywhere (`"all"`)
- 100-character print width
- `.prettierignore` skips lockfiles and generated files (`routeTree.gen.ts`)

### What oxlint enforces (`.oxlintrc.json`)

- `correctness` rules are **errors**; `suspicious` rules are **warnings**.
- Frontend files get the `react`, `jsx-a11y`, `typescript`, `import` and `vitest`
  plugins — so accessibility issues (e.g. `autoFocus`) and React mistakes are caught.
- Backend files get `typescript`, `import` and `vitest`.

## Commands

```bash
npm run lint          # oxlint across frontend, backend, shared — must be error-free
npm run format        # prettier --write — rewrites files in place
npm run format:check  # prettier --check — fails if anything is unformatted (used by CI)
```

Run these from the repo root.

## Editor setup (do this once)

The repo ships VS Code settings that make this automatic — install the recommended
extensions when prompted (or from the Extensions panel):

- **`esbenp.prettier-vscode`** — Prettier, the formatter
- **`oxc.oxc-vscode`** — oxlint, the linter
- `bradlc.vscode-tailwindcss` — Tailwind class autocomplete
- `ms-azuretools.vscode-docker` — Dev Container support

`.vscode/settings.json` already sets Prettier as the default formatter (per language,
so it can't be overridden by a global setting), turns on **format-on-save**, and
applies oxlint auto-fixes on save. With the extensions installed you rarely need to
run the commands by hand — files format and fix themselves as you save.

## CI gate

GitHub Actions runs on every push and PR to `main`:

```
lint → test (frontend) → test (backend) → format:check → build
```

All steps must pass before a PR can merge. A red `main` blocks everyone.

## Pre-commit hook

A pre-commit hook auto-formats staged files with Prettier, so a misconfigured editor
can't slip unformatted code past the CI `format:check`. It runs `prettier --write` on
your staged files via [lint-staged](https://github.com/lint-staged/lint-staged) —
only the files you're committing, with any unstaged changes safely stashed while it
works.

It installs itself: `npm install` runs the `prepare` script, which points git at the
committed hooks (`git config core.hooksPath .githooks`). No husky. If you clone or
pull and the hook doesn't fire, run `npm install` once.

The hook is a backstop, not a replacement for editor setup — keep format-on-save on
so files are already clean by the time you commit. Still run `npm run lint` before
you push; the hook only handles formatting.

## Good practices

- **Let format-on-save do the work.** Don't hand-format; if a line looks off, save
  the file.
- **Fix lint before you push**, don't leave it for the reviewer or CI.
- **Never blanket-disable a rule.** If a specific line genuinely needs an exception,
  disable that one line with a short reason:
  ```ts
  // oxlint-disable-next-line no-explicit-any -- third-party type is untyped
  ```
  A repo-wide or file-wide disable needs team agreement first.
- **Don't hand-edit generated files** (`routeTree.gen.ts`) — they're regenerated and
  excluded from formatting on purpose.
- **Keep the config changes deliberate.** Editing `.oxlintrc.json` / `.prettierrc.json`
  changes the rules for everyone — raise it with the team, don't slip it into a
  feature PR.
