/**
 * Spotlight Style
 * Active word has a radial gradient spotlight behind it
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex } from "../utils.js";

interface SpotlightProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  spotlightColor?: string;
  position?: "top" | "center" | "bottom";
}

export const Spotlight: React.FC<SpotlightProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.3)",
  spotlightColor = "#FBBF24",
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
          gap: "8px 14px",
          maxWidth: "80%",
          padding: "16px 24px",
        }}
      >
        {segment.words.map((word, i) => {
          const isActive = i === activeWordIndex;
          const isPast = i < activeWordIndex;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isActive ? "#000" : isPast ? "white" : fontColor,
                display: "inline-block",
                backgroundColor: isActive ? spotlightColor : "transparent",
                backgroundImage: isActive
                  ? `radial-gradient(ellipse at center, ${spotlightColor} 0%, ${spotlightColor}CC 40%, ${spotlightColor}40 70%, transparent 100%)`
                  : "none",
                padding: isActive ? "4px 16px" : "0",
                borderRadius: isActive ? "8px" : "0",
                textShadow: isActive ? "none" : "0 2px 8px rgba(0,0,0,0.5)",
                boxShadow: isActive
                  ? `0 0 30px ${spotlightColor}80, 0 0 60px ${spotlightColor}40`
                  : "none",
                transition: "all 0.2s ease",
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
