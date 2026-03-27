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

const styleMap: Record<CaptionStyle, React.FC<any>> = {
  "word-highlight": WordHighlight,
  karaoke: Karaoke,
  typewriter: Typewriter,
  bounce: Bounce,
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

  return (
    <Component
      captions={captions}
      fontFamily={fontFamily}
      fontSize={fontSize}
      fontColor={fontColor}
      highlightColor={highlightColor}
      fillColor={highlightColor}
      bounceColor={highlightColor}
      cursorColor={highlightColor}
      position={position}
    />
  );
};
