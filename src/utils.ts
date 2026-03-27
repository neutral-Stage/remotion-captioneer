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

/**
 * Smart word wrapping — groups words into lines based on
 * timing gaps, punctuation, and max words per line.
 *
 * Unlike dumb chunking, this respects natural sentence breaks.
 */
export function smartWrap(
  words: Word[],
  options: {
    maxWordsPerLine?: number;
    maxGapMs?: number;
    breakOnPunctuation?: boolean;
  } = {}
): Word[][] {
  const {
    maxWordsPerLine = 6,
    maxGapMs = 800,
    breakOnPunctuation = true,
  } = options;

  const lines: Word[][] = [];
  let currentLine: Word[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = i > 0 ? words[i - 1] : null;

    // Decide if we should break
    const gapTooBig =
      prevWord && word.startMs - prevWord.endMs > maxGapMs;
    const lineTooLong = currentLine.length >= maxWordsPerLine;
    const punctuationBreak =
      breakOnPunctuation &&
      prevWord &&
      /[.!?,;:]/.test(prevWord.word.trim().slice(-1));

    if (currentLine.length > 0 && (gapTooBig || lineTooLong || punctuationBreak)) {
      lines.push(currentLine);
      currentLine = [];
    }

    currentLine.push(word);
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Estimate reading time for text (for timing animations)
 */
export function estimateReadingTimeMs(
  text: string,
  wordsPerMinute: number = 200
): number {
  const words = text.trim().split(/\s+/).length;
  return Math.round((words / wordsPerMinute) * 60 * 1000);
}

/**
 * Split long captions into pages for subtitle display
 */
export function paginateCaptions(
  captionData: CaptionData,
  options: {
    wordsPerPage?: number;
    maxDurationMs?: number;
  } = {}
): CaptionData[] {
  const { wordsPerPage = 10, maxDurationMs = 5000 } = options;

  const pages: CaptionData[] = [];
  let currentPage: CaptionSegment[] = [];
  let currentWords: Word[] = [];

  for (const segment of captionData.segments) {
    for (const word of segment.words) {
      currentWords.push(word);

      // Check if we should paginate
      const pageDuration =
        currentWords.length > 1
          ? word.endMs - currentWords[0].startMs
          : 0;

      if (
        currentWords.length >= wordsPerPage ||
        pageDuration >= maxDurationMs
      ) {
        currentPage.push({
          text: currentWords.map((w) => w.word).join(" "),
          startMs: currentWords[0].startMs,
          endMs: currentWords[currentWords.length - 1].endMs,
          words: [...currentWords],
        });

        pages.push({
          segments: currentPage,
          language: captionData.language,
          durationMs: pageDuration,
        });

        currentPage = [];
        currentWords = [];
      }
    }
  }

  // Remaining words
  if (currentWords.length > 0) {
    currentPage.push({
      text: currentWords.map((w) => w.word).join(" "),
      startMs: currentWords[0].startMs,
      endMs: currentWords[currentWords.length - 1].endMs,
      words: [...currentWords],
    });

    pages.push({
      segments: currentPage,
      language: captionData.language,
      durationMs:
        currentWords[currentWords.length - 1].endMs - currentWords[0].startMs,
    });
  }

  return pages;
}
