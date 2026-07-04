# Git & Pull Requests

How we get work from a branch into `main` without breaking each other.

## Branches

- **Never commit to `main`.** It's protected — you can't push to it directly anyway.
- **One branch per issue.** Name it `<type>/<issue>-<short-desc>`, e.g.
  `feat/26-create-game-screen`, `fix/31-vote-double-count`, `docs/team-conventions`.
  The `<type>` matches the commit types below.
- **Keep branches short-lived.** Small, working increments beat a giant branch that
  sits for days and rots into merge conflicts.

## Commits

We use **Conventional Commits**. The prefix says what kind of change it is:

| Type        | For                                         |
| ----------- | ------------------------------------------- |
| `feat:`     | new user-facing functionality               |
| `fix:`      | a bug fix                                   |
| `chore:`    | tooling, config, dependencies, housekeeping |
| `docs:`     | documentation only                          |
| `test:`     | adding or fixing tests                      |
| `refactor:` | behavior-preserving code change             |

```
feat(frontend): add Create Game screen at /host
fix(store): reject non-string passwords
```

An optional scope in parentheses (`feat(store): …`) points at the area touched.
Commit **often** and keep each commit a coherent, working step.

## Pull requests

1. Push your branch and open a PR against `main`.
2. The PR description should say **what** changed and **why**, and link the issue
   (`Closes #26`).
3. **CI must be green** — lint, format check, typecheck, tests, and build all pass.
4. **Two teammates review and approve.** Reviewers actually run the change; they
   don't just skim the diff. Nobody — including the repo owner — merges without two
   approvals and green CI.
5. Address review comments by pushing follow-up commits, not force-pushing over
   history mid-review.

## Definition of done

An issue is done when **all** of these are true:

1. Built test-first; tests cover happy path, auth failures, and invalid states.
2. `npm run test` green.
3. `npm run typecheck` clean.
4. `npm run lint` and `npm run format:check` clean.
5. Opened as a PR, reviewed and approved by **two** teammates.
6. CI green on the PR.

## Reviewing someone else's PR

- **Run it**, don't just read it. Check out the branch and try the change.
- Leave specific, actionable comments tied to a line where you can.
- Distinguish blockers from nits — say which is which.
- Be direct and kind: we're colleagues improving the work, not scoring points.
