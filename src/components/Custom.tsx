/**
 * Custom Style
 * Renders words driven by a data-only keyframe animation spec — what
 * marketplace style packages use to ship their own motion.
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import type { CaptionData } from "../types.js";
import { getActiveSegment, getActiveWordIndex, getWordProgress } from "../utils.js";
import type { AnimationSpec } from "../animation.js";
import { sampleAnimation } from "../animation.js";
import { emphasisVisual } from "./emphasis.js";
import { captionBoxMaxWidth, type CaptionStyleLayoutProps } from "./style-props.js";

interface CustomProps extends CaptionStyleLayoutProps {
  readonly captions: CaptionData;
  readonly animation: AnimationSpec;
  readonly fontFamily?: string;
  readonly fontSize?: number;
  readonly fontColor?: string;
  readonly highlightColor?: string;
  readonly fontWeight?: number;
  readonly position?: "top" | "center" | "bottom";
  readonly emphasisStyle?: "scale" | "color" | "glow";
  readonly emphasisColor?: string;
}

export const Custom: React.FC<CustomProps> = ({
  captions,
  animation,
  fontFamily = "Inter, sans-serif",
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.5)",
  highlightColor = "#FFD700",
  fontWeight = 700,
  position = "bottom",
  maxWidth,
  emphasisStyle,
  emphasisColor,
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
          gap: "8px 12px",
          maxWidth: captionBoxMaxWidth(maxWidth),
          padding: "16px 24px",
        }}
      >
        {segment.words.map((word, i) => {
          const isActive = i === activeWordIndex;
          const emph = emphasisVisual(word, { emphasisStyle, emphasisColor, highlightColor });

          // Each word runs the keyframes across its own spoken progress;
          // past words hold their final state, future words their first.
          const progress =
            i < activeWordIndex
              ? 1
              : i === activeWordIndex
                ? getWordProgress(word, currentTimeMs)
                : 0;
          const state = sampleAnimation(animation, progress);
          const scale = state.scale * emph.scaleBoost;

          return (
            <span
              key={`${word.startMs}-${i}`}
              style={{
                fontFamily,
                fontSize,
                fontWeight,
                color: emph.color ?? state.color ?? fontColor,
                opacity: state.opacity,
                display: "inline-block",
                transform: `translateY(${state.yOffset}px) scale(${scale})`,
                textShadow: emph.textShadow
                  ? emph.textShadow
                  : isActive
                    ? `0 0 16px ${highlightColor}50`
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
