import { describe, expect, it } from "vitest";
import { resolveDefaultStyle } from "./config.js";

describe("resolveDefaultStyle", () => {
  it("returns word-highlight when config is null", () => {
    expect(resolveDefaultStyle(null)).toBe("word-highlight");
  });

  it("returns configured style when valid", () => {
    expect(resolveDefaultStyle({ defaultStyle: "karaoke" })).toBe("karaoke");
  });

  it("falls back for unknown style", () => {
    expect(resolveDefaultStyle({ defaultStyle: "not-a-style" })).toBe("word-highlight");
  });
});
