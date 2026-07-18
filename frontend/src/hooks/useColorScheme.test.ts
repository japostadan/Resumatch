import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColorScheme } from "./useColorScheme";

afterEach(() => {
  window.localStorage.clear();
  delete document.documentElement.dataset.theme;
});

describe("useColorScheme", () => {
  it("defaults to dark when nothing is stored", () => {
    const { result } = renderHook(() => useColorScheme());

    expect(result.current.scheme).toBe("dark");
  });

  it("reads a stored light preference", () => {
    window.localStorage.setItem("resumatch-theme", "light");

    const { result } = renderHook(() => useColorScheme());

    expect(result.current.scheme).toBe("light");
  });

  it("ignores an invalid stored value and defaults to dark", () => {
    window.localStorage.setItem("resumatch-theme", "sepia");

    const { result } = renderHook(() => useColorScheme());

    expect(result.current.scheme).toBe("dark");
  });

  it("sets data-theme on the document element to match the scheme", () => {
    renderHook(() => useColorScheme());

    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("toggling flips dark to light, updates the document, and persists it", () => {
    const { result } = renderHook(() => useColorScheme());

    act(() => result.current.toggleScheme());

    expect(result.current.scheme).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("resumatch-theme")).toBe("light");
  });

  it("toggling twice returns to dark", () => {
    const { result } = renderHook(() => useColorScheme());

    act(() => result.current.toggleScheme());
    act(() => result.current.toggleScheme());

    expect(result.current.scheme).toBe("dark");
    expect(window.localStorage.getItem("resumatch-theme")).toBe("dark");
  });
});
