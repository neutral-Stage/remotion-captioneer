import { describe, expect, it } from "vitest";
import { filterProfanity } from "./profanity.js";
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

describe("filterProfanity", () => {
  it("masks flagged words by default", () => {
    const captions = data([word("what", 0, 200), word("the", 200, 350), word("fuck", 350, 700)]);
    const { captions: cleaned, matches } = filterProfanity(captions);
    expect(cleaned.segments[0]!.words[2]!.word).toBe("****");
    expect(cleaned.segments[0]!.text).toBe("what the ****");
    expect(matches).toHaveLength(1);
    // timing preserved
    expect(cleaned.segments[0]!.words[2]!.startMs).toBe(350);
  });

  it("keeps the first letter when asked", () => {
    const captions = data([word("damn", 0, 300)]);
    const { captions: cleaned } = filterProfanity(captions, { keepFirstLetter: true });
    expect(cleaned.segments[0]!.words[0]!.word).toBe("d***");
  });

  it("catches suffixed and compound forms", () => {
    const captions = data([word("fucking", 0, 400), word("shitshow", 400, 800)]);
    const { matches } = filterProfanity(captions);
    expect(matches.map((m) => m.word)).toEqual(["fucking", "shitshow"]);
  });

  it("never flags lookalike words", () => {
    const captions = data([
      word("hello", 0, 200),
      word("class", 200, 400),
      word("assessment", 400, 700),
      word("dickens", 700, 1000),
      word("shell", 1000, 1200),
    ]);
    const { matches } = filterProfanity(captions);
    expect(matches).toHaveLength(0);
  });

  it("removes words in remove mode and rebuilds text and bounds", () => {
    const captions = data([
      word("this", 100, 200),
      word("shit", 200, 400),
      word("rocks", 400, 600),
    ]);
    const { captions: cleaned, matches } = filterProfanity(captions, { mode: "remove" });
    expect(matches).toHaveLength(1);
    expect(cleaned.segments[0]!.words.map((w) => w.word)).toEqual(["this", "rocks"]);
    expect(cleaned.segments[0]!.text).toBe("this rocks");
    expect(cleaned.segments[0]!.startMs).toBe(100);
    expect(cleaned.segments[0]!.endMs).toBe(600);
  });

  it("flag mode reports without changing captions", () => {
    const captions = data([word("damn", 0, 300)]);
    const { captions: same, matches } = filterProfanity(captions, { mode: "flag" });
    expect(same).toBe(captions);
    expect(matches).toHaveLength(1);
  });

  it("respects extraWords and allowWords", () => {
    const captions = data([word("heck", 0, 200), word("damn", 200, 400)]);
    expect(filterProfanity(captions).matches).toHaveLength(1); // damn only
    expect(filterProfanity(captions, { extraWords: ["heck"] }).matches).toHaveLength(2);
    expect(filterProfanity(captions, { allowWords: ["damn"] }).matches).toHaveLength(0);
  });

  it("strips punctuation before matching but preserves it in the mask", () => {
    const captions = data([word("shit!", 0, 300)]);
    const { captions: cleaned } = filterProfanity(captions);
    expect(cleaned.segments[0]!.words[0]!.word).toBe("****!");
  });

  it("does not mutate the input", () => {
    const captions = data([word("damn", 0, 300)]);
    filterProfanity(captions);
    expect(captions.segments[0]!.words[0]!.word).toBe("damn");
  });
});
