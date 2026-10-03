/**
 * Emphasis detection — find the words worth popping.
 *
 * Pro captioners manually flag the "juicy" words (stretched words, shouted
 * words) so the animation can make them land harder. These helpers do that
 * automatically from word timings alone:
 *
 * - "stretched" — spoken for far longer than the median word (slow, dragged
 *   out, or emotionally charged delivery)
 * - "caps" — transcribed in ALL CAPS (providers often capture shouting this
 *   way)
 * - "manual" — you set `word.emphasis = true` yourself
 */

import type { CaptionData, CaptionSegment, Word } from "./types.js";

export interface EmphasisOptions {
  /** Duration multiplier over the median word duration that marks a stretched word (default 1.8) */
  stretchFactor?: number;
  /** Minimum word duration (ms) before stretching counts (default 350) */
  minStretchedMs?: number;
  /** Maximum auto-detected emphasis words per segment (default 2) */
  maxPerSegment?: number;
  /** Detect ALL-CAPS words as emphasis (default true) */
  detectCaps?: boolean;
  /** Re-detect from scratch: drop existing flags instead of treating them as manual (default false) */
  clearExisting?: boolean;
}

export type EmphasisReason = "caps" | "stretched" | "manual";

export interface EmphasizedWord {
  segmentIndex: number;
  wordIndex: number;
  word: string;
  durationMs: number;
  reason: EmphasisReason;
}

const DEFAULTS: Required<EmphasisOptions> = {
  stretchFactor: 1.8,
  minStretchedMs: 350,
  maxPerSegment: 2,
  detectCaps: true,
  clearExisting: false,
};

const CAPS_MIN_LETTERS = 2;

function isCapsWord(word: string): boolean {
  const letters = word.replace(/[^A-Za-z]/g, "");
  if (letters.length < CAPS_MIN_LETTERS) return false;
  return letters === letters.toUpperCase();
}

function medianDurations(segments: CaptionSegment[]): number {
  const durations: number[] = [];
  for (const seg of segments) {
    for (const w of seg.words) {
      durations.push(Math.max(1, w.endMs - w.startMs));
    }
  }
  if (durations.length === 0) return 0;
  durations.sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  return durations.length % 2 === 0
    ? (durations[mid - 1]! + durations[mid]!) / 2
    : durations[mid]!;
}

/**
 * Find emphasis candidates in caption data. Order follows the data; within a
 * segment, capped candidates are the longest ones.
 */
export function detectEmphasis(
  captions: CaptionData,
  options: EmphasisOptions = {}
): EmphasizedWord[] {
  const opts = { ...DEFAULTS, ...options };
  const median = medianDurations(captions.segments);
  const stretchedThreshold = Math.max(
    opts.minStretchedMs,
    median > 0 ? median * opts.stretchFactor : opts.minStretchedMs
  );

  const results: EmphasizedWord[] = [];

  captions.segments.forEach((segment, segmentIndex) => {
    const candidates: EmphasizedWord[] = [];

    segment.words.forEach((w, wordIndex) => {
      const durationMs = Math.max(1, w.endMs - w.startMs);

      if (w.emphasis) {
        results.push({
          segmentIndex,
          wordIndex,
          word: w.word,
          durationMs,
          reason: "manual",
        });
        return;
      }

      const reasons: EmphasisReason[] = [];
      if (opts.detectCaps && isCapsWord(w.word)) reasons.push("caps");
      if (durationMs >= stretchedThreshold) reasons.push("stretched");
      if (reasons.length === 0) return;

      candidates.push({
        segmentIndex,
        wordIndex,
        word: w.word,
        durationMs,
        reason: reasons.includes("caps") ? "caps" : "stretched",
      });
    });

    // Keep only the longest candidates when a segment overflows the cap.
    const auto =
      candidates.length > opts.maxPerSegment
        ? [...candidates]
            .sort((a, b) => b.durationMs - a.durationMs)
            .slice(0, opts.maxPerSegment)
            .sort((a, b) => a.wordIndex - b.wordIndex)
        : candidates;

    results.push(...auto);
  });

  return results;
}

/**
 * Return a copy of `captions` with `word.emphasis` set from detection
 * (manual flags are preserved). Idempotent: previous auto flags are cleared
 * before re-detection. The input is never mutated; untouched segments are
 * shared by reference.
 */
export function markEmphasis(
  captions: CaptionData,
  options: EmphasisOptions = {}
): CaptionData {
  const opts = { ...DEFAULTS, ...options };
  const source: CaptionData = opts.clearExisting
    ? {
        ...captions,
        segments: captions.segments.map((segment) =>
          segment.words.some((w) => w.emphasis)
            ? {
                ...segment,
                words: segment.words.map((w) =>
                  w.emphasis ? { ...w, emphasis: undefined } : w
                ),
              }
            : segment
        ),
      }
    : captions;

  const detections = detectEmphasis(source, options);
  const bySegment = new Map<number, Set<number>>();
  for (const d of detections) {
    let set = bySegment.get(d.segmentIndex);
    if (!set) {
      set = new Set();
      bySegment.set(d.segmentIndex, set);
    }
    set.add(d.wordIndex);
  }

  const segments = source.segments.map((segment, segmentIndex) => {
    const hits = bySegment.get(segmentIndex);
    const needsChange = segment.words.some(
      (w, i) => Boolean(w.emphasis) !== (hits ? hits.has(i) : false)
    );
    if (!hits && !needsChange) return segment;

    const words = segment.words.map((w, i) => {
      const flag = hits ? hits.has(i) : false;
      if (Boolean(w.emphasis) === flag) return w;
      const next: Word = { ...w };
      if (flag) next.emphasis = true;
      else delete next.emphasis;
      return next;
    });
    return { ...segment, words };
  });

  return { ...captions, segments };
}
