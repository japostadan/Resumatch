# Testing

Testing is not optional here, and it's not an afterthought — we build test-first.

## Test-Driven Development (required)

Every feature and every bugfix follows **red → green → refactor**:

1. **Red** — write the smallest failing test for the next piece of behavior.
2. **Green** — write the least code that makes it pass.
3. **Refactor** — clean up with the test as your safety net.

No "I'll add tests later" PRs. Tests must cover the happy path, auth/validation
failures, and invalid state transitions — not just the sunny day.

## The stack

| Area     | Tools                                  |
| -------- | -------------------------------------- |
| Frontend | Vitest + React Testing Library (jsdom) |
| Backend  | Vitest + Supertest                     |

## Frontend

- **Render the screen and assert on what the user sees and can do** — query by role,
  label, and text, not by CSS class or component internals.
- **Co-locate the test with its screen**: `components/CreateGame/CreateGame.test.tsx`.
  Shared setup (`setup.ts`) stays in `src/test/`.
- **Mock the network boundary, not our own logic.** Stub `fetch` (or the `lib/api`
  function) so the test drives real component behavior — validation, state, what
  renders — with a controlled response. Never write a test that only asserts a mock
  was called and calls that "coverage."

```tsx
it('shows the Game ID on success', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ gameId: 'abc123', hostToken: 't' }),
    }),
  )
  render(<CreateGame />)
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pw' } })
  fireEvent.click(screen.getByRole('button', { name: /create game/i }))
  expect(await screen.findByText('abc123')).toBeInTheDocument()
})
```

## Backend

- **Unit-test the store directly** — drive `GameStore` transitions and assert on the
  resulting `GameView`. This is where the game rules are proven.
- **Supertest each route** — happy path plus the error responses (wrong password,
  wrong status, missing body → correct HTTP status).
- Test files live flat in `backend/src/test/`, importing source with `../` paths.

## Rules

- **Test output must be clean.** If a test intentionally triggers an error, capture
  and assert the error — don't let stray logs pollute the run.
- **Never delete a failing test to go green.** Fix the code, or raise it with the
  team if the test itself is wrong.
- **No mocks in end-to-end tests** — those use real data and real APIs.
- **Reducing coverage is worse than a failing test.** Every new path gets a test.

## Running tests

```bash
npm run test                          # everything (frontend + backend)
cd frontend && npm run test:watch     # frontend watch mode while developing
cd backend  && npm run test           # backend only
```
