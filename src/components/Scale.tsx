/**
 * Scale Style
 * Words grow from small to full size as they become active
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex } from "../utils.js";

interface ScaleProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  scaleColor?: string;
  maxScale?: number;
  position?: "top" | "center" | "bottom";
}

export const Scale: React.FC<ScaleProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.3)",
  scaleColor = "#34D399",
  maxScale = 1.4,
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
                config: { damping: 8, stiffness: 150, mass: 0.5 },
              }) * (maxScale - 1) + 1
            : isPast
            ? 1
            : 0.7;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isActive ? scaleColor : isPast ? "white" : fontColor,
                display: "inline-block",
                transform: `scale(${scale})`,
                textShadow: isActive
                  ? `0 0 15px ${scaleColor}60`
                  : "0 2px 8px rgba(0,0,0,0.5)",
                transition: "transform 0.15s ease",
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
