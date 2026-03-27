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
  template: VideoTemplate;
}

export const TemplateComposition: React.FC<TemplateCompositionProps> = ({
  template,
}) => {
  let frameOffset = 0;

  return (
    <AbsoluteFill>
      {template.scenes.map((scene, index) => {
        const from = frameOffset;
        frameOffset += scene.durationInFrames;

        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.durationInFrames}>
            <SceneRenderer
              scene={scene}
              tokens={template.tokens}
              width={template.width}
              height={template.height}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Scene Renderer ───────────────────────────────────────────────

const SceneRenderer: React.FC<{
  scene: Scene;
  tokens: DesignTokens;
  width: number;
  height: number;
}> = ({ scene, tokens, width, height }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Handle scene transitions
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

  // Vertical layout with spacing
  let yOffset = height * 0.15; // Start 15% from top

  return (
    <AbsoluteFill
      style={{
        background: scene.background ?? tokens.colors.background,
        opacity,
      }}
    >
      {scene.blocks.map((block) => {
        const element = (
          <BlockRenderer
            key={block.id}
            block={block}
            tokens={tokens}
            width={width}
            height={height}
          />
        );
        return element;
      })}
    </AbsoluteFill>
  );
};

// ─── Block Renderer ───────────────────────────────────────────────

const BlockRenderer: React.FC<{
  block: Block;
  tokens: DesignTokens;
  width: number;
  height: number;
}> = ({ block, tokens, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Apply animation
  const animStyle = getAnimationStyle(block.animation, frame, fps);

  const combinedStyle: React.CSSProperties = {
    ...animStyle,
    ...(block.style ?? {}),
  };

  switch (block.type) {
    case "heading":
      return (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              ...combinedStyle,
              fontFamily: tokens.typography.headingFont,
              fontSize: block.fontSize ?? tokens.typography.headingSize,
              fontWeight: block.fontWeight ?? 700,
              color: block.color ?? tokens.colors.text,
              textAlign: block.align ?? "center",
              padding: "0 10%",
            }}
          >
            {block.content}
          </div>
        </AbsoluteFill>
      );

    case "text":
      return (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              ...combinedStyle,
              fontFamily: tokens.typography.bodyFont,
              fontSize: block.fontSize ?? tokens.typography.bodySize,
              fontWeight: block.fontWeight ?? 400,
              color: block.color ?? tokens.colors.textMuted,
              textAlign: block.align ?? "center",
              padding: "0 15%",
            }}
          >
            {block.content}
          </div>
        </AbsoluteFill>
      );

    case "image":
      return (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={combinedStyle}>
            <Img
              src={block.src}
              style={{
                width: block.width ?? "60%",
                height: block.height ?? "auto",
                objectFit: block.objectFit ?? "contain",
                borderRadius: block.borderRadius ?? tokens.borderRadius,
              }}
            />
          </div>
        </AbsoluteFill>
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
        <RemotionAudio src={block.src} volume={block.volume ?? 1} />
      );

    case "captions":
      return (
        <AnimatedCaptions
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

  const progress = Math.min(1, adjustedFrame / durationFrames);
  const easedProgress = easing.easeOut(progress);

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
  easeOut: (t: number) => 1 - Math.pow(1 - t, 2),
};
