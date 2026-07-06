import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { Lobby } from "./Lobby";

vi.mock("@tanstack/react-router", () => ({
  useParams: () => ({ gameId: "g" }),
  useNavigate: () => vi.fn(),
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
});
