import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JoinGame } from "./JoinGame";
import { Route } from "../../routes/join";
import { CreateGame } from "../createGame/CreateGame";

const mockedUseSearch = vi.mocked(Route.useSearch);

const navigate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock("../../routes/join", () => ({
  Route: {
    useSearch: vi.fn(() => ({
      gameId: "",
    })),
  },
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

function fillForm({ name = "Ada", gameId = "abc123", password = "secret" } = {}) {
  fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/game id/i), { target: { value: gameId } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: password } });
}

describe("JoinGame", () => {
  it("lets a player enter their name, the Game ID and the password", () => {
    mockFetch({ playerId: "p", playerToken: "t" });
    render(<JoinGame />);

    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/game id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join game/i })).toBeInTheDocument();
  });

  it("blocks submission with a validation message and no API call when a field is empty", () => {
    const fetchMock = mockFetch({});
    render(<JoinGame />);

    fireEvent.click(screen.getByRole("button", { name: /join game/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("navigates to the Submit Statement screen carrying the player token in the hash", async () => {
    mockFetch({ playerId: "pid", playerToken: "player-tok" });
    render(<JoinGame />);

    fillForm({ gameId: "abc123" });
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));

    await vi.waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        to: "/game/$gameId/submit",
        params: { gameId: "abc123" },
        hash: "playerToken=player-tok&playerId=pid",
      }),
    );
  });

  it("normalizes the Game ID to trimmed lowercase before calling the API", async () => {
    const fetchMock = mockFetch({ playerId: "pid", playerToken: "player-tok" });
    render(<JoinGame />);

    fillForm({ gameId: "  K4X2ZB " });
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));

    await vi.waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/games/k4x2zb/join", expect.anything()),
    );
  });

  it("prefills the Game ID from the URL", () => {
    mockedUseSearch.mockReturnValue({
      gameId: "ABC123",
    });

    render(<JoinGame />);

    expect(screen.getByLabelText(/game id/i)).toHaveValue("ABC123");
  });

  it("uses the Game ID in the QR code join URL", async () => {
    // Arrange
    mockFetch({
      gameId: "ABC123",
      hostToken: "host-token",
    });

    render(<CreateGame />);

    fireEvent.change(screen.getByLabelText(/game password/i), {
      target: { value: "secret" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    // Wait for the QR code image to appear
    const qrImage = await screen.findByAltText(/qr code for joining the game/i);
    expect(qrImage).toBeInTheDocument();
  });

  it("surfaces the server error when joining fails", async () => {
    mockFetch({ error: "Wrong password" }, { ok: false, status: 403 });
    render(<JoinGame />);

    fillForm({ password: "nope" });
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));

    expect(await screen.findByText(/wrong password/i)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
