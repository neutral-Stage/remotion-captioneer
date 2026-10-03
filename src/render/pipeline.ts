/**
 * Render pipeline helpers — shared between the CLI and the render entry.
 *
 * Pure logic only: the composition metadata and prop validation used by
 * `captioneer render` live here so they can be unit tested without spinning
 * up the Remotion bundler.
 */

import type { CaptionData, CaptionStyle } from "../types.js";

/** Type alias (not interface) so Remotion's Composition accepts it as props. */
export type RenderInputProps = {
  captions: CaptionData;
  /**
   * Filename of the audio inside the bundle's public dir. The CLI copies the
   * user's audio there and the entry resolves it with `staticFile()`.
   */
  audioFile?: string;
  style?: CaptionStyle;
  preset?: string;
  highlightColor?: string;
  fontFamily?: string;
  fontSize?: number;
  position?: "top" | "center" | "bottom";
  backgroundColor?: string;
  emphasisStyle?: "scale" | "color" | "glow";
  fps?: number;
  width?: number;
  height?: number;
};

export const RENDER_COMPOSITION_ID = "CaptioneerRender";

export const DEFAULT_RENDER: {
  fps: number;
  width: number;
  height: number;
  backgroundColor: string;
  /** Tail padding so the last caption word doesn't cut off instantly */
  tailPaddingFrames: number;
} = {
  fps: 30,
  width: 1080,
  height: 1920,
  backgroundColor: "#000000",
  tailPaddingFrames: 15,
};

export interface RenderMetadata {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

/**
 * Compute composition metadata from render props. Duration is derived from
 * the caption data (plus a small tail) so the video ends when the words do.
 */
export function computeRenderMetadata(props: RenderInputProps): RenderMetadata {
  const fps = props.fps ?? DEFAULT_RENDER.fps;
  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error(`Invalid fps: ${props.fps}`);
  }
  const width = props.width ?? DEFAULT_RENDER.width;
  const height = props.height ?? DEFAULT_RENDER.height;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    throw new Error(`Invalid resolution: ${width}x${height}`);
  }
  const durationMs = Math.max(
    ...props.captions.segments.map((s) => s.endMs),
    0
  );
  const durationInFrames =
    Math.ceil((durationMs / 1000) * fps) + DEFAULT_RENDER.tailPaddingFrames;

  return { durationInFrames, fps, width, height };
}

/**
 * Validate captions for rendering: at least one segment with words, and
 * monotonic word timing (the render entry renders captions verbatim).
 */
export function assertRenderableCaptions(captions: CaptionData): void {
  const withWords = captions.segments.filter((s) => s.words.length > 0);
  if (withWords.length === 0) {
    throw new Error("Captions contain no words — nothing to render");
  }
  for (const segment of captions.segments) {
    let prevEnd = -Infinity;
    for (const word of segment.words) {
      if (word.endMs <= word.startMs) {
        throw new Error(
          `Word "${word.word}" has non-positive duration (${word.startMs}→${word.endMs}ms)`
        );
      }
      if (word.startMs < prevEnd - 1) {
        throw new Error(
          `Word "${word.word}" starts before the previous word ends — run snapCaptionsToBeats or fix the timings`
        );
      }
      prevEnd = Math.max(prevEnd, word.endMs);
    }
  }
}
