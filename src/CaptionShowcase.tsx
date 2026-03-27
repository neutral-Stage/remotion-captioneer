/**
 * CaptionShowcase — Showcases a caption style over a dark background
 * This is the composition that renders during preview/render
 */

import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import type { CaptionData, CaptionStyle } from "./types.js";
import { AnimatedCaptions } from "./components/AnimatedCaptions.js";

interface CaptionShowcaseProps {
  captions: CaptionData;
  style: CaptionStyle;
  audioSrc?: string;
}

export const CaptionShowcase: React.FC<CaptionShowcaseProps> = ({
  captions,
  style,
  audioSrc,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
      }}
    >
      {/* Optional audio track */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* Subtle animated background */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
        }}
      />

      {/* Caption overlay */}
      <AnimatedCaptions
        captions={captions}
        style={style}
        position="bottom"
        highlightColor={
          style === "karaoke"
            ? "#FF6B6B"
            : style === "typewriter"
            ? "#00FF88"
            : style === "bounce"
            ? "#FF4081"
            : "#FFD700"
        }
      />

      {/* Style label */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          fontFamily: "Inter, sans-serif",
          fontSize: 24,
          fontWeight: 600,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {style.replace("-", " ")}
      </div>
    </AbsoluteFill>
  );
};
