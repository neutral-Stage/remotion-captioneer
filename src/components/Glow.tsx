/**
 * Glow Style
 * Active word has a neon glow effect with pulsing halo
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex } from "../utils.js";

interface GlowProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  glowColor?: string;
  glowIntensity?: number;
  position?: "top" | "center" | "bottom";
}

export const Glow: React.FC<GlowProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.35)",
  glowColor = "#A855F7",
  glowIntensity = 30,
  position = "bottom",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  const segment = getActiveSegment(captions, currentTimeMs);
  if (!segment) return null;

  const activeWordIndex = getActiveWordIndex(segment, currentTimeMs);

  // Pulse the glow
  const pulse = Math.sin(frame * 0.15) * 0.3 + 0.7;

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

          const glowAmount = isActive ? glowIntensity * pulse : 0;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isActive ? "#fff" : isPast ? "white" : fontColor,
                display: "inline-block",
                textShadow: isActive
                  ? `0 0 ${glowAmount}px ${glowColor}, 0 0 ${glowAmount * 2}px ${glowColor}80, 0 0 ${glowAmount * 3}px ${glowColor}40`
                  : "0 2px 8px rgba(0,0,0,0.5)",
                filter: isActive ? `brightness(${1 + pulse * 0.3})` : "none",
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
