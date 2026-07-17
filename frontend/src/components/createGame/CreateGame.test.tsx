import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CreateGame } from "./CreateGame";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
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

describe("CreateGame", () => {
  it("lets the host enter a password and submit", () => {
    mockFetch({ gameId: "abc123", hostToken: "t" });
    render(<CreateGame />);

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create game/i })).toBeInTheDocument();
  });

  it("focuses the heading on mount", () => {
    mockFetch({ gameId: "abc123", hostToken: "t" });
    render(<CreateGame />);

    expect(screen.getByRole("heading", { name: /create a game/i })).toHaveFocus();
  });

  it("prevents an empty-password submission with a validation message and no API call", () => {
    const fetchMock = mockFetch({});
    render(<CreateGame />);

    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    expect(screen.getByText(/enter a password/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the Game ID and password clearly on success", async () => {
    mockFetch({ gameId: "abc123", hostToken: "host-tok" });
    render(<CreateGame />);

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "swordfish" } });
    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    expect(await screen.findByText("abc123")).toBeInTheDocument();
    expect(screen.getByText("swordfish")).toBeInTheDocument();
  });

  it("moves focus to the confirmation heading once the game is created", async () => {
    mockFetch({ gameId: "abc123", hostToken: "host-tok" });
    render(<CreateGame />);

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "swordfish" } });
    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    expect(await screen.findByRole("heading", { name: /share this with the room/i })).toHaveFocus();
  });

  it("renders the Game ID in a monospace stack to avoid ambiguous glyphs", async () => {
    mockFetch({ gameId: "abc123", hostToken: "host-tok" });
    render(<CreateGame />);

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "swordfish" } });
    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    expect(await screen.findByText("abc123")).toHaveClass("font-mono");
  });

  it("stores the host token in the URL hash on success", async () => {
    mockFetch({ gameId: "abc123", hostToken: "host-tok" });
    render(<CreateGame />);

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "swordfish" } });
    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    await screen.findByText("abc123");
    expect(window.location.hash).toContain("hostToken=host-tok");
  });

  it("takes the host into the lobby, carrying the host session", async () => {
    mockFetch({ gameId: "abc123", hostToken: "host-tok" });
    render(<CreateGame />);

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "swordfish" } });
    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    await screen.findByText("abc123");
    fireEvent.click(screen.getByRole("button", { name: /lobby/i }));

    expect(navigate).toHaveBeenCalledWith({
      to: "/game/$gameId/lobby",
      params: { gameId: "abc123" },
      hash: "hostToken=host-tok",
    });
  });

  it("surfaces the server error when creation fails", async () => {
    mockFetch({ error: "A password is required" }, { ok: false, status: 400 });
    render(<CreateGame />);

    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /create game/i }));

    expect(await screen.findByText(/a password is required/i)).toBeInTheDocument();
  });
});
