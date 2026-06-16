import { describe, it, expect } from "vitest";
import {
  chunkWordsIntoSegments,
  formatSpeakerLabel,
  listSpeakers,
  speakerColorIndex,
} from "./diarization.js";

describe("chunkWordsIntoSegments", () => {
  const w = (
    text: string,
    startMs: number,
    endMs: number,
    speaker?: string
  ) => ({
    word: text,
    startMs,
    endMs,
    confidence: 1,
    speaker,
  });

  it("splits when speaker changes", () => {
    const segments = chunkWordsIntoSegments(
      [
        w("hello", 0, 100, "speaker_0"),
        w("world", 100, 200, "speaker_0"),
        w("hi", 200, 300, "speaker_1"),
      ],
      10
    );
    expect(segments).toHaveLength(2);
    expect(segments[0].speaker).toBe("speaker_0");
    expect(segments[1].speaker).toBe("speaker_1");
  });

  it("respects chunk size within same speaker", () => {
    const words = Array.from({ length: 6 }, (_, i) =>
      w(`w${i}`, i * 100, (i + 1) * 100, "A")
    );
    const segments = chunkWordsIntoSegments(words, 5);
    expect(segments).toHaveLength(2);
    expect(segments[0].words).toHaveLength(5);
    expect(segments[1].words).toHaveLength(1);
  });

  it("omits segment speaker when mixed in one chunk", () => {
    // Unlabeled word between speakers stays in one chunk (no split without prior speaker)
    const segments = chunkWordsIntoSegments(
      [w("a", 0, 50, "x"), w("b", 50, 100), w("c", 100, 150, "y")],
      10
    );
    expect(segments).toHaveLength(1);
    expect(segments[0].speaker).toBeUndefined();
  });
});

describe("formatSpeakerLabel", () => {
  it("formats speaker_N ids", () => {
    expect(formatSpeakerLabel("speaker_0")).toBe("Speaker 1");
    expect(formatSpeakerLabel("speaker_2")).toBe("Speaker 3");
  });

  it("formats letter labels", () => {
    expect(formatSpeakerLabel("A")).toBe("Speaker A");
  });
});

describe("listSpeakers", () => {
  it("returns sorted unique speakers", () => {
    expect(
      listSpeakers([
        { text: "a", startMs: 0, endMs: 1, words: [], speaker: "B" },
        { text: "b", startMs: 1, endMs: 2, words: [], speaker: "A" },
      ])
    ).toEqual(["A", "B"]);
  });
});

describe("speakerColorIndex", () => {
  it("is deterministic", () => {
    expect(speakerColorIndex("speaker_0", 6)).toBe(speakerColorIndex("speaker_0", 6));
  });
});
