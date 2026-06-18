/**
 * Template Renderer
 *
 * Renders a VideoTemplate into Remotion compositions.
 * Handles layout, animations, transitions, and block rendering.
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  Sequence,
  Audio as RemotionAudio,
  OffthreadVideo,
  staticFile,
} from "remotion";
import { AnimatedCaptions } from "../components/AnimatedCaptions.js";
import type {
  Block,
  Scene,
  VideoTemplate,
  AnimationConfig,
  DesignTokens,
} from "./types.js";

// ─── Main Template Composition ────────────────────────────────────

interface TemplateCompositionProps {
  readonly template: VideoTemplate;
}

export const TemplateComposition: React.FC<TemplateCompositionProps> = ({
  template,
}) => {
  const sceneOffsets = React.useMemo(() => {
    const offsets: number[] = [];
    let cursor = 0;
    for (const scene of template.scenes) {
      offsets.push(cursor);
      cursor += scene.durationInFrames;
    }
    return offsets;
  }, [template.scenes]);

  return (
    <AbsoluteFill>
      {template.scenes.map((scene, index) => (
        <Sequence
          key={scene.id}
          from={sceneOffsets[index] ?? 0}
          durationInFrames={scene.durationInFrames}
        >
          <SceneRenderer
            scene={scene}
            tokens={template.tokens}
            width={template.width}
            height={template.height}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// ─── Scene Renderer ───────────────────────────────────────────────

const OVERLAY_BLOCKS = new Set(["captions", "logo", "audio"]);

const SceneRenderer: React.FC<{
  readonly scene: Scene;
  readonly tokens: DesignTokens;
  readonly width: number;
  readonly height: number;
}> = ({ scene, tokens, width, height }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  let opacity = 1;
  if (scene.transition === "fade" && scene.transitionDuration) {
    const tDur = scene.transitionDuration;
    opacity = interpolate(
      frame,
      [0, tDur, durationInFrames - tDur, durationInFrames],
      [0, 1, 1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  }

  const flowBlocks = scene.blocks.filter((b) => !OVERLAY_BLOCKS.has(b.type));
  const overlayBlocks = scene.blocks.filter((b) => OVERLAY_BLOCKS.has(b.type));

  let yOffset = height * 0.15;

  return (
    <AbsoluteFill
      style={{
        background: scene.background ?? tokens.colors.background,
        opacity,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 8%",
        }}
      >
        {flowBlocks.map((block) => {
          const element = (
            <BlockRenderer
              key={block.id}
              nested
              block={block}
              tokens={tokens}
              width={width}
              height={height}
              yOffset={yOffset}
            />
          );
          yOffset += estimateBlockHeight(block, tokens);
          return element;
        })}
      </div>
      {overlayBlocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          tokens={tokens}
          width={width}
          height={height}
        />
      ))}
    </AbsoluteFill>
  );
};

function estimateBlockHeight(block: Block, tokens: DesignTokens): number {
  switch (block.type) {
    case "heading":
      return (block.fontSize ?? tokens.typography.headingSize) * 1.4;
    case "text":
      return (block.fontSize ?? tokens.typography.bodySize) * 1.6;
    case "divider":
      return (block.margin ?? 32) * 2 + (block.thickness ?? 2);
    case "spacer":
      return block.height;
    case "columns":
    case "grid":
      return 200;
    case "video":
      return 320;
    case "image":
      return 240;
    default:
      return 80;
  }
}

// ─── Block Renderer ───────────────────────────────────────────────

const BlockRenderer: React.FC<{
  readonly block: Block;
  readonly tokens: DesignTokens;
  readonly width: number;
  readonly height: number;
  readonly nested?: boolean;
  readonly yOffset?: number;
}> = ({ block, tokens, width, height, nested = false, yOffset = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animStyle = getAnimationStyle(block.animation, frame, fps);

  const combinedStyle: React.CSSProperties = {
    ...animStyle,
    ...(block.style ?? {}),
    ...(nested && yOffset > 0 ? { marginTop: yOffset > height * 0.15 ? 16 : 0 } : {}),
  };

  const centerWrap = (child: React.ReactNode): React.ReactNode =>
    nested ? (
      <div style={{ width: "100%", textAlign: "center", ...combinedStyle }}>{child}</div>
    ) : (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={combinedStyle}>{child}</div>
      </AbsoluteFill>
    );

  switch (block.type) {
    case "heading":
      return centerWrap(
        <div
          style={{
            fontFamily: tokens.typography.headingFont,
            fontSize: block.fontSize ?? tokens.typography.headingSize,
            fontWeight: block.fontWeight ?? 700,
            color: block.color ?? tokens.colors.text,
            textAlign: block.align ?? "center",
            padding: nested ? "0" : "0 10%",
          }}
        >
          {block.content}
        </div>
      );

    case "text":
      return centerWrap(
        <div
          style={{
            fontFamily: tokens.typography.bodyFont,
            fontSize: block.fontSize ?? tokens.typography.bodySize,
            fontWeight: block.fontWeight ?? 400,
            color: block.color ?? tokens.colors.textMuted,
            textAlign: block.align ?? "center",
            padding: nested ? "0" : "0 15%",
          }}
        >
          {block.content}
        </div>
      );

    case "image":
      return centerWrap(
        <Img
          src={block.src}
          style={{
            width: block.width ?? "60%",
            height: block.height ?? "auto",
            objectFit: block.objectFit ?? "contain",
            borderRadius: block.borderRadius ?? tokens.borderRadius,
          }}
        />
      );

    case "video":
      return centerWrap(
        <OffthreadVideo
          src={block.src.startsWith("http") ? block.src : staticFile(block.src)}
          muted={block.muted}
          volume={block.volume ?? 1}
          style={{
            width: "80%",
            maxHeight: nested ? 280 : 400,
            borderRadius: tokens.borderRadius,
            objectFit: "contain",
          }}
        />
      );

    case "logo":
      return (
        <AbsoluteFill
          style={{
            justifyContent:
              block.position === "top-left" || block.position === "bottom-left"
                ? "flex-start"
                : block.position === "top-right" || block.position === "bottom-right"
                  ? "flex-end"
                  : "center",
            alignItems:
              block.position === "top-left" || block.position === "top-right"
                ? "flex-start"
                : block.position === "bottom-left" || block.position === "bottom-right"
                  ? "flex-end"
                  : "center",
            padding: 40,
          }}
        >
          <Img
            src={block.src}
            style={{
              ...combinedStyle,
              width: block.size ?? 60,
              height: block.size ?? 60,
              objectFit: "contain",
            }}
          />
        </AbsoluteFill>
      );

    case "audio":
      return (
        <RemotionAudio
          src={block.src.startsWith("http") ? block.src : staticFile(block.src)}
          volume={block.volume ?? 1}
        />
      );

    case "captions":
      return (
        <AnimatedCaptions
          showSpeakerLabels
          captions={block.captions}
          style={block.captionStyle ?? "word-highlight"}
          highlightColor={block.highlightColor ?? tokens.colors.accent}
          position={block.position ?? "bottom"}
          fontFamily={tokens.typography.bodyFont}
          fontSize={tokens.typography.captionSize}
        />
      );

    case "divider":
      return (
        <div
          style={{
            ...combinedStyle,
            width: "80%",
            height: block.thickness ?? 2,
            backgroundColor: block.color ?? tokens.colors.textMuted,
            margin: `${block.margin ?? 32}px auto`,
            opacity: 0.3,
          }}
        />
      );

    case "spacer":
      return <div style={{ height: block.height }} />;

    case "columns": {
      const ratios = block.ratios ?? block.columns.map(() => 1);
      const total = ratios.reduce((sum, r) => sum + r, 0);
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: block.gap ?? 16,
            width: "100%",
            ...combinedStyle,
          }}
        >
          {block.columns.map((child, i) => (
            <div key={child.id} style={{ flex: ratios[i] / total }}>
              <BlockRenderer
                nested
                block={child}
                tokens={tokens}
                width={(width * ratios[i]) / total}
                height={height}
              />
            </div>
          ))}
        </div>
      );
    }

    case "grid":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${block.columns ?? 2}, 1fr)`,
            gap: block.gap ?? 16,
            width: "100%",
            ...combinedStyle,
          }}
        >
          {block.items.map((child) => (
            <BlockRenderer
              key={child.id}
              nested
              block={child}
              tokens={tokens}
              width={width / (block.columns ?? 2)}
              height={height}
            />
          ))}
        </div>
      );

    default:
      return null;
  }
};

// ─── Animation Helpers ────────────────────────────────────────────

function getAnimationStyle(
  animation: AnimationConfig | undefined,
  frame: number,
  fps: number
): React.CSSProperties {
  if (!animation || animation.type === "none") return {};

  const delayFrames = ((animation.delayMs ?? 0) / 1000) * fps;
  const durationFrames = (animation.durationMs / 1000) * fps;
  const adjustedFrame = Math.max(0, frame - delayFrames);

  if (adjustedFrame <= 0) {
    return getInitialStyle(animation.type);
  }

  const linearProgress = Math.min(1, adjustedFrame / durationFrames);
  const easedProgress =
    animation.easing === "spring"
      ? spring({ frame: adjustedFrame, fps, config: { damping: 14, stiffness: 120 } })
      : easing.easeOut(linearProgress);

  switch (animation.type) {
    case "fadeIn":
      return {
        opacity: easedProgress,
      };

    case "slideUp":
      return {
        opacity: easedProgress,
        transform: `translateY(${(1 - easedProgress) * 40}px)`,
      };

    case "slideDown":
      return {
        opacity: easedProgress,
        transform: `translateY(${(1 - easedProgress) * -40}px)`,
      };

    case "scaleIn":
      return {
        opacity: easedProgress,
        transform: `scale(${0.8 + easedProgress * 0.2})`,
      };

    default:
      return {};
  }
}

function getInitialStyle(type: string): React.CSSProperties {
  switch (type) {
    case "fadeIn":
      return { opacity: 0 };
    case "slideUp":
      return { opacity: 0, transform: "translateY(40px)" };
    case "slideDown":
      return { opacity: 0, transform: "translateY(-40px)" };
    case "scaleIn":
      return { opacity: 0, transform: "scale(0.8)" };
    default:
      return {};
  }
}

const easing = {
  easeOut: (t: number) => 1 - (1 - t)**2,
};
