import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { HostAdvance } from "./HostAdvance";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useParams: () => ({ gameId: "g" }),
  useNavigate: () => navigate,
}));

function mockApi(
  stateBody: unknown,
  nextResponse: { ok?: boolean; status?: number; body?: unknown } = {},
) {
  const { ok = true, status = 200, body = { ok: true } } = nextResponse;
  const fetchMock = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
    if (init?.method === "POST") return { ok, status, json: async () => body };
    return { ok: true, status: 200, json: async () => stateBody };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const activeView = {
  status: "ACTIVE",
  gameId: "g",
  currentStatement: "I can juggle flaming torches",
  currentStatementIndex: 0,
  totalStatements: 2,
  candidates: [
    { id: "a", name: "Alice" },
    { id: "b", name: "Bob" },
  ],
  hasVoted: false,
  votesIn: 1,
  totalPlayers: 3,
};

const lobbyView = {
  status: "LOBBY",
  gameId: "g",
  players: [],
};

const finishedView = {
  status: "FINISHED",
  gameId: "g",
  results: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  window.location.hash = "";
});

describe("HostAdvance", () => {
  it("shows the current statement and the statement counter", async () => {
    window.location.hash = "hostToken=host-tok";
    mockApi(activeView);

    render(<HostAdvance />);

    expect(await screen.findByText(/juggle flaming torches/i)).toBeInTheDocument();
    expect(screen.getByText(/1 of 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  it("polls the game state without a playerId", async () => {
    window.location.hash = "hostToken=host-tok";
    const fetchMock = mockApi(activeView);

    render(<HostAdvance />);

    await screen.findByText(/juggle flaming torches/i);
    expect(fetchMock).toHaveBeenCalledWith("/api/games/g/state");
  });

  it("advances the statement with the host token when Next is pressed", async () => {
    window.location.hash = "hostToken=host-tok";
    const fetchMock = mockApi(activeView);

    render(<HostAdvance />);

    fireEvent.click(await screen.findByRole("button", { name: /next/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/games/g/next",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "X-Host-Token": "host-tok" }),
        }),
      ),
    );
  });

  it("keeps Next disabled after advancing until the poll reports the next statement", async () => {
    window.location.hash = "hostToken=host-tok";
    mockApi(activeView);

    render(<HostAdvance />);

    const next = await screen.findByRole("button", { name: /next/i });
    fireEvent.click(next);

    await waitFor(() => expect(next).toBeDisabled());
  });

  it("surfaces the backend feedback when advancing fails", async () => {
    window.location.hash = "hostToken=host-tok";
    mockApi(activeView, {
      ok: false,
      status: 409,
      body: { error: "Game is not in progress" },
    });

    render(<HostAdvance />);

    fireEvent.click(await screen.findByRole("button", { name: /next/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Game is not in progress");
    expect(screen.getByRole("button", { name: /next/i })).toBeEnabled();
  });

  it("shows a waiting screen without a Next button when the game is not ACTIVE", async () => {
    window.location.hash = "hostToken=host-tok";
    mockApi(lobbyView);

    render(<HostAdvance />);

    expect(await screen.findByRole("heading", { name: /hang tight/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("shows the voting progress for the current statement", async () => {
    window.location.hash = "hostToken=host-tok";
    mockApi(activeView);

    render(<HostAdvance />);

    expect(await screen.findByText(/1 of 3 votes in/i)).toBeInTheDocument();
  });

  it("labels the button Finish game on the last statement", async () => {
    window.location.hash = "hostToken=host-tok";
    mockApi({ ...activeView, currentStatementIndex: 1 });

    render(<HostAdvance />);

    expect(await screen.findByRole("button", { name: /finish game/i })).toBeInTheDocument();
  });

  it("navigates to the results when the game is FINISHED", async () => {
    window.location.hash = "hostToken=host-tok";
    mockApi(finishedView);

    render(<HostAdvance />);

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/game/$gameId/results",
        params: { gameId: "g" },
        hash: "hostToken=host-tok",
      }),
    );
  });
});
