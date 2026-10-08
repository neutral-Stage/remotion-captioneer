/**
 * Wave Style
 * Words animate in a wave pattern — each word rises and falls in sequence
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { captionBoxMaxWidth, type CaptionStyleLayoutProps } from "./style-props.js";
import { emphasisVisual } from "./emphasis.js";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex } from "../utils.js";

interface WaveProps extends CaptionStyleLayoutProps {
  readonly captions: CaptionData;
  readonly fontFamily?: string;
  readonly fontSize?: number;
  readonly fontColor?: string;
  readonly waveColor?: string;
  readonly waveHeight?: number;
  readonly waveDelay?: number;
  readonly position?: "top" | "center" | "bottom";
  readonly emphasisStyle?: "scale" | "color" | "glow";
  readonly emphasisColor?: string;
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
  emphasisStyle,
  emphasisColor,
  maxWidth,
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
          maxWidth: captionBoxMaxWidth(maxWidth),
          padding: "16px 24px",
        }}
      >
        {segment.words.map((word, i) => {
          const isActive = i === activeWordIndex;
          const isPast = i < activeWordIndex;
          const emph = emphasisVisual(word, { emphasisStyle, emphasisColor, highlightColor: waveColor });

          // Wave: active word at peak, past words trail off
          const distanceFromActive = i - activeWordIndex;
          const waveY =
            distanceFromActive >= 0 && distanceFromActive <= waveDelay
              ? -waveHeight * Math.sin((distanceFromActive / waveDelay) * Math.PI)
              : isPast
              ? -5
              : 0;
          const emphFontSize = emph.fontBoost
            ? Math.round(fontSize * emph.fontBoost)
            : fontSize;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize: emphFontSize,
                fontWeight: 700,
                color: emph.color
                  ? emph.color
                  : isActive
                    ? waveColor
                    : isPast
                      ? "white"
                      : fontColor,
                display: "inline-block",
                transform: `translateY(${waveY}px)`,
                textShadow: emph.textShadow
                  ? emph.textShadow
                  : isActive
                    ? `0 0 15px ${waveColor}60`
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
