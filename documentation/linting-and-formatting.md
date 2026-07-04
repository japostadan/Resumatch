# Linting & Formatting

We use the [oxc](https://oxc.rs) toolchain — **oxlint** for linting and **oxfmt**
for formatting. Both are configured once at the repo root and applied to every
workspace. The formatter is authoritative: don't hand-format, and don't argue with
it — let it decide.

## The tools

| Tool   | Config file      | What it does                       |
| ------ | ---------------- | ---------------------------------- |
| oxlint | `.oxlintrc.json` | Catches bugs and bad patterns      |
| oxfmt  | `.oxfmtrc.json`  | Enforces one consistent code style |

### What oxfmt enforces (`.oxfmtrc.json`)

- No semicolons
- Single quotes
- 2-space indentation
- Trailing commas everywhere (`"all"`)
- 100-character print width
- Ignores generated files (`routeTree.gen.ts`)

### What oxlint enforces (`.oxlintrc.json`)

- `correctness` rules are **errors**; `suspicious` rules are **warnings**.
- Frontend files get the `react`, `jsx-a11y`, `typescript`, `import` and `vitest`
  plugins — so accessibility issues (e.g. `autoFocus`) and React mistakes are caught.
- Backend files get `typescript`, `import` and `vitest`.

## Commands

```bash
npm run lint          # oxlint across frontend, backend, shared — must be error-free
npm run format        # oxfmt — rewrites files in place
npm run format:check  # oxfmt --check — fails if anything is unformatted (used by CI)
```

Run these from the repo root.

## Editor setup (do this once)

The repo ships VS Code settings that make this automatic — install the recommended
extensions when prompted (or from the Extensions panel):

- **`oxc.oxc-vscode`** — the oxlint + oxfmt integration
- `bradlc.vscode-tailwindcss` — Tailwind class autocomplete
- `ms-azuretools.vscode-docker` — Dev Container support

`.vscode/settings.json` already sets oxc as the default formatter, turns on
**format-on-save**, and applies oxlint auto-fixes on save. With the extension
installed you rarely need to run the commands by hand — files format and fix
themselves as you save.

## CI gate

GitHub Actions runs on every push and PR to `main`:

```
lint → test (frontend) → test (backend) → format:check → build
```

All steps must pass before a PR can merge. There is **no pre-commit hook** — CI is
the safety net, so it's on you to run `npm run lint` and `npm run format:check`
before you push. A red `main` blocks everyone.

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
- **Keep the config changes deliberate.** Editing `.oxlintrc.json` / `.oxfmtrc.json`
  changes the rules for everyone — raise it with the team, don't slip it into a
  feature PR.
