/**
 * Core types for remotion-captioneer
 */

export interface Word {
  word: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

export interface CaptionSegment {
  text: string;
  startMs: number;
  endMs: number;
  words: Word[];
}

export interface CaptionData {
  segments: CaptionSegment[];
  language: string;
  durationMs: number;
}

export type CaptionStyle =
  | "word-highlight"
  | "karaoke"
  | "typewriter"
  | "bounce";

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

export interface WhisperOptions {
  model?: "tiny" | "base" | "small" | "medium" | "large";
  language?: string;
  whisperPath?: string;
  modelPath?: string;
}

export interface ProcessAudioOptions extends WhisperOptions {
  outputPath?: string;
  verbose?: boolean;
}
