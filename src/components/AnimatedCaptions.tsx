/**
 * AnimatedCaptions — The main component
 * Renders captions in the selected style
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionComponentProps, CaptionStyle, CaptionSegment } from "../types.js";
import { formatSpeakerLabel, speakerColorIndex } from "../providers/diarization.js";
import { WordHighlight } from "./WordHighlight.js";
import { Karaoke } from "./Karaoke.js";
import { Typewriter } from "./Typewriter.js";
import { Bounce } from "./Bounce.js";
import { Wave } from "./Wave.js";
import { Glow } from "./Glow.js";
import { TypewriterErase } from "./TypewriterErase.js";
import { Pill } from "./Pill.js";
import { Flicker } from "./Flicker.js";
import { Highlighter } from "./Highlighter.js";
import { Blur } from "./Blur.js";
import { Rainbow } from "./Rainbow.js";
import { Scale } from "./Scale.js";
import { Spotlight } from "./Spotlight.js";

const styleMap: Record<CaptionStyle, React.FC<any>> = {
  "word-highlight": WordHighlight,
  karaoke: Karaoke,
  typewriter: Typewriter,
  bounce: Bounce,
  wave: Wave,
  glow: Glow,
  "typewriter-erase": TypewriterErase,
  pill: Pill,
  flicker: Flicker,
  highlighter: Highlighter,
  blur: Blur,
  rainbow: Rainbow,
  scale: Scale,
  spotlight: Spotlight,
};

const sharedStyleProps = (
  props: CaptionComponentProps
): Record<string, unknown> => ({
  captions: props.captions,
  fontFamily: props.fontFamily,
  fontSize: props.fontSize,
  fontColor: props.fontColor,
  highlightColor: props.highlightColor,
  position: props.position,
  maxWidth: props.maxWidth,
  wordsPerLine: props.wordsPerLine,
  useSmartWrap: props.useSmartWrap,
});

const DEFAULT_SPEAKER_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#22c55e",
  "#f472b6",
  "#a78bfa",
  "#34d399",
];

function activeSegment(
  segments: CaptionSegment[],
  timeMs: number
): CaptionSegment | undefined {
  return segments.find((s) => timeMs >= s.startMs && timeMs < s.endMs);
}

const SpeakerLabel: React.FC<{
  segment: CaptionSegment;
  colors: string[];
}> = ({ segment, colors }) => {
  if (!segment.speaker) return null;
  const idx = speakerColorIndex(segment.speaker, colors.length);
  const color = colors[idx] ?? colors[0];
  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        left: 24,
        padding: "6px 12px",
        borderRadius: 8,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: 14,
        fontWeight: 500,
        color: "#fff",
        backgroundColor: color,
        opacity: 0.9,
        zIndex: 10,
      }}
    >
      {formatSpeakerLabel(segment.speaker)}
    </div>
  );
};

export const AnimatedCaptions: React.FC<CaptionComponentProps> = (props) => {
  const {
    style = "word-highlight",
    highlightColor,
    backgroundColor,
    textDirection,
    showSpeakerLabels = false,
    speakerColors = DEFAULT_SPEAKER_COLORS,
    captions,
  } = props;

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;
  const currentSeg = showSpeakerLabels ? activeSegment(captions.segments, timeMs) : undefined;

  const dirStyle: React.CSSProperties | undefined =
    textDirection && textDirection !== "auto"
      ? { direction: textDirection }
      : undefined;

  const fillStyle: React.CSSProperties = {
    ...dirStyle,
    ...(backgroundColor ? { backgroundColor } : {}),
  };

  const childProps = {
    ...sharedStyleProps(props),
    highlightColor,
    waveColor: highlightColor,
    glowColor: highlightColor,
    pillColor: highlightColor,
    flickerColor: highlightColor,
    focusColor: highlightColor,
    scaleColor: highlightColor,
    spotlightColor: highlightColor,
    fillColor: highlightColor,
    bounceColor: highlightColor,
    cursorColor: highlightColor,
    eraseColor: "#FF4444",
  };

  const Component = styleMap[style];

  if (!Component) {
    console.warn(
      `Unknown caption style: "${style}". Falling back to "word-highlight".`
    );
    return (
      <AbsoluteFill style={fillStyle}>
        <WordHighlight {...(childProps as any)} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={fillStyle}>
      {currentSeg && <SpeakerLabel segment={currentSeg} colors={speakerColors} />}
      <Component {...childProps} />
    </AbsoluteFill>
  );
};
