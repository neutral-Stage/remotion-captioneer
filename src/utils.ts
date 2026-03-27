/**
 * Utility functions for caption rendering
 */

import type { CaptionData, Word, CaptionSegment } from "./types.js";

/**
 * Get the currently active segment at a given time
 */
export function getActiveSegment(
  captions: CaptionData,
  currentTimeMs: number
): CaptionSegment | null {
  return (
    captions.segments.find(
      (seg) => currentTimeMs >= seg.startMs && currentTimeMs <= seg.endMs
    ) ?? null
  );
}

/**
 * Get the currently active word at a given time
 */
export function getActiveWord(
  segment: CaptionSegment,
  currentTimeMs: number
): Word | null {
  return (
    segment.words.find(
      (w) => currentTimeMs >= w.startMs && currentTimeMs <= w.endMs
    ) ?? null
  );
}

/**
 * Get the index of the currently active word
 */
export function getActiveWordIndex(
  segment: CaptionSegment,
  currentTimeMs: number
): number {
  return segment.words.findIndex(
    (w) => currentTimeMs >= w.startMs && currentTimeMs <= w.endMs
  );
}

/**
 * Calculate animation progress for a word (0-1)
 */
export function getWordProgress(
  word: Word,
  currentTimeMs: number
): number {
  if (currentTimeMs < word.startMs) return 0;
  if (currentTimeMs > word.endMs) return 1;
  return (currentTimeMs - word.startMs) / (word.endMs - word.startMs);
}

/**
 * Group words into lines based on wordsPerLine
 */
export function groupWordsIntoLines(
  words: Word[],
  wordsPerLine: number = 5
): Word[][] {
  const lines: Word[][] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine));
  }
  return lines;
}

/**
 * Convert milliseconds to Remotion frame number
 */
export function msToFrame(ms: number, fps: number): number {
  return Math.round((ms / 1000) * fps);
}

/**
 * Convert Remotion frame number to milliseconds
 */
export function frameToMs(frame: number, fps: number): number {
  return (frame / fps) * 1000;
}
