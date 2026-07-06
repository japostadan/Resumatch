# Resumatch — Team Conventions

The shared playbook for how we build Resumatch. Read the relevant guide before you
start an issue — following these keeps the codebase consistent and keeps CI green.

> This folder is committed and shared with the whole team. (It is **not** the same
> as the local-only `docs/` folder, which holds ADRs and internal planning notes.)

## Guides

| Guide                                                    | What it covers                                                    |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| [frontend-structure.md](./frontend-structure.md)         | Where React components, screens, hooks and API code live          |
| [code-style.md](./code-style.md)                         | Naming, exports, comments, TypeScript habits                      |
| [linting-and-formatting.md](./linting-and-formatting.md) | oxlint + Prettier setup, editor config, CI gates, do's and don'ts |
| [testing.md](./testing.md)                               | TDD workflow and how we test the frontend and backend             |
| [git-and-prs.md](./git-and-prs.md)                       | Branch names, commit style, PR and review flow                    |
| [deployment.md](./deployment.md)                         | How the frontend + backend ship to Coolify via Docker Compose     |

## The five checks before every PR

CI runs all of these on every PR to `main`, and they must all pass:

```bash
npm run lint          # oxlint — no errors
npm run format:check  # prettier — everything formatted
npm run typecheck     # tsc — no type errors
npm run test          # vitest — all green
npm run build         # both apps build
```

Run them locally before you open a PR — a red `main` blocks the whole team.

## Golden rules

1. **Test-first, always.** Red → green → refactor. No "tests later" PRs.
2. **Never commit to `main`.** Branch per issue; two approving reviews to merge.
3. **Match the surrounding code.** Consistency within the repo beats personal taste.
4. **Smallest change that does the job.** Don't refactor unrelated code in a feature PR.
