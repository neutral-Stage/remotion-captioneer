/**
 * Flicker Style
 * Words flicker in like a neon sign turning on
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex } from "../utils.js";

interface FlickerProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  flickerColor?: string;
  position?: "top" | "center" | "bottom";
}

export const Flicker: React.FC<FlickerProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.25)",
  flickerColor = "#FF9500",
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

          // Flicker effect: rapidly toggle opacity for active word
          let opacity = isPast ? 1 : isActive ? 0.4 : 0.25;
          if (isActive) {
            // Flicker pattern: on-off-on-on-off-on
            const flickerFrame = frame % 8;
            opacity = [1, 0.2, 1, 1, 0.3, 1, 1, 0.2][flickerFrame];
          }

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isActive ? flickerColor : isPast ? "white" : fontColor,
                display: "inline-block",
                opacity,
                textShadow: isActive
                  ? `0 0 10px ${flickerColor}, 0 0 20px ${flickerColor}60`
                  : isPast
                  ? "0 2px 8px rgba(0,0,0,0.5)"
                  : "none",
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
