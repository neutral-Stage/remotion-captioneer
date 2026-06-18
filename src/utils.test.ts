import { describe, expect, it } from "vitest";
import {
  findSegmentAtTime,
  findWordIndexAtTime,
  getSegmentDisplayLines,
  groupWordsIntoLines,
  msToFrame,
  frameToMs,
} from "./utils.js";
import type { CaptionSegment } from "./types.js";

const segment: CaptionSegment = {
  text: "one two three four",
  startMs: 0,
  endMs: 4000,
  words: [
    { word: "one", startMs: 0, endMs: 1000, confidence: 1 },
    { word: "two", startMs: 1000, endMs: 2000, confidence: 1 },
    { word: "three", startMs: 2000, endMs: 3000, confidence: 1 },
    { word: "four", startMs: 3000, endMs: 4000, confidence: 1 },
  ],
};

describe("utils", () => {
  it("groupWordsIntoLines", () => {
    const lines = groupWordsIntoLines(segment.words, 2);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveLength(2);
  });

  it("getSegmentDisplayLines with wordsPerLine", () => {
    const lines = getSegmentDisplayLines(segment, { wordsPerLine: 2 });
    expect(lines).toHaveLength(2);
  });

  it("msToFrame / frameToMs", () => {
    expect(msToFrame(1000, 30)).toBe(30);
    expect(frameToMs(30, 30)).toBe(1000);
  });

  it("findSegmentAtTime uses binary search", () => {
    const segments: CaptionSegment[] = [
      { text: "a", startMs: 0, endMs: 1000, words: [] },
      { text: "b", startMs: 1000, endMs: 2000, words: [] },
      { text: "c", startMs: 2000, endMs: 3000, words: [] },
    ];
    expect(findSegmentAtTime(segments, 1500)?.text).toBe("b");
    expect(findSegmentAtTime(segments, 9999)).toBeNull();
  });

  it("findWordIndexAtTime", () => {
    expect(findWordIndexAtTime(segment.words, 1500)).toBe(1);
    expect(findWordIndexAtTime(segment.words, 50)).toBe(0);
    expect(findWordIndexAtTime(segment.words, 5000)).toBe(-1);
  });
});
