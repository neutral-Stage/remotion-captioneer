import { describe, expect, it } from "vitest";
import { snapCaptionsToBeats } from "./beat-snap.js";
import type { BeatInfo } from "./audio-analysis.js";
import type { CaptionData, Word } from "../types.js";

function word(text: string, startMs: number, endMs: number, extra: Partial<Word> = {}): Word {
  return { word: text, startMs, endMs, confidence: 1, ...extra };
}

function data(words: Word[]): CaptionData {
  return {
    segments: [
      {
        text: words.map((w) => w.word).join(" "),
        startMs: words[0]!.startMs,
        endMs: words[words.length - 1]!.endMs,
        words,
      },
    ],
    language: "en",
    durationMs: 10_000,
  };
}

const beats: BeatInfo[] = [0, 500, 1000, 1500, 2000].map((timeMs) => ({
  timeMs,
  strength: 0.8,
}));

describe("snapCaptionsToBeats", () => {
  it("snaps word starts to the nearest beat within tolerance", () => {
    const captions = data([word("hello", 90, 300), word("world", 470, 700)]);
    const snapped = snapCaptionsToBeats(captions, beats);
    expect(snapped.segments[0]!.words[0]!.startMs).toBe(0);
    expect(snapped.segments[0]!.words[1]!.startMs).toBe(500);
  });

  it("keeps words beyond tolerance untouched", () => {
    const captions = data([word("far", 1330, 1500)]); // 330ms away from nearest beat
    const snapped = snapCaptionsToBeats(captions, beats);
    expect(snapped.segments[0]!.words[0]!.startMs).toBe(1330);
  });

  it("preserves durations when snapping", () => {
    const captions = data([word("hello", 90, 390), word("world", 470, 800)]);
    const snapped = snapCaptionsToBeats(captions, beats);
    expect(snapped.segments[0]!.words[0]!.endMs - snapped.segments[0]!.words[0]!.startMs).toBe(300);
    expect(snapped.segments[0]!.words[1]!.endMs - snapped.segments[0]!.words[1]!.startMs).toBe(330);
  });

  it("never lets a forward snap overlap the next word", () => {
    // "a" snaps 0 -> 100; "b" starts at 60 originally — must not stay under "a".
    const captions = data([word("a", 60, 120), word("b", 130, 400)]);
    const snapped = snapCaptionsToBeats(captions, [{ timeMs: 100, strength: 1 }]);
    const [a, b] = snapped.segments[0]!.words;
    expect(a!.startMs).toBe(100);
    expect(b!.startMs).toBeGreaterThan(a!.endMs - 1);
    expect(b!.startMs).toBeGreaterThanOrEqual(a!.endMs);
  });

  it("respects minStrength", () => {
    const captions = data([word("hello", 90, 300)]);
    const weak: BeatInfo[] = [
      { timeMs: 0, strength: 0.1 },
      { timeMs: 90, strength: 0.9 },
    ];
    const snapped = snapCaptionsToBeats(captions, weak, { minStrength: 0.5 });
    expect(snapped.segments[0]!.words[0]!.startMs).toBe(90);
  });

  it("recomputes segment bounds and preserves extra word fields", () => {
    const captions = data([word("flagged", 90, 300, { emphasis: true })]);
    const snapped = snapCaptionsToBeats(captions, beats);
    const seg = snapped.segments[0]!;
    expect(seg.words[0]!.emphasis).toBe(true);
    expect(seg.startMs).toBe(seg.words[0]!.startMs);
    expect(seg.endMs).toBe(seg.words[seg.words.length - 1]!.endMs);
  });

  it("returns the input unchanged when there are no usable beats", () => {
    const captions = data([word("hello", 90, 300)]);
    expect(snapCaptionsToBeats(captions, [])).toBe(captions);
    expect(
      snapCaptionsToBeats(captions, [{ timeMs: 0, strength: 0.2 }], { minStrength: 0.5 })
    ).toBe(captions);
  });

  it("does not mutate the input", () => {
    const captions = data([word("hello", 90, 300)]);
    snapCaptionsToBeats(captions, beats);
    expect(captions.segments[0]!.words[0]!.startMs).toBe(90);
  });
});
