/**
 * Highlighter Style
 * Active word has a highlighter/marker background behind it
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex } from "../utils.js";

interface HighlighterProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  highlightColor?: string;
  highlightOpacity?: number;
  position?: "top" | "center" | "bottom";
}

export const Highlighter: React.FC<HighlighterProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.4)",
  highlightColor = "#FFEB3B",
  highlightOpacity = 0.7,
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

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isActive ? "#000" : isPast ? "white" : fontColor,
                display: "inline-block",
                backgroundColor: isActive
                  ? `${highlightColor}${Math.round(highlightOpacity * 255).toString(16).padStart(2, "0")}`
                  : "transparent",
                padding: isActive ? "2px 8px" : "0",
                borderRadius: "4px",
                transform: isActive ? "rotate(-1deg)" : "none",
                textShadow: isActive ? "none" : "0 2px 8px rgba(0,0,0,0.5)",
                transition: "all 0.15s ease",
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
