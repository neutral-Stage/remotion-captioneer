/**
 * Pacing analysis — broadcast-grade caption QA.
 *
 * Subtitle standards (EBU/BBC-derived) recommend keeping captions under
 * ~17–20 characters per second so viewers can actually read them.
 * `analyzePacing` measures each segment against that standard (and reports
 * spoken words-per-minute) so you can catch too-fast captions before
 * publishing.
 */

import type { CaptionData, CaptionSegment } from "./types.js";

export interface PacingOptions {
  /** CPS at or above which a segment is flagged "fast" (default 17) */
  fastCps?: number;
  /** CPS at or above which a segment is flagged "too-fast" (default 20) */
  maxCps?: number;
}

export type PacingStatus = "ok" | "fast" | "too-fast";

export interface SegmentPacing {
  segmentIndex: number;
  text: string;
  startMs: number;
  endMs: number;
  durationSec: number;
  charCount: number;
  /** Characters per second — the broadcast readability metric */
  cps: number;
  /** Spoken words per minute */
  wpm: number;
  wordCount: number;
  status: PacingStatus;
}

export interface PacingReport {
  segments: SegmentPacing[];
  averageCps: number;
  averageWpm: number;
  /** Number of segments at "fast" or "too-fast" */
  flaggedCount: number;
  /** 0-100 share of captioned time that is comfortable to read */
  readabilityScore: number;
}

const DEFAULTS: Required<PacingOptions> = {
  fastCps: 17,
  maxCps: 20,
};

/** Caption text as counted by subtitle CPS standards: letters, digits, spaces. */
function countCpsCharacters(text: string): number {
  return text.replace(/[^\w\s]/g, "").length;
}

function statusFor(cps: number, opts: Required<PacingOptions>): PacingStatus {
  if (cps >= opts.maxCps) return "too-fast";
  if (cps >= opts.fastCps) return "fast";
  return "ok";
}

export function analyzePacing(
  captions: CaptionData,
  options: PacingOptions = {}
): PacingReport {
  const opts = { ...DEFAULTS, ...options };

  const segments: SegmentPacing[] = captions.segments.map(
    (segment: CaptionSegment, segmentIndex) => {
      const durationMs = Math.max(1, segment.endMs - segment.startMs);
      const durationSec = durationMs / 1000;
      const charCount = countCpsCharacters(segment.text);
      const wordCount = segment.words.length;
      return {
        segmentIndex,
        text: segment.text,
        startMs: segment.startMs,
        endMs: segment.endMs,
        durationSec,
        charCount,
        cps: charCount / durationSec,
        wpm: (wordCount / durationSec) * 60,
        wordCount,
        status: statusFor(charCount / durationSec, opts),
      };
    }
  );

  const withText = segments.filter((s) => s.charCount > 0);
  const totalDuration = withText.reduce((acc, s) => acc + s.durationSec, 0);
  const totalChars = withText.reduce((acc, s) => acc + s.charCount, 0);
  const totalWords = withText.reduce((acc, s) => acc + s.wordCount, 0);

  const flagged = withText.filter((s) => s.status !== "ok");
  const flaggedDuration = flagged.reduce((acc, s) => acc + s.durationSec, 0);

  return {
    segments,
    averageCps: totalDuration > 0 ? totalChars / totalDuration : 0,
    averageWpm: totalDuration > 0 ? (totalWords / totalDuration) * 60 : 0,
    flaggedCount: flagged.length,
    readabilityScore:
      totalDuration > 0
        ? Math.round((1 - flaggedDuration / totalDuration) * 100)
        : 100,
  };
}
