import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Heading } from "./Heading";

describe("Heading", () => {
  it("receives focus when it mounts, so screen readers announce the new screen", () => {
    render(<Heading>Who wrote this?</Heading>);

    expect(screen.getByRole("heading", { name: "Who wrote this?" })).toHaveFocus();
  });

  it("refocuses when its text changes even if the element itself isn't remounted", () => {
    // Screens like CreateGame swap between two branches of the same component
    // at the same tree position — React reuses the underlying <h1> instead of
    // unmounting it, so a mount-only effect would silently never refire.
    const { rerender } = render(
      <>
        <button>elsewhere</button>
        <Heading>Create a game</Heading>
      </>,
    );
    const heading = screen.getByRole("heading", { name: "Create a game" });

    // Something else (e.g. a clicked button) steals focus before the content changes.
    screen.getByRole("button", { name: "elsewhere" }).focus();
    expect(heading).not.toHaveFocus();

    rerender(
      <>
        <button>elsewhere</button>
        <Heading>Read this out to the room</Heading>
      </>,
    );

    expect(screen.getByRole("heading", { name: "Read this out to the room" })).toHaveFocus();
  });
});
