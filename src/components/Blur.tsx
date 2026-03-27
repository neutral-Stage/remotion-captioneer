/**
 * Blur Style
 * Words come into focus from blur as they're spoken
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex } from "../utils.js";

interface BlurProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  focusColor?: string;
  blurAmount?: number;
  position?: "top" | "center" | "bottom";
}

export const Blur: React.FC<BlurProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.4)",
  focusColor = "#FFFFFF",
  blurAmount = 8,
  position = "bottom",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  const segment = getActiveSegment(captions, currentTimeMs);
  if (!segment) return null;

  const activeWordIndex = getActiveWordIndex(segment, currentTimeMs);

  const positionStyle: React.CSSProperties = {
    top: position === "top" ? "10%" : position === "center" ? "50%" : undefined,
    bottom: position === "bottom" ? "10%" : undefined,
    transform: position === "center" ? "translateY(-50%)" : undefined,
  };

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        ...positionStyle,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px 12px",
          maxWidth: "80%",
          padding: "16px 24px",
        }}
      >
        {segment.words.map((word, i) => {
          const isActive = i === activeWordIndex;
          const isPast = i < activeWordIndex;
          const isFuture = i > activeWordIndex;

          const blur = isActive ? 0 : isPast ? 0 : blurAmount;
          const opacity = isActive ? 1 : isPast ? 0.9 : 0.3;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isActive ? focusColor : isPast ? "white" : fontColor,
                display: "inline-block",
                filter: `blur(${blur}px)`,
                opacity,
                textShadow: isActive
                  ? "0 0 20px rgba(255,255,255,0.3)"
                  : "0 2px 8px rgba(0,0,0,0.5)",
                transition: "filter 0.3s ease, opacity 0.3s ease",
              }}
            >
              {word.word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
