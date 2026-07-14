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

const twoOfThreeSubmitted = {
  status: "LOBBY",
  gameId: "g",
  players: [
    { id: "a", name: "Alice", hasSubmitted: true },
    { id: "b", name: "Bob", hasSubmitted: true },
    { id: "c", name: "Cara", hasSubmitted: false },
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

  // Reopening a Lobby tab/link for a game that has already finished polls
  // straight into the gated FINISHED view, which requires credentials — the
  // Host Token must ride along so that poll isn't rejected.
  it("polls the state with the host token", async () => {
    window.location.hash = "hostToken=host-tok";
    const fetchMock = mockFetch(lobbyView);

    render(<Lobby />);

    await screen.findByText("Alice");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/games/g/state",
      expect.objectContaining({ headers: expect.objectContaining({ "X-Host-Token": "host-tok" }) }),
    );
  });

  it("polls the state with the player token", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    const fetchMock = mockFetch(lobbyView);

    render(<Lobby />);

    await screen.findByText(/statement is in/i);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/games/g/state?playerId=a",
      expect.objectContaining({
        headers: expect.objectContaining({ "X-Player-Token": "player-tok" }),
      }),
    );
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

  it("shows the host the Game ID and a QR code while waiting in the lobby", async () => {
    window.location.hash = "hostToken=host-tok";
    mockFetch(lobbyView);

    render(<Lobby />);

    await screen.findByText("Alice");
    expect(screen.getByText(/game id: g/i)).toBeInTheDocument();
    expect(await screen.findByAltText(/qr code for joining the game/i)).toBeInTheDocument();
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

  it("warns instead of starting when players have not submitted yet", async () => {
    window.location.hash = "hostToken=host-tok";
    const fetchMock = mockFetch(twoOfThreeSubmitted);

    render(<Lobby />);

    const start = await screen.findByRole("button", { name: /start game/i });
    await waitFor(() => expect(start).toBeEnabled());
    fireEvent.click(start);

    expect(await screen.findByText(/only 2 of 3 players have submitted/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/games/g/start", expect.anything());
  });

  it("starts the game after the host confirms leaving pending players out", async () => {
    window.location.hash = "hostToken=host-tok";
    const fetchMock = mockFetch(twoOfThreeSubmitted);

    render(<Lobby />);

    const start = await screen.findByRole("button", { name: /start game/i });
    await waitFor(() => expect(start).toBeEnabled());
    fireEvent.click(start);
    fireEvent.click(await screen.findByRole("button", { name: /start anyway/i }));

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

  // Real timers: the scenario spans three 2-second polls, so this test takes
  // a few seconds — the price of covering the stale-confirmation regression.
  it("does not resurface the warning once the room has caught up", async () => {
    window.location.hash = "hostToken=host-tok";
    const allThreeSubmitted = {
      ...twoOfThreeSubmitted,
      players: twoOfThreeSubmitted.players.map((p) => ({ ...p, hasSubmitted: true })),
    };
    const fourthJoined = {
      ...allThreeSubmitted,
      players: [...allThreeSubmitted.players, { id: "d", name: "Dan", hasSubmitted: false }],
    };
    const polls = [twoOfThreeSubmitted, allThreeSubmitted, fourthJoined];
    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => ({
        ok: true,
        status: 200,
        json: async () => polls[Math.min(call++, polls.length - 1)],
      })),
    );

    render(<Lobby />);

    const start = await screen.findByRole("button", { name: /start game/i });
    fireEvent.click(start);
    expect(await screen.findByText(/only 2 of 3 players have submitted/i)).toBeInTheDocument();

    // Everyone catches up on the next poll: the warning clears itself.
    await waitFor(
      () => expect(screen.queryByText(/players have submitted —/i)).not.toBeInTheDocument(),
      { timeout: 3500 },
    );

    // A new player joins on the poll after: the stale confirmation must not
    // pop back up without the host clicking Start again.
    await screen.findByText("Dan", undefined, { timeout: 3500 });
    expect(screen.queryByText(/only 3 of 4 players have submitted/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument();
  }, 15000);

  it("returns to the lobby without starting when the host keeps waiting", async () => {
    window.location.hash = "hostToken=host-tok";
    const fetchMock = mockFetch(twoOfThreeSubmitted);

    render(<Lobby />);

    const start = await screen.findByRole("button", { name: /start game/i });
    await waitFor(() => expect(start).toBeEnabled());
    fireEvent.click(start);
    fireEvent.click(await screen.findByRole("button", { name: /keep waiting/i }));

    expect(screen.queryByText(/only 2 of 3 players have submitted/i)).not.toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /start game/i })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/games/g/start", expect.anything());
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
