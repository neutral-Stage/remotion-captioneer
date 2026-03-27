/**
 * Karaoke Style
 * Words fill with color progressively left-to-right as they're spoken
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionData, Word } from "../types.js";
import { getActiveSegment, getActiveWordIndex, getWordProgress } from "../utils.js";

interface KaraokeProps {
  captions: CaptionData;
  fontFamily?: string;
  fontSize?: number;
  fillColor?: string;
  baseColor?: string;
  position?: "top" | "center" | "bottom";
}

const KaraokeWord: React.FC<{
  word: Word;
  isActive: boolean;
  progress: number;
  fontFamily: string;
  fontSize: number;
  fillColor: string;
  baseColor: string;
}> = ({ word, isActive, progress, fontFamily, fontSize, fillColor, baseColor }) => {
  if (!isActive) {
    const isPast = progress >= 1;
    return (
      <span
        style={{
          fontFamily,
          fontSize,
          fontWeight: 700,
          color: isPast ? fillColor : baseColor,
          display: "inline-block",
          textShadow: "0 2px 8px rgba(0,0,0,0.5)",
        }}
      >
        {word.word}
      </span>
    );
  }

  const fillPercent = Math.round(progress * 100);

  return (
    <span
      style={{
        fontFamily,
        fontSize,
        fontWeight: 700,
        display: "inline-block",
        background: `linear-gradient(90deg, ${fillColor} ${fillPercent}%, ${baseColor} ${fillPercent}%)`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textShadow: "none",
        filter: `drop-shadow(0 0 8px ${fillColor}60)`,
      }}
    >
      {word.word}
    </span>
  );
};

export const Karaoke: React.FC<KaraokeProps> = ({
  captions,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fillColor = "#FF6B6B",
  baseColor = "rgba(255,255,255,0.4)",
  position = "bottom",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  const segment = getActiveSegment(captions, currentTimeMs);
  if (!segment) return null;

  const activeIndex = getActiveWordIndex(segment, currentTimeMs);

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
          const progress =
            i < activeIndex ? 1 : i === activeIndex ? getWordProgress(word, currentTimeMs) : 0;

          return (
            <KaraokeWord
              key={`${word.startMs}-${i}`}
              word={word}
              isActive={i === activeIndex}
              progress={progress}
              fontFamily={fontFamily}
              fontSize={fontSize}
              fillColor={fillColor}
              baseColor={baseColor}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
