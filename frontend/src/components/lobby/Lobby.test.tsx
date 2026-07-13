import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within, waitFor, fireEvent } from "@testing-library/react";
import { Lobby } from "./Lobby";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useParams: () => ({ gameId: "g" }),
  useNavigate: () => navigate,
}));

function mockFetch(body: unknown, { ok = true, status = 200 } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, status, json: async () => body });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const lobbyView = {
  status: "LOBBY",
  gameId: "g",
  players: [
    { id: "a", name: "Alice", hasSubmitted: true },
    { id: "b", name: "Bob", hasSubmitted: false },
  ],
};

const bothSubmitted = {
  status: "LOBBY",
  gameId: "g",
  players: [
    { id: "a", name: "Alice", hasSubmitted: true },
    { id: "b", name: "Bob", hasSubmitted: true },
  ],
};

const activeView = {
  status: "ACTIVE",
  gameId: "g",
  currentStatement: "s",
  currentStatementIndex: 0,
  totalStatements: 2,
  candidates: [],
  hasVoted: false,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  window.location.hash = "";
});

describe("Lobby", () => {
  it("shows the host a live list of players with each submission status", async () => {
    window.location.hash = "hostToken=host-tok";
    mockFetch(lobbyView);

    render(<Lobby />);

    const alice = (await screen.findByText("Alice")).closest("li")!;
    expect(within(alice).getByText(/submitted/i)).toBeInTheDocument();

    const bob = screen.getByText("Bob").closest("li")!;
    expect(within(bob).getByText(/waiting/i)).toBeInTheDocument();
  });

  it("shows the Game ID to the host", async () => {
    window.location.hash = "hostToken=host-tok";
    mockFetch(lobbyView);

    render(<Lobby />);

    expect(await screen.findByText(/game id/i)).toBeInTheDocument();
    expect(await screen.findByText("g", { selector: "code" })).toBeInTheDocument();
  });

  it("does not show the Game ID to players", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    mockFetch(lobbyView);

    render(<Lobby />);

    await screen.findByText(/statement is in/i);

    expect(screen.queryByText(/game id/i)).not.toBeInTheDocument();
  });

  it("confirms to the player that their statement was submitted", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    mockFetch(lobbyView);

    render(<Lobby />);

    expect(await screen.findByText(/statement is in/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting for the host/i)).toBeInTheDocument();
  });

  it("withholds the confirmation until the polled state shows the submission", async () => {
    window.location.hash = "playerToken=player-tok&playerId=b";
    mockFetch(lobbyView);

    render(<Lobby />);

    expect(await screen.findByText(/confirm your submission/i)).toBeInTheDocument();
    expect(screen.queryByText(/your statement is in/i)).not.toBeInTheDocument();
  });

  it("prompts an unknown visitor to rejoin when there is no session", () => {
    window.location.hash = "";
    mockFetch(lobbyView);

    render(<Lobby />);

    expect(screen.getByRole("heading", { name: /rejoin/i })).toBeInTheDocument();
  });

  it("disables the host Start button until at least two statements are submitted", async () => {
    window.location.hash = "hostToken=host-tok";
    mockFetch(lobbyView); // only Alice has submitted

    render(<Lobby />);

    await screen.findByText("Alice");
    expect(screen.getByRole("button", { name: /start/i })).toBeDisabled();
  });

  it("starts the game with the host token when two statements are in", async () => {
    window.location.hash = "hostToken=host-tok";
    const fetchMock = mockFetch(bothSubmitted);

    render(<Lobby />);

    const start = await screen.findByRole("button", { name: /start/i });
    await waitFor(() => expect(start).toBeEnabled());
    fireEvent.click(start);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/games/g/start",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "X-Host-Token": "host-tok" }),
        }),
      ),
    );
  });

  it("moves the host to the vote screen when the game becomes ACTIVE", async () => {
    window.location.hash = "hostToken=host-tok";
    mockFetch(activeView);

    render(<Lobby />);

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/game/$gameId/vote",
        params: { gameId: "g" },
        hash: "hostToken=host-tok",
      }),
    );
  });

  it("moves the player to the vote screen when the game becomes ACTIVE", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    mockFetch(activeView);

    render(<Lobby />);

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/game/$gameId/vote",
        params: { gameId: "g" },
        hash: "playerToken=player-tok&playerId=a",
      }),
    );
  });
});
