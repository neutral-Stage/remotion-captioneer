/**
 * CaptionShowcase — Showcases a caption style over a dark background
 */

import React from "react";
import { AbsoluteFill, Audio } from "remotion";
import type { CaptionData, CaptionStyle } from "../types.js";
import { AnimatedCaptions } from "../components/AnimatedCaptions.js";

import { STYLE_HIGHLIGHT } from "./style-highlights.js";

interface CaptionShowcaseProps {
  readonly captions: CaptionData;
  readonly style: CaptionStyle;
  readonly audioSrc?: string;
}

const STYLE_HIGHLIGHT_LEGACY = STYLE_HIGHLIGHT;

export const CaptionShowcase: React.FC<CaptionShowcaseProps> = ({
  captions,
  style,
  audioSrc,
}) => {
  const highlight = STYLE_HIGHLIGHT_LEGACY[style];

  return (
    <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
      {audioSrc && <Audio src={audioSrc} />}

      <AnimatedCaptions
        captions={captions}
        style={style}
        position="bottom"
        highlightColor={highlight}
      />

      <div
        style={{
          position: "absolute",
          top: 32,
          left: 32,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          fontSize: 13,
          fontWeight: 500,
          color: "rgba(255, 255, 255, 0.35)",
          letterSpacing: "0.02em",
        }}
      >
        {style.replace(/-/g, " ")}
      </div>
    </AbsoluteFill>
  );
};
