// Example 09 — Preset picker pattern
import { AbsoluteFill } from "remotion";
import { AnimatedCaptions, applyPreset } from "remotion-captioneer";
import captions from "./captions.json";

const PRESET_KEYS = ["tiktok", "podcast-clean", "cinematic-gold", "gaming-neon"] as const;

/** Render with a preset key — same as preview configurator / docs demo */
export const PresetPickerExample = ({
  preset = "tiktok",
}: {
  preset?: (typeof PRESET_KEYS)[number];
}) => (
  <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
    <AnimatedCaptions captions={captions} {...applyPreset(preset)} />
  </AbsoluteFill>
);

export { PRESET_KEYS };
