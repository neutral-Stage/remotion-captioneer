import { describe, expect, it } from "vitest";
import { analyzePacing } from "./pacing.js";
import type { CaptionData, Word } from "./types.js";

function word(text: string, startMs: number, endMs: number): Word {
  return { word: text, startMs, endMs, confidence: 1 };
}

function data(...segments: Array<{ text: string; words: Word[] }>): CaptionData {
  return {
    segments: segments.map((s) => ({
      text: s.text,
      startMs: s.words[0]?.startMs ?? 0,
      endMs: s.words[s.words.length - 1]?.endMs ?? 0,
      words: s.words,
    })),
    language: "en",
    durationMs: 10_000,
  };
}

describe("analyzePacing", () => {
  it("measures CPS per segment and flags too-fast captions", () => {
    // 20 chars in 1s → 20 CPS = too-fast at default max 20
    const fast = "abcdefghijklmnopqrst";
    const captions = data({
      text: fast,
      words: [word(fast, 0, 1000)],
    });
    const report = analyzePacing(captions);
    expect(report.segments[0]!.cps).toBeCloseTo(20, 5);
    expect(report.segments[0]!.status).toBe("too-fast");
    expect(report.flaggedCount).toBe(1);
    expect(report.readabilityScore).toBeLessThan(100);
  });

  it("marks comfortable captions ok", () => {
    const captions = data({
      text: "short", // 5 chars over 1s = 5 CPS
      words: [word("short", 0, 1000)],
    });
    const report = analyzePacing(captions);
    expect(report.segments[0]!.status).toBe("ok");
    expect(report.flaggedCount).toBe(0);
    expect(report.readabilityScore).toBe(100);
  });

  it("marks borderline captions fast below the max threshold", () => {
    const captions = data({
      text: "01234567890123456", // 17 chars over 1s → 17 CPS = fast
      words: [word("x", 0, 1000)],
    });
    const report = analyzePacing(captions);
    expect(report.segments[0]!.status).toBe("fast");
    expect(report.flaggedCount).toBe(1);
  });

  it("reports spoken WPM", () => {
    // 10 contiguous 500ms words over exactly 5 seconds → 120 wpm
    const words = Array.from({ length: 10 }, (_, i) => word("w", i * 500, i * 500 + 500));
    const captions = data({ text: "w ".repeat(10).trim(), words });
    const report = analyzePacing(captions);
    expect(report.averageWpm).toBeCloseTo(120, 0);
  });

  it("honors custom thresholds", () => {
    const captions = data({
      text: "0123456789012345678",
      words: [word("x", 0, 1000)],
    });
    expect(analyzePacing(captions, { maxCps: 25 }).segments[0]!.status).toBe("fast");
    expect(analyzePacing(captions, { fastCps: 10, maxCps: 15 }).segments[0]!.status).toBe(
      "too-fast"
    );
  });

  it("ignores punctuation in the CPS character count", () => {
    const captions = data({
      text: "Wow!!! Really?",
      words: [word("Wow!!!", 0, 1000), word("Really?", 1000, 2000)],
    });
    expect(analyzePacing(captions).segments[0]!.charCount).toBe(10);
  });
});
