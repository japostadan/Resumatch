import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { PlayerVoteView } from "./PlayerVoteView";
import { useVoting } from "../../hooks/useVoting";

vi.mock("../../hooks/useVoting");

const mockUseVoting = vi.mocked(useVoting);

describe("PlayerVoteView", () => {
  const gameId = "test-game-123";
  const playerId = "player-1";

  beforeEach(() => {
    mockUseVoting.mockClear();
  });

  it("shows anonymous statement and candidate names with own name excluded", () => {
    mockUseVoting.mockReturnValue({
      statement: "I love pineapple on pizza",
      candidates: [
        { id: "player-2", name: "Bob" },
        { id: "player-3", name: "Charlie" },
      ],
      hasVoted: false,
      isActive: true,
      submitVote: vi.fn().mockResolvedValue(undefined),
      voteStatus: "idle" as const,
      voteError: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<PlayerVoteView gameId={gameId} playerId={playerId} />);

    expect(screen.getByTestId("anonymous-statement")).toHaveTextContent(
      "I love pineapple on pizza",
    );
    expect(screen.getByTestId("candidate-player-2")).toBeInTheDocument();
    expect(screen.getByTestId("candidate-player-3")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByTestId("vote-form")).toBeInTheDocument();
  });

  it("hides vote form and shows confirmation after voting", () => {
    mockUseVoting.mockReturnValue({
      statement: "I love pineapple on pizza",
      candidates: [{ id: "player-2", name: "Bob" }],
      hasVoted: true,
      isActive: true,
      submitVote: vi.fn(),
      voteStatus: "success" as const,
      voteError: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<PlayerVoteView gameId={gameId} playerId={playerId} />);

    expect(screen.getByTestId("vote-confirmation")).toBeInTheDocument();
    expect(screen.getByText("Vote Submitted!")).toBeInTheDocument();
    expect(screen.queryByTestId("vote-form")).not.toBeInTheDocument();
  });

  it("casts one vote when form is submitted", async () => {
    const submitVote = vi.fn().mockResolvedValue(undefined);

    mockUseVoting.mockReturnValue({
      statement: "I love pineapple on pizza",
      candidates: [
        { id: "player-2", name: "Bob" },
        { id: "player-3", name: "Charlie" },
      ],
      hasVoted: false,
      isActive: true,
      submitVote,
      voteStatus: "idle" as const,
      voteError: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<PlayerVoteView gameId={gameId} playerId={playerId} />);

    const bobRadio = screen.getByTestId("candidate-player-2");
    fireEvent.click(bobRadio);

    const submitButton = screen.getByTestId("submit-vote");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitVote).toHaveBeenCalledTimes(1);
      expect(submitVote).toHaveBeenCalledWith("player-2");
    });
  });

  it("shows loading state while submitting", () => {
    mockUseVoting.mockReturnValue({
      statement: "I love pineapple on pizza",
      candidates: [{ id: "player-2", name: "Bob" }],
      hasVoted: false,
      isActive: true,
      submitVote: vi.fn(),
      voteStatus: "loading" as const,
      voteError: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<PlayerVoteView gameId={gameId} playerId={playerId} />);

    expect(screen.getByTestId("submit-vote")).toHaveTextContent("Submitting...");
    expect(screen.getByTestId("submit-vote")).toBeDisabled();
  });

  it("displays error message when vote fails", () => {
    mockUseVoting.mockReturnValue({
      statement: "I love pineapple on pizza",
      candidates: [{ id: "player-2", name: "Bob" }],
      hasVoted: false,
      isActive: true,
      submitVote: vi.fn(),
      voteStatus: "error" as const,
      voteError: "You have already voted on this statement",
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<PlayerVoteView gameId={gameId} playerId={playerId} />);

    expect(screen.getByTestId("vote-error")).toHaveTextContent(
      "You have already voted on this statement",
    );
  });

  it("shows phase message when not in ACTIVE phase", () => {
    mockUseVoting.mockReturnValue({
      statement: null,
      candidates: [],
      hasVoted: false,
      isActive: false,
      submitVote: vi.fn(),
      voteStatus: "idle" as const,
      voteError: null,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<PlayerVoteView gameId={gameId} playerId={playerId} />);

    expect(screen.getByText("Waiting for the voting round to begin...")).toBeInTheDocument();
    expect(screen.queryByTestId("vote-form")).not.toBeInTheDocument();
  });

  it("shows loading state while fetching game state", () => {
    mockUseVoting.mockReturnValue({
      statement: null,
      candidates: [],
      hasVoted: false,
      isActive: true,
      submitVote: vi.fn(),
      voteStatus: "idle" as const,
      voteError: null,
      isLoading: true,
      error: null,
      refresh: vi.fn(),
    });

    render(<PlayerVoteView gameId={gameId} playerId={playerId} />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error when game state fetch fails", () => {
    mockUseVoting.mockReturnValue({
      statement: null,
      candidates: [],
      hasVoted: false,
      isActive: true,
      submitVote: vi.fn(),
      voteStatus: "idle" as const,
      voteError: null,
      isLoading: false,
      error: "Failed to connect to server",
      refresh: vi.fn(),
    });

    render(<PlayerVoteView gameId={gameId} playerId={playerId} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to connect to server");
  });
});
