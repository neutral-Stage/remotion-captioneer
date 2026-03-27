/**
 * AnimatedCaptions — The main component
 * Renders captions in the selected style
 */

import React from "react";
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

export const AnimatedCaptions: React.FC<CaptionComponentProps> = ({
  captions,
  style = "word-highlight",
  fontFamily,
  fontSize,
  fontColor,
  highlightColor,
  position = "bottom",
}) => {
  const Component = styleMap[style];

  if (!Component) {
    console.warn(`Unknown caption style: "${style}". Falling back to "word-highlight".`);
    return (
      <WordHighlight
        captions={captions}
        fontFamily={fontFamily}
        fontSize={fontSize}
        fontColor={fontColor}
        highlightColor={highlightColor}
        position={position}
      />
    );
  }

  return (
    <Component
      captions={captions}
      fontFamily={fontFamily}
      fontSize={fontSize}
      fontColor={fontColor}
      highlightColor={highlightColor}
      waveColor={highlightColor}
      glowColor={highlightColor}
      pillColor={highlightColor}
      flickerColor={highlightColor}
      focusColor={highlightColor}
      scaleColor={highlightColor}
      spotlightColor={highlightColor}
      fillColor={highlightColor}
      bounceColor={highlightColor}
      cursorColor={highlightColor}
      eraseColor="#FF4444"
      position={position}
    />
  );
};
