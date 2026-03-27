/**
 * Typewriter Style
 * Text appears character by character like a typewriter
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment } from "../utils.js";

interface TypewriterProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  cursorColor?: string;
  position?: "top" | "center" | "bottom";
}

export const Typewriter: React.FC<TypewriterProps> = ({
  captions,
  fontFamily = "JetBrains Mono, monospace",
  fontSize = 48,
  fontColor = "#FFFFFF",
  cursorColor = "#00FF88",
  position = "bottom",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  const segment = getActiveSegment(captions, currentTimeMs);
  if (!segment) return null;

  // Calculate how much of the text to show based on word progress
  const totalWords = segment.words.length;
  const segmentProgress =
    (currentTimeMs - segment.startMs) / (segment.endMs - segment.startMs);
  const wordsToShow = Math.ceil(segmentProgress * totalWords);

  const visibleText = segment.words
    .slice(0, wordsToShow)
    .map((w) => w.word)
    .join(" ");

  const showCursor = Math.floor(frame / 15) % 2 === 0;

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
          maxWidth: "80%",
          padding: "16px 24px",
          background: "rgba(0,0,0,0.6)",
          borderRadius: "12px",
          border: `2px solid ${cursorColor}40`,
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize,
            fontWeight: 500,
            color: fontColor,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {visibleText}
          {showCursor && (
            <span
              style={{
                color: cursorColor,
                fontWeight: 400,
                marginLeft: "2px",
              }}
            >
              |
            </span>
          )}
        </span>
      </div>
    </AbsoluteFill>
  );
};
