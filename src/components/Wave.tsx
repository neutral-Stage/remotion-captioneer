/**
 * Wave Style
 * Words animate in a wave pattern — each word rises and falls in sequence
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex } from "../utils.js";

interface WaveProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  waveColor?: string;
  waveHeight?: number;
  waveDelay?: number;
  position?: "top" | "center" | "bottom";
}

export const Wave: React.FC<WaveProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.4)",
  waveColor = "#00D4FF",
  waveHeight = 25,
  waveDelay = 3,
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

          // Wave: active word at peak, past words trail off
          const distanceFromActive = i - activeWordIndex;
          const waveY =
            distanceFromActive >= 0 && distanceFromActive <= waveDelay
              ? -waveHeight * Math.sin((distanceFromActive / waveDelay) * Math.PI)
              : isPast
              ? -5
              : 0;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight: 700,
                color: isActive ? waveColor : isPast ? "white" : fontColor,
                display: "inline-block",
                transform: `translateY(${waveY}px)`,
                textShadow: isActive
                  ? `0 0 15px ${waveColor}60`
                  : "0 2px 8px rgba(0,0,0,0.5)",
                transition: "transform 0.15s ease-out",
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
