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
  readonly children: React.ReactNode;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly padding?: number;
  readonly background?: string;
  readonly borderRadius?: number;
  readonly style?: React.CSSProperties;
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
  readonly children: React.ReactNode;
  readonly gap?: number;
  readonly align?: "start" | "center" | "end" | "stretch";
  readonly justify?: "start" | "center" | "end" | "space-between";
  readonly style?: React.CSSProperties;
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
  readonly children: React.ReactNode;
  readonly gap?: number;
  readonly align?: "start" | "center" | "end" | "stretch";
  readonly justify?: "start" | "center" | "end" | "space-between" | "space-around";
  readonly wrap?: boolean;
  readonly style?: React.CSSProperties;
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
  readonly children: React.ReactNode[];
  readonly ratios?: number[];
  readonly gap?: number;
  readonly style?: React.CSSProperties;
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
  readonly children: React.ReactNode[];
  readonly columns?: number;
  readonly gap?: number;
  readonly style?: React.CSSProperties;
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
  readonly children: React.ReactNode;
  readonly fullScreen?: boolean;
  readonly style?: React.CSSProperties;
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
  readonly children: React.ReactNode;
  readonly top?: number;
  readonly bottom?: number;
  readonly left?: number;
  readonly right?: number;
  readonly style?: React.CSSProperties;
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
  readonly children: React.ReactNode;
  readonly color?: string;
  readonly opacity?: number;
  readonly style?: React.CSSProperties;
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
  readonly children: React.ReactNode;
  readonly from?: string;
  readonly to?: string;
  readonly angle?: number;
  readonly style?: React.CSSProperties;
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
  readonly children: React.ReactNode;
  readonly delayMs?: number;
  readonly durationMs?: number;
  readonly style?: React.CSSProperties;
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
  readonly children: React.ReactNode;
  readonly delayMs?: number;
  readonly durationMs?: number;
  readonly distance?: number;
  readonly style?: React.CSSProperties;
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
