// Example 2: Using Presets
// Apply a professional look instantly

import { AbsoluteFill } from "remotion";
import { AnimatedCaptions, applyPreset } from "remotion-captioneer";
import captions from "./captions.json";

// TikTok style
export const TikTokVideo = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <AnimatedCaptions captions={captions} {...applyPreset("tiktok")} />
  </AbsoluteFill>
);

// Cinematic gold
export const CinematicVideo = () => (
  <AbsoluteFill
    style={{ background: "linear-gradient(135deg, #0a0a0a, #1a1a2e)" }}
  >
    <AnimatedCaptions captions={captions} {...applyPreset("cinematic-gold")} />
  </AbsoluteFill>
);

// Gaming neon
export const GamingClip = () => (
  <AbsoluteFill style={{ background: "#0a0a0a" }}>
    <AnimatedCaptions captions={captions} {...applyPreset("gaming-neon")} />
  </AbsoluteFill>
);
