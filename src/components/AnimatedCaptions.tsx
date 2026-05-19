/**
 * AnimatedCaptions — The main component
 * Renders captions in the selected style
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import type { CaptionComponentProps, CaptionStyle } from "../types.js";
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

export const AnimatedCaptions: React.FC<CaptionComponentProps> = (props) => {
  const {
    style = "word-highlight",
    highlightColor,
    backgroundColor,
    textDirection,
  } = props;

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
      <Component {...childProps} />
    </AbsoluteFill>
  );
};
