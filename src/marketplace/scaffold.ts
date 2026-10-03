/**
 * Style marketplace scaffolding — draft new style packages for contributors.
 */

import { validateStylePackage, isCaptionStyle, type StylePackage } from "./schema.js";
import type { CaptionStyle } from "../types.js";

export interface ScaffoldOptions {
  name: string;
  style?: string;
  highlightColor?: string;
  fontColor?: string;
  fontFamily?: string;
  fontSize?: number;
  position?: string;
  author?: string;
  description?: string;
}

export interface ScaffoldResult {
  pkg: StylePackage;
  fileName: string;
}

const ID_MAX_LENGTH = 64;

/**
 * Slugify a display name into a valid package id
 * (`^[a-z0-9][a-z0-9._-]{0,63}$`). Returns null when nothing usable remains.
 */
export function slugifyPackageId(name: string): string | null {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, ID_MAX_LENGTH)
    .replace(/\.+$/, "");
  return slug.length > 0 ? slug : null;
}

/**
 * Build a schema-valid style package draft from contributor input.
 * The draft is run through the marketplace validator before being returned,
 * so anything this function emits is installable as-is.
 */
export function createStylePackageDraft(opts: ScaffoldOptions): ScaffoldResult {
  const id = slugifyPackageId(opts.name);
  if (!id) {
    throw new Error(
      `Cannot derive a package id from "${opts.name}" — use at least one letter or digit`
    );
  }

  if (opts.style && !isCaptionStyle(opts.style)) {
    throw new Error(
      `Unknown style "${opts.style}" — run "captioneer styles" to list the 14 built-in styles`
    );
  }
  const style: CaptionStyle = isCaptionStyle(opts.style ?? "")
    ? (opts.style as CaptionStyle)
    : "word-highlight";

  const position =
    opts.position === "top" || opts.position === "center" || opts.position === "bottom"
      ? opts.position
      : "bottom";

  const fontSize =
    typeof opts.fontSize === "number" && Number.isFinite(opts.fontSize) && opts.fontSize > 0
      ? Math.round(opts.fontSize)
      : 56;

  const displayName = opts.name.trim().replace(/\s+/g, " ");

  const raw = {
    schemaVersion: 1,
    meta: {
      id,
      name: displayName,
      description:
        opts.description?.trim() ||
        `${displayName} caption style built on the ${style} animation.`,
      version: "1.0.0",
      author: opts.author?.trim() || undefined,
    },
    preset: {
      name: displayName,
      description: `${displayName} — ${style} preset`,
      style,
      fontFamily: opts.fontFamily?.trim() || "Inter, sans-serif",
      fontSize,
      fontColor: opts.fontColor?.trim() || "rgba(255,255,255,0.4)",
      highlightColor: opts.highlightColor?.trim() || "#FE2C55",
      position,
    },
  };

  return {
    pkg: validateStylePackage(raw),
    fileName: `${id}.captioneer-style.json`,
  };
}
