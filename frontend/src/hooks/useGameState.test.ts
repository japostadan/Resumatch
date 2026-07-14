import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useGameState } from "./useGameState";

// Each element is the response for the next fetch call; the last one repeats.
function mockFetchSequence(responses: { ok?: boolean; status?: number; body?: unknown }[]) {
  let call = 0;
  const fetchMock = vi.fn().mockImplementation(() => {
    const r = responses[Math.min(call, responses.length - 1)];
    call++;
    return Promise.resolve({
      ok: r.ok ?? true,
      status: r.status ?? 200,
      json: async () => r.body,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const lobby = { status: "LOBBY", gameId: "g", players: [] };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("useGameState", () => {
  it("fetches the game state on mount and clears loading", async () => {
    const fetchMock = mockFetchSequence([{ body: lobby }]);

    const { result } = renderHook(() => useGameState("g"));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.state).toEqual(lobby));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/games/g/state", { headers: {} });
  });

  it("passes the playerId as a query param when provided", async () => {
    const fetchMock = mockFetchSequence([{ body: lobby }]);

    renderHook(() => useGameState("g", "pid"));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/games/g/state?playerId=pid", { headers: {} }),
    );
  });

  it("sends the Host Token and Player Token as headers when provided", async () => {
    const fetchMock = mockFetchSequence([{ body: lobby }]);

    renderHook(() =>
      useGameState("g", undefined, { hostToken: "host-tok", playerToken: "player-tok" }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/games/g/state", {
        headers: { "X-Host-Token": "host-tok", "X-Player-Token": "player-tok" },
      }),
    );
  });

  it("polls again every 2 seconds", async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetchSequence([{ body: lobby }]);

    renderHook(() => useGameState("g"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops polling and surfaces a message when the game is gone (404)", async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetchSequence([{ body: lobby }, { ok: false, status: 404, body: {} }]);

    const { result } = renderHook(() => useGameState("g"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.error).toMatch(/expired/i);

    // No further polling after the terminal 404.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops polling once the game is FINISHED", async () => {
    vi.useFakeTimers();
    const finished = { status: "FINISHED", gameId: "g", results: [] };
    const fetchMock = mockFetchSequence([{ body: lobby }, { body: finished }]);

    const { result } = renderHook(() => useGameState("g"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.state).toEqual(finished);

    // The game is terminal — its state can never change, so no further polls.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("surfaces a transient failure but keeps polling and recovers", async () => {
    vi.useFakeTimers();
    const fetchMock = mockFetchSequence([{ ok: false, status: 500, body: {} }, { body: lobby }]);

    const { result } = renderHook(() => useGameState("g"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.error).not.toBeNull();
    expect(result.current.state).toBeNull();

    // A non-404 failure is not terminal — the next poll recovers.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.state).toEqual(lobby);
    expect(result.current.error).toBeNull();
  });
});
