import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { Vote } from "./Vote";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useParams: () => ({ gameId: "g" }),
  useNavigate: () => navigate,
}));

function mockApi(
  stateBody: unknown,
  voteResponse: { ok?: boolean; status?: number; body?: unknown } = {},
) {
  const { ok = true, status = 200, body = { ok: true } } = voteResponse;
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
    { id: "b", name: "Bob" },
    { id: "c", name: "Charlie" },
  ],
  hasVoted: false,
};

const lobbyView = {
  status: "LOBBY",
  gameId: "g",
  players: [],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  window.location.hash = "";
});

describe("Vote", () => {
  it("shows the player the anonymous statement and the candidate names", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    mockApi(activeView);

    render(<Vote />);

    expect(await screen.findByText(/juggle flaming torches/i)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Bob" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Charlie" })).toBeInTheDocument();
  });

  it("disables the submit button until a candidate is selected", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    mockApi(activeView);

    render(<Vote />);

    const submit = await screen.findByRole("button", { name: /submit vote/i });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: "Bob" }));
    expect(submit).toBeEnabled();
  });

  it("casts the vote with the player token and shows the confirmation", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    const fetchMock = mockApi(activeView);

    render(<Vote />);

    fireEvent.click(await screen.findByRole("radio", { name: "Bob" }));
    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/games/g/vote",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "X-Player-Token": "player-tok" }),
          body: JSON.stringify({ nomineeId: "b" }),
        }),
      ),
    );

    expect(await screen.findByText(/your guess is locked/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit vote/i })).not.toBeInTheDocument();
  });

  it("shows the confirmation instead of the form when the polled state says the player voted", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    mockApi({ ...activeView, hasVoted: true });

    render(<Vote />);

    expect(await screen.findByText(/your guess is locked/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit vote/i })).not.toBeInTheDocument();
  });

  it("surfaces the backend feedback when the vote is rejected", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    mockApi(activeView, {
      ok: false,
      status: 409,
      body: { error: "You have already voted on this statement" },
    });

    render(<Vote />);

    fireEvent.click(await screen.findByRole("radio", { name: "Bob" }));
    fireEvent.click(screen.getByRole("button", { name: /submit vote/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You have already voted on this statement",
    );
    expect(screen.getByRole("button", { name: /submit vote/i })).toBeInTheDocument();
  });

  it("tells the player to hang on when the game is not in the voting phase", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    mockApi(lobbyView);

    render(<Vote />);

    expect(await screen.findByText(/waiting for the voting round/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit vote/i })).not.toBeInTheDocument();
  });

  it("shows the host the advance view instead of a ballot", async () => {
    window.location.hash = "hostToken=host-tok";
    mockApi(activeView);

    render(<Vote />);

    expect(await screen.findByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit vote/i })).not.toBeInTheDocument();
  });

  it("sends the player to the results when the game is FINISHED", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    mockApi({ status: "FINISHED", gameId: "g", results: [] });

    render(<Vote />);

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/game/$gameId/results",
        params: { gameId: "g" },
        hash: "playerToken=player-tok&playerId=a",
      }),
    );
  });

  it("prompts an unknown visitor to rejoin when there is no session", () => {
    window.location.hash = "";
    mockApi(activeView);

    render(<Vote />);

    expect(screen.getByRole("heading", { name: /rejoin/i })).toBeInTheDocument();
  });
});
