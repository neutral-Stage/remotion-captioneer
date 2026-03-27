/**
 * Word Highlight Style
 * Each word lights up individually as it's spoken
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex } from "../utils.js";

interface WordHighlightProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  highlightColor?: string;
  position?: "top" | "center" | "bottom";
}

export const WordHighlight: React.FC<WordHighlightProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.5)",
  highlightColor = "#FFD700",
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

          const scale = isActive
            ? spring({
                frame,
                fps,
                config: { damping: 10, stiffness: 200 },
              })
            : 1;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isActive ? highlightColor : isPast ? "white" : fontColor,
                transform: `scale(${scale})`,
                transition: "color 0.15s ease",
                textShadow: isActive
                  ? `0 0 20px ${highlightColor}80`
                  : "0 2px 8px rgba(0,0,0,0.5)",
                display: "inline-block",
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
