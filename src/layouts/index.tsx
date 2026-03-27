/**
 * Layout Primitives
 *
 * Composable layout components for Remotion videos.
 * Build any layout with these building blocks.
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

// ─── Container ────────────────────────────────────────────────────

interface ContainerProps {
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  padding?: number;
  background?: string;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  width,
  height,
  padding,
  background,
  borderRadius,
  style,
}) => (
  <div
    style={{
      width,
      height,
      padding,
      background,
      borderRadius,
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Stack (vertical layout) ──────────────────────────────────────

interface StackProps {
  children: React.ReactNode;
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "space-between";
  style?: React.CSSProperties;
}

export const Stack: React.FC<StackProps> = ({
  children,
  gap = 16,
  align = "center",
  justify = "center",
  style,
}) => {
  const alignItems =
    align === "start"
      ? "flex-start"
      : align === "end"
      ? "flex-end"
      : align;
  const justifyContent =
    justify === "start"
      ? "flex-start"
      : justify === "end"
      ? "flex-end"
      : justify;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap,
        alignItems,
        justifyContent,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ─── Row (horizontal layout) ──────────────────────────────────────

interface RowProps {
  children: React.ReactNode;
  gap?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "space-between" | "space-around";
  wrap?: boolean;
  style?: React.CSSProperties;
}

export const Row: React.FC<RowProps> = ({
  children,
  gap = 16,
  align = "center",
  justify = "center",
  wrap = false,
  style,
}) => {
  const alignItems =
    align === "start"
      ? "flex-start"
      : align === "end"
      ? "flex-end"
      : align;
  const justifyContent =
    justify === "start"
      ? "flex-start"
      : justify === "end"
      ? "flex-end"
      : justify;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap,
        alignItems,
        justifyContent,
        flexWrap: wrap ? "wrap" : "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ─── Columns ──────────────────────────────────────────────────────

interface ColumnsProps {
  children: React.ReactNode[];
  ratios?: number[];
  gap?: number;
  style?: React.CSSProperties;
}

export const Columns: React.FC<ColumnsProps> = ({
  children,
  ratios,
  gap = 24,
  style,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "row",
      gap,
      ...style,
    }}
  >
    {React.Children.map(children, (child, i) => (
      <div
        style={{
          flex: ratios ? ratios[i] ?? 1 : 1,
          minWidth: 0,
        }}
      >
        {child}
      </div>
    ))}
  </div>
);

// ─── Grid ─────────────────────────────────────────────────────────

interface GridProps {
  children: React.ReactNode[];
  columns?: number;
  gap?: number;
  style?: React.CSSProperties;
}

export const Grid: React.FC<GridProps> = ({
  children,
  columns = 2,
  gap = 16,
  style,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap,
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Center ───────────────────────────────────────────────────────

interface CenterProps {
  children: React.ReactNode;
  fullScreen?: boolean;
  style?: React.CSSProperties;
}

export const Center: React.FC<CenterProps> = ({
  children,
  fullScreen = true,
  style,
}) =>
  fullScreen ? (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  ) : (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        ...style,
      }}
    >
      {children}
    </div>
  );

// ─── Positioned ───────────────────────────────────────────────────

interface PositionedProps {
  children: React.ReactNode;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  style?: React.CSSProperties;
}

export const Positioned: React.FC<PositionedProps> = ({
  children,
  top,
  bottom,
  left,
  right,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      top,
      bottom,
      left,
      right,
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── Overlay ──────────────────────────────────────────────────────

interface OverlayProps {
  children: React.ReactNode;
  color?: string;
  opacity?: number;
  style?: React.CSSProperties;
}

export const Overlay: React.FC<OverlayProps> = ({
  children,
  color = "#000000",
  opacity = 0.5,
  style,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: color,
      opacity,
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
);

// ─── Gradient Background ──────────────────────────────────────────

interface GradientBgProps {
  children: React.ReactNode;
  from?: string;
  to?: string;
  angle?: number;
  style?: React.CSSProperties;
}

export const GradientBg: React.FC<GradientBgProps> = ({
  children,
  from = "#0a0a0a",
  to = "#1a1a2e",
  angle = 135,
  style,
}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`,
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
);

// ─── Animated Wrapper ─────────────────────────────────────────────

interface FadeInProps {
  children: React.ReactNode;
  delayMs?: number;
  durationMs?: number;
  style?: React.CSSProperties;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delayMs = 0,
  durationMs = 500,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delayFrames = (delayMs / 1000) * fps;
  const durationFrames = (durationMs / 1000) * fps;

  const opacity = interpolate(
    frame - delayFrames,
    [0, durationFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ opacity, ...style }}>
      {children}
    </div>
  );
};

interface SlideUpProps {
  children: React.ReactNode;
  delayMs?: number;
  durationMs?: number;
  distance?: number;
  style?: React.CSSProperties;
}

export const SlideUp: React.FC<SlideUpProps> = ({
  children,
  delayMs = 0,
  durationMs = 500,
  distance = 40,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delayFrames = (delayMs / 1000) * fps;
  const durationFrames = (durationMs / 1000) * fps;

  const progress = interpolate(
    frame - delayFrames,
    [0, durationFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        opacity: progress,
        transform: `translateY(${(1 - progress) * distance}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
