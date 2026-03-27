/**
 * Bounce Style
 * Active word bounces up with a spring animation
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex } from "../utils.js";

interface BounceProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  bounceColor?: string;
  bounceHeight?: number;
  position?: "top" | "center" | "bottom";
}

export const Bounce: React.FC<BounceProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.6)",
  bounceColor = "#FF4081",
  bounceHeight = 30,
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
          alignItems: "baseline",
          gap: "8px 12px",
          maxWidth: "80%",
          padding: "16px 24px",
        }}
      >
        {segment.words.map((word, i) => {
          const isActive = i === activeWordIndex;
          const isPast = i < activeWordIndex;

          // Bounce spring — rises then falls
          const bounce = isActive
            ? spring({
                frame,
                fps,
                config: {
                  damping: 8,
                  stiffness: 300,
                  mass: 0.5,
                },
              })
            : 0;

          const yOffset = isActive ? -bounceHeight * Math.sin(bounce * Math.PI) : 0;
          const scale = isActive ? 1 + 0.15 * Math.sin(bounce * Math.PI) : 1;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isActive ? bounceColor : isPast ? "white" : fontColor,
                display: "inline-block",
                transform: `translateY(${yOffset}px) scale(${scale})`,
                textShadow: isActive
                  ? `0 4px 15px ${bounceColor}60`
                  : "0 2px 8px rgba(0,0,0,0.5)",
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
