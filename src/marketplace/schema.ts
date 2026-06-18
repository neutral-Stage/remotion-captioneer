/**
 * Style marketplace — JSON preset packages referencing built-in CaptionStyle values.
 */

import type { CaptionPreset } from "../presets/index.js";
import type { CaptionStyle } from "../types.js";

export const STYLE_PACKAGE_VERSION = 1 as const;

export interface StylePackageMeta {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  homepage?: string;
}

export interface StylePackage {
  schemaVersion: typeof STYLE_PACKAGE_VERSION;
  meta: StylePackageMeta;
  preset: CaptionPreset;
}

const BUILTIN_STYLES: readonly CaptionStyle[] = [
  "word-highlight",
  "karaoke",
  "typewriter",
  "bounce",
  "wave",
  "glow",
  "typewriter-erase",
  "pill",
  "flicker",
  "highlighter",
  "blur",
  "rainbow",
  "scale",
  "spotlight",
];

export function isCaptionStyle(value: string): value is CaptionStyle {
  return (BUILTIN_STYLES as readonly string[]).includes(value);
}

export function validateStylePackage(raw: unknown): StylePackage {
  if (!raw || typeof raw !== "object") {
    throw new Error("Style package must be a JSON object");
  }

  const pkg = raw as Record<string, unknown>;
  if (pkg.schemaVersion !== STYLE_PACKAGE_VERSION) {
    throw new Error(
      `Unsupported schemaVersion (expected ${STYLE_PACKAGE_VERSION})`
    );
  }

  if (!pkg.meta || typeof pkg.meta !== "object") {
    throw new Error("Style package missing meta");
  }
  if (!pkg.preset || typeof pkg.preset !== "object") {
    throw new Error("Style package missing preset");
  }

  const meta = pkg.meta as StylePackageMeta;
  if (
    typeof meta.id !== "string" ||
    !meta.id ||
    typeof meta.name !== "string" ||
    !meta.name ||
    typeof meta.description !== "string" ||
    !meta.description ||
    typeof meta.version !== "string" ||
    !meta.version
  ) {
    throw new Error("Style package meta fields must be non-empty strings");
  }

  const preset = pkg.preset as Record<string, unknown>;
  for (const key of [
    "name",
    "description",
    "style",
    "fontFamily",
    "fontSize",
    "fontColor",
    "highlightColor",
    "position",
  ] as const) {
    if (preset[key] === undefined || preset[key] === null || preset[key] === "") {
      throw new Error(`Style package preset.${key} is required`);
    }
  }

  if (typeof preset.style !== "string" || !isCaptionStyle(preset.style)) {
    throw new Error(
      `Style package preset.style must be a built-in style: ${BUILTIN_STYLES.join(", ")}`
    );
  }

  if (
    preset.position !== "top" &&
    preset.position !== "center" &&
    preset.position !== "bottom"
  ) {
    throw new Error('Style package preset.position must be "top", "center", or "bottom"');
  }

  if (typeof preset.fontSize !== "number" || preset.fontSize <= 0) {
    throw new Error("Style package preset.fontSize must be a positive number");
  }

  return {
    schemaVersion: STYLE_PACKAGE_VERSION,
    meta: {
      id: meta.id,
      name: meta.name,
      description: meta.description,
      version: meta.version,
      author: typeof meta.author === "string" ? meta.author : undefined,
      homepage: typeof meta.homepage === "string" ? meta.homepage : undefined,
    },
    preset: {
      name: preset.name as string,
      description: preset.description as string,
      style: preset.style as CaptionStyle,
      fontFamily: preset.fontFamily as string,
      fontSize: preset.fontSize as number,
      fontColor: preset.fontColor as string,
      highlightColor: preset.highlightColor as string,
      position: preset.position as "top" | "center" | "bottom",
    },
  };
}
