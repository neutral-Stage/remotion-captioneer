/**
 * Template System Types
 *
 * Data-driven video generation from JSON config.
 * Define reusable video templates with composable blocks.
 */

import type { CaptionData, CaptionStyle } from "../types.js";

// ─── Color & Style Tokens ─────────────────────────────────────────

export interface ColorTokens {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  textMuted: string;
}

export interface TypographyTokens {
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  headingSize: number;
  bodySize: number;
  captionSize: number;
}

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  borderRadius: number;
  spacing: number;
}

// ─── Layout Blocks ────────────────────────────────────────────────

export type BlockType =
  | "text"
  | "heading"
  | "image"
  | "video"
  | "audio"
  | "captions"
  | "divider"
  | "spacer"
  | "columns"
  | "grid"
  | "logo";

export interface AnimationConfig {
  type: "fadeIn" | "slideUp" | "slideDown" | "scaleIn" | "none";
  durationMs: number;
  delayMs?: number;
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "spring";
}

export interface BlockBase {
  id: string;
  type: BlockType;
  animation?: AnimationConfig;
  style?: React.CSSProperties;
}

export interface TextBlock extends BlockBase {
  type: "text" | "heading";
  content: string;
  align?: "left" | "center" | "right";
  fontSize?: number;
  fontWeight?: number;
  color?: string;
}

export interface ImageBlock extends BlockBase {
  type: "image";
  src: string;
  width?: number | string;
  height?: number | string;
  objectFit?: "cover" | "contain" | "fill";
  borderRadius?: number;
}

export interface VideoBlock extends BlockBase {
  type: "video";
  src: string;
  loop?: boolean;
  muted?: boolean;
  volume?: number;
}

export interface AudioBlock extends BlockBase {
  type: "audio";
  src: string;
  volume?: number;
}

export interface CaptionsBlock extends BlockBase {
  type: "captions";
  captions: CaptionData;
  captionStyle?: CaptionStyle;
  highlightColor?: string;
  position?: "top" | "center" | "bottom";
}

export interface DividerBlock extends BlockBase {
  type: "divider";
  color?: string;
  thickness?: number;
  margin?: number;
}

export interface SpacerBlock extends BlockBase {
  type: "spacer";
  height: number;
}

export interface ColumnsBlock extends BlockBase {
  type: "columns";
  columns: Block[];
  gap?: number;
  ratios?: number[];
}

export interface GridBlock extends BlockBase {
  type: "grid";
  items: Block[];
  columns?: number;
  gap?: number;
}

export interface LogoBlock extends BlockBase {
  type: "logo";
  src: string;
  size?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
}

export type Block =
  | TextBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | CaptionsBlock
  | DividerBlock
  | SpacerBlock
  | ColumnsBlock
  | GridBlock
  | LogoBlock;

// ─── Scene / Section ──────────────────────────────────────────────

export interface Scene {
  id: string;
  /** Duration in frames */
  durationInFrames: number;
  /** Background */
  background?: string;
  /** Blocks in this scene */
  blocks: Block[];
  /** Transition to next scene */
  transition?: "cut" | "fade" | "slideLeft" | "slideRight" | "slideUp";
  /** Transition duration in frames */
  transitionDuration?: number;
}

// ─── Video Template ───────────────────────────────────────────────

export interface VideoTemplate {
  /** Template name */
  name: string;
  /** Description */
  description?: string;
  /** Video dimensions */
  width: number;
  height: number;
  /** FPS */
  fps: number;
  /** Design tokens */
  tokens: DesignTokens;
  /** Scenes in order */
  scenes: Scene[];
}

// ─── Template Presets (composable blocks) ──────────────────────────

/**
 * Preset: Title/Intro scene
 */
export function createIntroScene(config: {
  title: string;
  subtitle?: string;
  logo?: string;
  background?: string;
  durationSec?: number;
  fps?: number;
}): Scene {
  const fps = config.fps ?? 30;
  const durationSec = config.durationSec ?? 3;

  const blocks: Block[] = [];

  if (config.logo) {
    blocks.push({
      id: "intro-logo",
      type: "logo",
      src: config.logo,
      size: 80,
      position: "center",
      animation: { type: "scaleIn", durationMs: 600 },
    });
  }

  blocks.push({
    id: "intro-title",
    type: "heading",
    content: config.title,
    align: "center",
    animation: { type: "slideUp", durationMs: 800, delayMs: 200 },
  });

  if (config.subtitle) {
    blocks.push({
      id: "intro-subtitle",
      type: "text",
      content: config.subtitle,
      align: "center",
      animation: { type: "fadeIn", durationMs: 600, delayMs: 600 },
    });
  }

  return {
    id: "intro",
    durationInFrames: durationSec * fps,
    background: config.background,
    blocks,
    transition: "fade",
    transitionDuration: 15,
  };
}

/**
 * Preset: Captioned content scene
 */
export function createCaptionScene(config: {
  captions: CaptionData;
  captionStyle?: CaptionStyle;
  highlightColor?: string;
  background?: string;
  fps?: number;
  logo?: string;
}): Scene {
  const fps = config.fps ?? 30;
  const durationMs = config.captions.durationMs;
  const durationFrames = Math.ceil((durationMs / 1000) * fps);

  const blocks: Block[] = [];

  if (config.logo) {
    blocks.push({
      id: "caption-logo",
      type: "logo",
      src: config.logo,
      size: 40,
      position: "top-right",
    });
  }

  blocks.push({
    id: "captions",
    type: "captions",
    captions: config.captions,
    captionStyle: config.captionStyle ?? "word-highlight",
    highlightColor: config.highlightColor,
    position: "bottom",
  });

  return {
    id: "captions",
    durationInFrames: durationFrames,
    background: config.background,
    blocks,
  };
}

/**
 * Preset: Outro/CTA scene
 */
export function createOutroScene(config: {
  heading: string;
  cta?: string;
  logo?: string;
  background?: string;
  durationSec?: number;
  fps?: number;
}): Scene {
  const fps = config.fps ?? 30;
  const durationSec = config.durationSec ?? 3;

  const blocks: Block[] = [];

  if (config.logo) {
    blocks.push({
      id: "outro-logo",
      type: "logo",
      src: config.logo,
      size: 100,
      position: "center",
      animation: { type: "scaleIn", durationMs: 800 },
    });
  }

  blocks.push({
    id: "outro-heading",
    type: "heading",
    content: config.heading,
    align: "center",
    animation: { type: "fadeIn", durationMs: 600, delayMs: 400 },
  });

  if (config.cta) {
    blocks.push({
      id: "outro-cta",
      type: "text",
      content: config.cta,
      align: "center",
      animation: { type: "fadeIn", durationMs: 600, delayMs: 800 },
    });
  }

  return {
    id: "outro",
    durationInFrames: durationSec * fps,
    background: config.background,
    blocks,
  };
}

/**
 * Preset: Divider scene (brief pause between sections)
 */
export function createDividerScene(config: {
  durationSec?: number;
  fps?: number;
  background?: string;
}): Scene {
  const fps = config.fps ?? 30;
  const durationSec = config.durationSec ?? 0.5;

  return {
    id: "divider",
    durationInFrames: Math.round(durationSec * fps),
    background: config.background,
    blocks: [],
  };
}

/**
 * Build a complete VideoTemplate from presets
 */
export function buildTemplate(config: {
  name: string;
  width?: number;
  height?: number;
  fps?: number;
  tokens?: Partial<DesignTokens>;
  intro?: Parameters<typeof createIntroScene>[0];
  captions?: Array<Parameters<typeof createCaptionScene>[0]>;
  outro?: Parameters<typeof createOutroScene>[0];
}): VideoTemplate {
  const fps = config.fps ?? 30;
  const scenes: Scene[] = [];

  if (config.intro) {
    scenes.push(createIntroScene({ ...config.intro, fps }));
  }

  if (config.captions) {
    for (const capConfig of config.captions) {
      scenes.push(createCaptionScene({ ...capConfig, fps }));
      // Add divider between caption scenes
      scenes.push(createDividerScene({ fps }));
    }
  }

  if (config.outro) {
    scenes.push(createOutroScene({ ...config.outro, fps }));
  }

  return {
    name: config.name,
    width: config.width ?? 1920,
    height: config.height ?? 1080,
    fps,
    tokens: mergeTokens(config.tokens),
    scenes,
  };
}

// ─── Default Design Tokens ────────────────────────────────────────

const DEFAULT_TOKENS: DesignTokens = {
  colors: {
    primary: "#6366F1",
    secondary: "#8B5CF6",
    accent: "#FFD700",
    background: "#0a0a0a",
    text: "#FFFFFF",
    textMuted: "#888888",
  },
  typography: {
    headingFont: "Inter, sans-serif",
    bodyFont: "Inter, sans-serif",
    monoFont: "JetBrains Mono, monospace",
    headingSize: 64,
    bodySize: 32,
    captionSize: 56,
  },
  borderRadius: 12,
  spacing: 16,
};

function mergeTokens(partial?: Partial<DesignTokens>): DesignTokens {
  if (!partial) return DEFAULT_TOKENS;
  return {
    colors: { ...DEFAULT_TOKENS.colors, ...partial.colors },
    typography: { ...DEFAULT_TOKENS.typography, ...partial.typography },
    borderRadius: partial.borderRadius ?? DEFAULT_TOKENS.borderRadius,
    spacing: partial.spacing ?? DEFAULT_TOKENS.spacing,
  };
}
