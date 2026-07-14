import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Home } from "../components/home/Home";

describe("Home", () => {
  it("renders the headline", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { name: /how personal is your personal statement/i }),
    ).toBeInTheDocument();
  });

  it("links the Host and Player to the create-game and join screens", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: /create a game/i })).toHaveAttribute("href", "/host");
    expect(screen.getByRole("link", { name: /join a game/i })).toHaveAttribute("href", "/join");
  });

  it("shows the four how-it-works steps", () => {
    render(<Home />);
    expect(screen.getByText(/how it works/i)).toBeInTheDocument();
    expect(screen.getByText("Open or join a game")).toBeInTheDocument();
    expect(screen.getByText("Submit your statement")).toBeInTheDocument();
    expect(screen.getByText("Guess who wrote it")).toBeInTheDocument();
    expect(screen.getByText("See your results")).toBeInTheDocument();
  });
});
