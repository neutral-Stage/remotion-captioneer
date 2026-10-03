import { describe, expect, it } from "vitest";
import { detectEmphasis, markEmphasis } from "./emphasis.js";
import type { CaptionData, Word } from "./types.js";

function word(text: string, startMs: number, endMs: number, extra: Partial<Word> = {}): Word {
  return { word: text, startMs, endMs, confidence: 1, ...extra };
}

function data(...segments: Array<{ text: string; words: Word[]; speaker?: string }>): CaptionData {
  return {
    segments: segments.map((s) => ({
      text: s.text,
      startMs: s.words[0]?.startMs ?? 0,
      endMs: s.words[s.words.length - 1]?.endMs ?? 0,
      words: s.words,
      ...(s.speaker ? { speaker: s.speaker } : {}),
    })),
    language: "en",
    durationMs: 10_000,
  };
}

describe("detectEmphasis", () => {
  it("detects stretched words by duration", () => {
    const captions = data({
      text: "that was amaaazing",
      words: [
        word("that", 0, 200),
        word("was", 200, 360),
        word("amaaazing", 360, 1400), // ~8x median
      ],
    });
    const hits = detectEmphasis(captions);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ word: "amaaazing", reason: "stretched" });
  });

  it("detects ALL-CAPS words", () => {
    const captions = data({
      text: "we NEED this",
      words: [word("we", 0, 180), word("NEED", 180, 320), word("this", 320, 500)],
    });
    const hits = detectEmphasis(captions);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ word: "NEED", reason: "caps" });
  });

  it("ignores single letters like I and A", () => {
    const captions = data({
      text: "I a B",
      words: [word("I", 0, 100), word("a", 100, 200), word("B", 200, 300)],
    });
    expect(detectEmphasis(captions)).toHaveLength(0);
  });

  it("caps detections per segment, keeping the longest", () => {
    const captions = data({
      text: "one two three four five six",
      words: [
        word("one", 0, 1000), // 1000ms — longest
        word("two", 1000, 1900), // 900ms
        word("three", 1900, 2600), // 700ms — under threshold, dropped
        word("four", 2600, 2700), // 100ms
        word("five", 2700, 2800), // 100ms
        word("six", 2800, 2900), // 100ms
      ],
    });
    const hits = detectEmphasis(captions, { maxPerSegment: 2 });
    expect(hits.map((h) => h.word)).toEqual(["one", "two"]);
  });

  it("keeps manual flags and does not count them against the cap", () => {
    const captions = data({
      text: "keep this one two three",
      words: [
        word("keep", 0, 200, { emphasis: true }),
        word("this", 200, 1200), // 1000ms — longest auto candidate
        word("one", 1200, 2100), // 900ms — capped out
        word("two", 2100, 2200),
        word("three", 2200, 2300),
      ],
    });
    const hits = detectEmphasis(captions, { maxPerSegment: 1 });
    expect(hits.map((h) => h.reason)).toEqual(["manual", "stretched"]);
  });

  it("respects detectCaps: false", () => {
    const captions = data({
      text: "we NEED this",
      words: [word("we", 0, 180), word("NEED", 180, 320), word("this", 320, 500)],
    });
    expect(detectEmphasis(captions, { detectCaps: false })).toHaveLength(0);
  });
});

describe("markEmphasis", () => {
  it("sets emphasis flags without mutating the input", () => {
    const captions = data({
      text: "that was amaaazing",
      words: [word("that", 0, 200), word("was", 200, 360), word("amaaazing", 360, 1400)],
    });
    const marked = markEmphasis(captions);
    expect(marked.segments[0]!.words[2]!.emphasis).toBe(true);
    expect(captions.segments[0]!.words[2]!.emphasis).toBeUndefined();
    expect(captions).not.toBe(marked);
  });

  it("is idempotent and preserves manual flags", () => {
    const captions = data({
      text: "keep this two three",
      words: [
        word("keep", 0, 200, { emphasis: true }),
        word("this", 200, 1200), // 1000ms — stretched vs 100ms norm
        word("two", 1200, 1300),
        word("three", 1300, 1400),
      ],
    });
    const once = markEmphasis(captions);
    const twice = markEmphasis(once);
    expect(twice.segments[0]!.words.map((w) => w.emphasis)).toEqual([true, true, undefined, undefined]);
  });

  it("clears stale flags with clearExisting", () => {
    const captions = data({
      text: "plain words only",
      words: [word("plain", 0, 300, { emphasis: true }), word("words", 300, 600), word("only", 600, 800)],
    });
    // Force nothing to be detected: caps off and no stretched words.
    const marked = markEmphasis(captions, {
      detectCaps: false,
      stretchFactor: 10,
      clearExisting: true,
    });
    expect(marked.segments[0]!.words.every((w) => w.emphasis === undefined)).toBe(true);
  });
});
