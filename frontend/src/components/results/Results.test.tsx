import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Results } from "./Results";

const navigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useParams: () => ({ gameId: "g" }),
  useNavigate: () => navigate,
}));

function mockFetch(stateBody: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue({ ok: true, status: 200, json: async () => stateBody });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// Results arrive already ranked by the backend, most distinctive first.
const finishedView = {
  status: "FINISHED",
  gameId: "g",
  results: [
    {
      playerId: "a",
      name: "Ada",
      statement: "I built a robot that sorts my socks",
      correctVotes: 2,
      totalVotes: 2,
      verdict: "Distinctive",
    },
    {
      playerId: "b",
      name: "Bea",
      statement: "I am a hard-working team player",
      correctVotes: 0,
      totalVotes: 2,
      verdict: "Generic",
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  window.location.hash = "";
});

describe("Results", () => {
  it("shows the host every statement with its author, tally, and verdict", async () => {
    window.location.hash = "hostToken=host-tok";
    mockFetch(finishedView);

    render(<Results />);

    expect(await screen.findByText(/sorts my socks/i)).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByText("2/2")).toBeInTheDocument();
    expect(screen.getByText("Distinctive")).toBeInTheDocument();
    expect(screen.getByText(/hard-working team player/i)).toBeInTheDocument();
    expect(screen.getByText("Bea")).toBeInTheDocument();
    expect(screen.getByText("0/2")).toBeInTheDocument();
    expect(screen.getByText("Generic")).toBeInTheDocument();
  });

  it("keeps the backend's ranking, which orders by share rather than raw count", async () => {
    window.location.hash = "hostToken=host-tok";
    // 1-of-1 (100%) outranks 2-of-3 (67%) even though its raw count is lower.
    mockFetch({
      ...finishedView,
      results: [
        { ...finishedView.results[0], correctVotes: 1, totalVotes: 1 },
        { ...finishedView.results[1], correctVotes: 2, totalVotes: 3, verdict: "Distinctive" },
      ],
    });

    render(<Results />);

    await screen.findByText("Ada");
    const names = screen.getAllByText(/^(Ada|Bea)$/).map((el) => el.textContent);
    expect(names).toEqual(["Ada", "Bea"]);
  });

  it("shows an empty share bar for a statement nobody voted on", async () => {
    window.location.hash = "hostToken=host-tok";
    mockFetch({
      ...finishedView,
      results: [
        finishedView.results[0],
        { ...finishedView.results[1], correctVotes: 0, totalVotes: 0 },
      ],
    });

    render(<Results />);

    await screen.findByText("Ada");
    expect(screen.getByText("0/0")).toBeInTheDocument();
    const bars = screen.getAllByRole<HTMLProgressElement>("progressbar");
    expect(bars[0].position).toBe(1);
    expect(bars[1].position).toBe(0);
  });

  it("styles verdict badges with the reserved palette — Distinctive green, Generic red", async () => {
    window.location.hash = "hostToken=host-tok";
    mockFetch(finishedView);

    render(<Results />);

    expect(await screen.findByText("Distinctive")).toHaveClass("bg-distinctive");
    expect(screen.getByText("Generic")).toHaveClass("bg-generic");
  });

  it("does not show a player the full reveal", async () => {
    window.location.hash = "playerToken=player-tok&playerId=a";
    mockFetch(finishedView);

    render(<Results />);

    expect(await screen.findByText(/the game has finished/i)).toBeInTheDocument();
    expect(screen.queryByText(/sorts my socks/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hard-working team player/i)).not.toBeInTheDocument();
  });

  it("prompts an unknown visitor to rejoin when there is no session", () => {
    window.location.hash = "";
    mockFetch(finishedView);

    render(<Results />);

    expect(screen.getByRole("heading", { name: /rejoin/i })).toBeInTheDocument();
  });
});
