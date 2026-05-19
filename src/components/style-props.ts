/**
 * Shared layout props for caption style components.
 */

import type { CaptionSegment, Word } from "../types.js";
import { getSegmentDisplayLines } from "../utils.js";

export interface CaptionStyleLayoutProps {
  maxWidth?: number;
  wordsPerLine?: number;
  useSmartWrap?: boolean;
}

export function captionBoxMaxWidth(maxWidth?: number): string {
  return maxWidth ? `${maxWidth}px` : "80%";
}

export function resolveDisplayLines(
  segment: CaptionSegment,
  layout?: CaptionStyleLayoutProps
): Word[][] {
  return getSegmentDisplayLines(segment, {
    wordsPerLine: layout?.wordsPerLine,
    useSmartWrap: layout?.useSmartWrap,
  });
}

/** Map flat word index for active-word styles */
export function flatWordIndex(
  lines: Word[][],
  lineIndex: number,
  wordIndexInLine: number
): number {
  let idx = 0;
  for (let l = 0; l < lineIndex; l++) idx += lines[l]!.length;
  return idx + wordIndexInLine;
}
