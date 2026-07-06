import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGameSession, hostHash, playerHash } from "./useGameSession";

afterEach(() => {
  window.location.hash = "";
});

describe("useGameSession", () => {
  it("reads a host session from the hash", () => {
    window.location.hash = "hostToken=host-tok";

    const { result } = renderHook(() => useGameSession());

    expect(result.current.session).toEqual({ role: "host", hostToken: "host-tok" });
  });

  it("reads a player session from the hash", () => {
    window.location.hash = "playerToken=player-tok&playerId=pid";

    const { result } = renderHook(() => useGameSession());

    expect(result.current.session).toEqual({
      role: "player",
      playerToken: "player-tok",
      playerId: "pid",
    });
  });

  it("is null when the hash has no session", () => {
    const { result } = renderHook(() => useGameSession());

    expect(result.current.session).toBeNull();
  });

  it("is null when a player token is present but the playerId is missing", () => {
    window.location.hash = "playerToken=player-tok";

    const { result } = renderHook(() => useGameSession());

    expect(result.current.session).toBeNull();
  });

  it("writes a host session to the hash", () => {
    const { result } = renderHook(() => useGameSession());

    act(() => result.current.setHostSession("written-host"));

    expect(window.location.hash).toContain("hostToken=written-host");
    expect(result.current.session).toEqual({ role: "host", hostToken: "written-host" });
  });
});

describe("hash builders", () => {
  it("builds a host hash", () => {
    expect(hostHash("h")).toBe("hostToken=h");
  });

  it("builds a player hash carrying the token and playerId", () => {
    expect(playerHash("p", "id")).toBe("playerToken=p&playerId=id");
  });
});
