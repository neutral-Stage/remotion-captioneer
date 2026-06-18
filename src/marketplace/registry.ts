/**
 * Merge installed marketplace packages with built-in presets.
 */

import { presets, type CaptionPreset } from "../presets/index.js";
import { loadInstalledStylePackages } from "./loader.js";
import type { StylePackage } from "./schema.js";

let cachedMarketplace: Record<string, CaptionPreset> | null = null;

export function marketplacePresetKey(pkg: StylePackage): string {
  return `marketplace:${pkg.meta.id}`;
}

export function getMarketplacePresets(cwd?: string): Record<string, CaptionPreset> {
  if (cachedMarketplace && !cwd) return cachedMarketplace;

  const out: Record<string, CaptionPreset> = {};
  for (const pkg of loadInstalledStylePackages(cwd)) {
    out[marketplacePresetKey(pkg)] = pkg.preset;
  }

  if (!cwd) cachedMarketplace = out;
  return out;
}

export function getAllPresets(cwd?: string): Record<string, CaptionPreset> {
  return {
    ...presets,
    ...getMarketplacePresets(cwd),
  };
}

export function getPresetWithMarketplace(
  name: string,
  cwd?: string
): CaptionPreset | null {
  const all = getAllPresets(cwd);
  return all[name] ?? null;
}

export function invalidateMarketplaceCache(): void {
  cachedMarketplace = null;
}
