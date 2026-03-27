/**
 * Caption Exporters
 *
 * Convert CaptionData to standard subtitle formats:
 * - SRT (SubRip)
 * - VTT (WebVTT)
 * - ASS (Advanced SubStation Alpha)
 * - Plain text
 */

import type { CaptionData } from "./types.js";

// ─── Time Formatting ─────────────────────────────────────────────

function msToSrtTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(millis, 3)}`;
}

function msToVttTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millis, 3)}`;
}

function msToAssTime(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  return `${pad(hours, 1)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(centis, 2)}`;
}

function pad(n: number, width: number): string {
  const s = String(n);
  return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

// ─── Exporters ────────────────────────────────────────────────────

/**
 * Export to SRT format
 */
export function toSRT(captionData: CaptionData): string {
  return captionData.segments
    .map((seg, i) => {
      const start = msToSrtTime(seg.startMs);
      const end = msToSrtTime(seg.endMs);
      return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");
}

/**
 * Export to WebVTT format
 */
export function toVTT(captionData: CaptionData): string {
  const header = "WEBVTT\n\n";
  const cues = captionData.segments
    .map((seg, i) => {
      const start = msToVttTime(seg.startMs);
      const end = msToVttTime(seg.endMs);
      return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");
  return header + cues;
}

/**
 * Export to ASS (Advanced SubStation Alpha) format
 */
export function toASS(
  captionData: CaptionData,
  options: {
    title?: string;
    fontName?: string;
    fontSize?: number;
    primaryColor?: string;
    outlineColor?: string;
  } = {}
): string {
  const {
    title = "remotion-captioneer",
    fontName = "Arial",
    fontSize = 48,
    primaryColor = "&H00FFFFFF",
    outlineColor = "&H00000000",
  } = options;

  const header = `[Script Info]
Title: ${title}
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H000000FF,${outlineColor},&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

  const events = captionData.segments
    .map((seg) => {
      const start = msToAssTime(seg.startMs);
      const end = msToAssTime(seg.endMs);
      // ASS uses \N for line breaks
      const text = seg.text.replace(/\n/g, "\\N");
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
    })
    .join("\n");

  return header + events;
}

/**
 * Export to plain text (one line per segment)
 */
export function toPlainText(captionData: CaptionData): string {
  return captionData.segments.map((seg) => seg.text).join("\n");
}

/**
 * Export to JSON (clean format for further processing)
 */
export function toJSON(captionData: CaptionData): string {
  return JSON.stringify(captionData, null, 2);
}

// ─── Word-Level Exports ──────────────────────────────────────────

/**
 * Export word-level timestamps (for custom processing)
 */
export function toWordLevelSRT(captionData: CaptionData): string {
  let index = 1;
  const lines: string[] = [];

  for (const seg of captionData.segments) {
    for (const word of seg.words) {
      const start = msToSrtTime(word.startMs);
      const end = msToSrtTime(word.endMs);
      lines.push(`${index}\n${start} --> ${end}\n${word.word.trim()}\n`);
      index++;
    }
  }

  return lines.join("\n");
}

/**
 * Export word-level WebVTT
 */
export function toWordLevelVTT(captionData: CaptionData): string {
  const header = "WEBVTT\n\n";
  let index = 1;
  const cues: string[] = [];

  for (const seg of captionData.segments) {
    for (const word of seg.words) {
      const start = msToVttTime(word.startMs);
      const end = msToVttTime(word.endMs);
      cues.push(`${index}\n${start} --> ${end}\n${word.word.trim()}\n`);
      index++;
    }
  }

  return header + cues.join("\n");
}
