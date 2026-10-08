/**
 * Word Highlight Style
 * Each word lights up individually as it's spoken
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
import { emphasisVisual } from "./emphasis.js";
import {
  captionBoxMaxWidth,
  flatWordIndex,
  resolveDisplayLines,
  type CaptionStyleLayoutProps,
} from "./style-props.js";

interface WordHighlightProps extends CaptionStyleLayoutProps {
  readonly captions: CaptionData;
  readonly fontFamily?: string;
  readonly fontSize?: number;
  readonly fontColor?: string;
  readonly highlightColor?: string;
  readonly position?: "top" | "center" | "bottom";
  readonly emphasisStyle?: "scale" | "color" | "glow";
  readonly emphasisColor?: string;
}

export const WordHighlight: React.FC<WordHighlightProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.5)",
  highlightColor = "#FFD700",
  position = "bottom",
  maxWidth,
  wordsPerLine,
  useSmartWrap,
  emphasisStyle,
  emphasisColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  const segment = getActiveSegment(captions, currentTimeMs);
  if (!segment) return null;

  const activeWordIndex = getActiveWordIndex(segment, currentTimeMs);
  const lines = resolveDisplayLines(segment, {
    maxWidth,
    wordsPerLine,
    useSmartWrap,
  });

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
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          maxWidth: captionBoxMaxWidth(maxWidth),
          padding: "16px 24px",
        }}
      >
        {lines.map((line, lineIdx) => (
          <div
            key={lineIdx}
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "baseline",
              gap: "8px 12px",
            }}
          >
            {line.map((word, wi) => {
              const i = flatWordIndex(lines, lineIdx, wi);
              const isActive = i === activeWordIndex;
              const isPast = i < activeWordIndex;
              const emph = emphasisVisual(word, { emphasisStyle, emphasisColor, highlightColor });

              const scale = isActive
                ? spring({
                    frame,
                    fps,
                    config: { damping: 10, stiffness: 200 },
                  })
                : 1;
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
                        ? highlightColor
                        : isPast
                          ? "white"
                          : fontColor,
                    transform: `scale(${scale})`,
                    textShadow: emph.textShadow
                      ? emph.textShadow
                      : isActive
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
        ))}
      </div>
    </AbsoluteFill>
  );
};
