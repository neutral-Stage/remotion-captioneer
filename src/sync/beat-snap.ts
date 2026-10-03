/**
 * Beat snapping — align word timing to detected beats.
 *
 * Word pops land harder when they coincide with the music. This nudges word
 * start times to the nearest detected beat (within a tolerance) while keeping
 * durations and strict monotonic order, then recomputes segment bounds.
 */

import type { CaptionData, CaptionSegment } from "../types.js";
import type { BeatInfo } from "./audio-analysis.js";

export interface BeatSnapOptions {
  /** Max distance (ms) between a word start and a beat to snap (default 120) */
  toleranceMs?: number;
  /** Only snap to beats with `strength >= this` (default 0) */
  minStrength?: number;
}

const DEFAULTS: Required<BeatSnapOptions> = {
  toleranceMs: 120,
  minStrength: 0,
};

function nearestBeatWithin(
  timeMs: number,
  beats: BeatInfo[],
  toleranceMs: number
): number | null {
  let lo = 0;
  let hi = beats.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (beats[mid]!.timeMs < timeMs) lo = mid + 1;
    else hi = mid - 1;
  }
  // `hi` is the last beat at or before timeMs; `lo` the first after.
  let best: BeatInfo | null = null;
  let bestDistance = toleranceMs + 1;
  for (const candidate of [beats[hi], beats[lo]]) {
    if (!candidate) continue;
    const distance = Math.abs(candidate.timeMs - timeMs);
    if (distance <= toleranceMs && distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best ? best.timeMs : null;
}

/**
 * Snap word starts to beats. Pure: returns a new CaptionData, sharing
 * untouched segments by reference. Durations are preserved (ends shift with
 * starts), ordering stays strictly monotonic, and segment bounds are
 * recomputed from the words.
 */
export function snapCaptionsToBeats(
  captions: CaptionData,
  beats: BeatInfo[],
  options: BeatSnapOptions = {}
): CaptionData {
  const opts = { ...DEFAULTS, ...options };
  const usable = beats
    .filter((b) => b.strength >= opts.minStrength)
    .sort((a, b) => a.timeMs - b.timeMs);

  if (usable.length === 0) return captions;

  const segments = captions.segments.map((segment): CaptionSegment => {
    let prevEndMs = -Infinity;
    let changed = false;

    const words = segment.words.map((word) => {
      const target = nearestBeatWithin(word.startMs, usable, opts.toleranceMs);
      let startMs = target !== null ? target : word.startMs;
      // Never let a snap (or an earlier word snapping forward) create overlaps.
      startMs = Math.max(startMs, prevEndMs + 1);
      const durationMs = Math.max(1, word.endMs - word.startMs);
      const next = startMs === word.startMs ? word : { ...word, startMs, endMs: startMs + durationMs };
      prevEndMs = Math.max(next.endMs, next.startMs + 1);
      if (next !== word) changed = true;
      return next;
    });

    if (!changed) return segment;
    const startMs = words.length > 0 ? words[0]!.startMs : segment.startMs;
    const endMs =
      words.length > 0 ? words[words.length - 1]!.endMs : segment.endMs;
    return { ...segment, words, startMs, endMs };
  });

  return { ...captions, segments };
}
