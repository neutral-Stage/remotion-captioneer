import { describe, expect, it } from "vitest";
import { filterFillers } from "./fillers.js";
import type { CaptionData, Word } from "./types.js";

function word(text: string, startMs: number, endMs: number): Word {
  return { word: text, startMs, endMs, confidence: 1 };
}

function data(words: Word[]): CaptionData {
  return {
    segments: [
      {
        text: words.map((w) => w.word).join(" "),
        startMs: words[0]?.startMs ?? 0,
        endMs: words[words.length - 1]?.endMs ?? 0,
        words,
      },
    ],
    language: "en",
    durationMs: 5000,
  };
}

describe("filterFillers", () => {
  it("removes hesitation sounds and rebuilds text", () => {
    const captions = data([
      word("so", 0, 200),
      word("um", 200, 600),
      word("we", 600, 800),
      word("shipped", 800, 1200),
    ]);
    const { captions: tightened, matches } = filterFillers(captions);
    expect(tightened.segments[0]!.words.map((w) => w.word)).toEqual(["so", "we", "shipped"]);
    expect(tightened.segments[0]!.text).toBe("so we shipped");
    expect(matches).toHaveLength(1);
    expect(matches[0]!.durationMs).toBe(400);
  });

  it("matches multi-word phrases like 'you know'", () => {
    const captions = data([
      word("this", 0, 200),
      word("you", 200, 350),
      word("know", 350, 520),
      word("works", 520, 800),
    ]);
    const { captions: tightened, matches } = filterFillers(captions);
    expect(tightened.segments[0]!.words.map((w) => w.word)).toEqual(["this", "works"]);
    expect(matches[0]!.words).toEqual(["you", "know"]);
  });

  it("never removes 'like' by default", () => {
    const captions = data([word("i", 0, 100), word("like", 100, 300), word("pizza", 300, 700)]);
    const { matches } = filterFillers(captions);
    expect(matches).toHaveLength(0);
  });

  it("supports extraFillers for opt-in words", () => {
    const captions = data([word("i", 0, 100), word("like", 100, 300), word("pizza", 300, 700)]);
    const { matches } = filterFillers(captions, { extraFillers: ["like"] });
    expect(matches).toHaveLength(1);
  });

  it("closes timing gaps by shifting following words earlier", () => {
    const captions = data([
      word("so", 0, 200),
      word("um", 200, 600),
      word("we", 600, 800),
    ]);
    const { captions: tightened } = filterFillers(captions);
    const { words } = tightened.segments[0]!;
    // 600 - 400 shift, clamped to at least 1ms after the previous word
    expect(words[1]!.startMs).toBe(201);
    expect(words[1]!.endMs).toBe(400);
    expect(tightened.segments[0]!.startMs).toBe(0);
    expect(tightened.segments[0]!.endMs).toBe(400);
  });

  it("keeps original timing with closeGaps: false", () => {
    const captions = data([word("so", 0, 200), word("um", 200, 600), word("we", 600, 800)]);
    const { captions: tightened } = filterFillers(captions, { closeGaps: false });
    expect(tightened.segments[0]!.words[1]!.startMs).toBe(600);
  });

  it("report mode does not change captions", () => {
    const captions = data([word("um", 0, 300)]);
    const { captions: same, matches } = filterFillers(captions, { remove: false });
    expect(same).toBe(captions);
    expect(matches).toHaveLength(1);
  });

  it("keepFillers overrides the defaults", () => {
    const captions = data([word("you", 0, 200), word("know", 200, 400), word("hi", 400, 600)]);
    const { matches } = filterFillers(captions, { keepFillers: ["you know"] });
    expect(matches).toHaveLength(0);
  });

  it("does not mutate the input", () => {
    const captions = data([word("um", 0, 300), word("hi", 300, 600)]);
    filterFillers(captions);
    expect(captions.segments[0]!.words).toHaveLength(2);
  });
});
