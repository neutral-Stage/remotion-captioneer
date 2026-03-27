/**
 * Pill Style
 * Active word is highlighted inside a rounded pill/background shape
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex } from "../utils.js";

interface PillProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  pillColor?: string;
  pillTextColor?: string;
  pillPadding?: number;
  position?: "top" | "center" | "bottom";
}

export const Pill: React.FC<PillProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 48,
  fontColor = "rgba(255,255,255,0.5)",
  pillColor = "#6366F1",
  pillTextColor = "#FFFFFF",
  pillPadding = 12,
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
          gap: "6px 10px",
          maxWidth: "80%",
          padding: "16px 24px",
        }}
      >
        {segment.words.map((word, i) => {
          const isActive = i === activeWordIndex;
          const isPast = i < activeWordIndex;

          const scale = isActive
            ? spring({ frame, fps, config: { damping: 10, stiffness: 200 } })
            : 1;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 600,
                color: isActive ? pillTextColor : isPast ? "white" : fontColor,
                display: "inline-block",
                padding: isActive ? `4px ${pillPadding}px` : "4px 2px",
                backgroundColor: isActive ? pillColor : "transparent",
                borderRadius: isActive ? "999px" : "0",
                transform: `scale(${scale})`,
                textShadow: isActive ? "none" : "0 2px 8px rgba(0,0,0,0.5)",
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
