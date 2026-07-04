# Code Style

Conventions that aren't enforced by the formatter but that we hold each other to in
review. When in doubt, match the file you're editing.

## Exports: named, never default

Every module uses **named exports**. This is consistent across the whole repo —
routes, components, the store, shared types.

```ts
export function CreateGame() {
  /* … */
} // ✅
export default CreateGame // ❌
```

Named exports keep import names stable, make symbols greppable, and avoid the
"default export renamed on import" confusion.

## Naming

- **Name things by what they do in the domain, not how they're built.** `createGame`,
  `GameStore`, `MissingPasswordError` — not `handleClick2` or `dataManager`.
- **Components** and their files are `PascalCase`: `Header.tsx` exports `Header`.
- **Hooks** start with `use`: `useGameSession`, `useGameState`.
- **Non-component modules** are `camelCase` files: `api.ts`.
- **Error classes** end in `Error` and each maps to one HTTP status
  (`WrongPasswordError` → 403). See `backend/src/errors/`.

## Comments explain WHY, not WHAT

Write comments for the reasoning a reader can't get from the code. Never leave
temporal or changelog comments ("changed this", "used to be X") — that's what git
history is for.

```ts
// Requests go to a relative /api path; the Vite dev server proxies it to the
// backend, and the deployed site does the same.        ✅ explains why
const res = await fetch('/api/games' /* … */)

// call fetch                                             ❌ restates the code
```

## TypeScript

- **No `any`.** If a value is untyped at a boundary (e.g. `req.body`), narrow it or
  cast to a shared type — don't let `any` flow into your logic.
- **Use the shared contract.** Request/response shapes live in `@resumatch/shared`
  (`CreateGameBody`, `GameView`, …). Import them rather than redefining shapes.
- **Validate at the boundary.** Guard inputs where they enter the system (the store
  for domain rules, the component for user input) and throw a typed error.

## Keep changes small and focused

- Make the **smallest reasonable change** to achieve the outcome.
- Don't reformat or refactor unrelated code inside a feature PR — it hides the real
  diff from reviewers.
- Don't add features or abstraction you don't need yet (YAGNI). The best code is no
  code.
