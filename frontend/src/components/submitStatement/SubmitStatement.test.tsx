import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SubmitStatement } from "./SubmitStatement";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useParams: () => ({ gameId: "abc123" }),
}));

function mockFetch(body: unknown, { ok = true, status = 200 } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  window.location.hash = "";
});

describe("SubmitStatement", () => {
  it("shows the statement field and submit button", () => {
    window.location.hash = "playerToken=player-tok&playerId=pid";
    mockFetch({ ok: true });
    render(<SubmitStatement />);

    expect(screen.getByLabelText(/statement/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("focuses the heading on mount", () => {
    window.location.hash = "playerToken=player-tok&playerId=pid";
    mockFetch({ ok: true });
    render(<SubmitStatement />);

    expect(screen.getByRole("heading", { name: /submit your statement/i })).toHaveFocus();
  });

  it("blocks an empty statement with a validation message and no API call", () => {
    window.location.hash = "playerToken=player-tok&playerId=pid";
    const fetchMock = mockFetch({ ok: true });
    render(<SubmitStatement />);

    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits with the player token header and navigates to the lobby on success", async () => {
    window.location.hash = "playerToken=player-tok&playerId=pid";
    const fetchMock = mockFetch({ ok: true });
    render(<SubmitStatement />);

    fireEvent.change(screen.getByLabelText(/statement/i), {
      target: { value: "I once shipped on a Friday" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/games/abc123/statement",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "X-Player-Token": "player-tok" }),
        }),
      ),
    );
    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/game/$gameId/lobby",
        params: { gameId: "abc123" },
        hash: "playerToken=player-tok&playerId=pid",
      }),
    );
  });

  it("surfaces the server error when submitting fails", async () => {
    window.location.hash = "playerToken=player-tok&playerId=pid";
    mockFetch({ error: "You have already submitted a statement" }, { ok: false, status: 409 });
    render(<SubmitStatement />);

    fireEvent.change(screen.getByLabelText(/statement/i), {
      target: { value: "second try" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(await screen.findByText(/already submitted/i)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("offers the way into voting when the game started without the player's statement", async () => {
    window.location.hash = "playerToken=player-tok&playerId=pid";
    mockFetch({ error: "Game has already started" }, { ok: false, status: 409 });
    render(<SubmitStatement />);

    fireEvent.change(screen.getByLabelText(/statement/i), {
      target: { value: "too late" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit statement/i }));

    expect(await screen.findByText(/started without your statement/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join the voting/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit statement/i })).not.toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("moves focus to the round-closed heading when the round closes without the player", async () => {
    window.location.hash = "playerToken=player-tok&playerId=pid";
    mockFetch({ error: "Game has already started" }, { ok: false, status: 409 });
    render(<SubmitStatement />);

    fireEvent.change(screen.getByLabelText(/statement/i), {
      target: { value: "too late" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit statement/i }));

    expect(
      await screen.findByRole("heading", { name: /started without your statement/i }),
    ).toHaveFocus();
  });

  it("joins the voting with the player session when the round closed without them", async () => {
    window.location.hash = "playerToken=player-tok&playerId=pid";
    mockFetch({ error: "Game has already started" }, { ok: false, status: 409 });
    render(<SubmitStatement />);

    fireEvent.change(screen.getByLabelText(/statement/i), {
      target: { value: "too late" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit statement/i }));
    fireEvent.click(await screen.findByRole("button", { name: /join the voting/i }));

    expect(navigate).toHaveBeenCalledWith({
      to: "/game/$gameId/vote",
      params: { gameId: "abc123" },
      hash: "playerToken=player-tok&playerId=pid",
    });
  });

  it("blocks submission with a session message and no API call when the token is missing", () => {
    window.location.hash = "";
    const fetchMock = mockFetch({ ok: true });
    render(<SubmitStatement />);

    fireEvent.change(screen.getByLabelText(/statement/i), {
      target: { value: "I once shipped on a Friday" },
    });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/session has expired/i);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
