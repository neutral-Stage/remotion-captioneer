/**
 * Core types for remotion-captioneer
 *
 * Compatible with @remotion/captions Caption type
 */

import type { Caption } from "@remotion/captions";

// Re-export official types for convenience
export type { Caption, TikTokPage } from "@remotion/captions";

/**
 * A single word with timing
 */
export interface Word {
  word: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

/**
 * A segment (group of words, typically a sentence/phrase)
 */
export interface CaptionSegment {
  text: string;
  startMs: number;
  endMs: number;
  words: Word[];
}

/**
 * Full caption data container
 */
export interface CaptionData {
  segments: CaptionSegment[];
  language: string;
  durationMs: number;
}

/**
 * Available caption animation styles
 */
export type CaptionStyle =
  | "word-highlight"
  | "karaoke"
  | "typewriter"
  | "bounce"
  | "wave"
  | "glow"
  | "typewriter-erase"
  | "pill"
  | "flicker"
  | "highlighter"
  | "blur"
  | "rainbow"
  | "scale"
  | "spotlight";

/**
 * Props for AnimatedCaptions component
 */
export interface CaptionComponentProps {
  captions: CaptionData;
  style?: CaptionStyle;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  highlightColor?: string;
  backgroundColor?: string;
  position?: "top" | "center" | "bottom";
  maxWidth?: number;
  wordsPerLine?: number;
}

/**
 * Options for whisper.cpp transcription
 */
export interface WhisperOptions {
  model?: "tiny" | "base" | "small" | "medium" | "large";
  language?: string;
  whisperPath?: string;
  modelPath?: string;
}

/**
 * Options for audio processing
 */
export interface ProcessAudioOptions extends WhisperOptions {
  outputPath?: string;
  verbose?: boolean;
}

// ─── Conversion utilities ──────────────────────────────────────────

/**
 * Convert our CaptionData to flat @remotion/captions Caption array
 */
export function toCaptionArray(captionData: CaptionData): Caption[] {
  return captionData.segments.flatMap((seg) =>
    seg.words.map((w) => ({
      text: w.word,
      startMs: w.startMs,
      endMs: w.endMs,
      timestampMs: Math.round((w.startMs + w.endMs) / 2),
      confidence: w.confidence,
    }))
  );
}

/**
 * Convert flat @remotion/captions Caption array to our CaptionData
 */
export function fromCaptionArray(
  captions: Caption[],
  language: string = "en"
): CaptionData {
  // Group into segments of ~5 words
  const CHUNK_SIZE = 5;
  const segments: CaptionSegment[] = [];

  for (let i = 0; i < captions.length; i += CHUNK_SIZE) {
    const chunk = captions.slice(i, i + CHUNK_SIZE);
    const words: Word[] = chunk.map((c) => ({
      word: c.text.trim(),
      startMs: c.startMs,
      endMs: c.endMs,
      confidence: c.confidence ?? 1.0,
    }));

    segments.push({
      text: words.map((w) => w.word).join(" "),
      startMs: words[0].startMs,
      endMs: words[words.length - 1].endMs,
      words,
    });
  }

  const durationMs =
    segments.length > 0 ? segments[segments.length - 1].endMs : 0;

  return { segments, language, durationMs };
}
