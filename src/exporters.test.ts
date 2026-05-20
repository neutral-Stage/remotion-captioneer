import { describe, expect, it } from "vitest";
import { toSRT, toVTT, toPlainText } from "./exporters.js";
import type { CaptionData } from "./types.js";

const sample: CaptionData = {
  language: "en",
  durationMs: 2000,
  segments: [
    {
      text: "Hello world",
      startMs: 0,
      endMs: 2000,
      words: [
        { word: "Hello", startMs: 0, endMs: 1000, confidence: 1 },
        { word: "world", startMs: 1000, endMs: 2000, confidence: 1 },
      ],
    },
  ],
};

describe("exporters", () => {
  it("toSRT contains cue", () => {
    const srt = toSRT(sample);
    expect(srt).toContain("Hello world");
    expect(srt).toMatch(/00:00:00/);
  });

  it("toVTT has WEBVTT header", () => {
    expect(toVTT(sample)).toContain("WEBVTT");
  });

  it("toPlainText", () => {
    expect(toPlainText(sample).trim()).toBe("Hello world");
  });
});
