/// <reference types="node" />
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Without a declared icon the browser falls back to requesting /favicon.ico,
// which 404s in dev and gets index.html from the SPA fallback in prod (#58).
describe("favicon", () => {
  // Vitest pins process.cwd() to the project root (frontend/).
  const frontendRoot = process.cwd();
  const html = readFileSync(path.join(frontendRoot, "index.html"), "utf8");

  it("declares an icon in index.html", () => {
    expect(html).toMatch(/<link[^>]*rel="icon"/);
  });

  it("ships the referenced icon file in public/", () => {
    const href = html.match(/<link[^>]*rel="icon"[^>]*href="([^"]+)"/)?.[1];
    expect(href).toBeDefined();
    expect(existsSync(path.join(frontendRoot, "public", href!))).toBe(true);
  });
});
