/**
 * PresetShowcase — displays top presets in a grid layout
 */
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AnimatedCaptions } from "../components/AnimatedCaptions.js";
import { applyPreset } from "../presets/index.js";
import { demoCaptions } from "./demo/captions.js";

const SHOWCASE_PRESETS = [
  "tiktok",
  "instagram-reels",
  "youtube-shorts",
  "podcast-clean",
  "cinematic-gold",
  "music-karaoke",
  "tutorial-typewriter",
  "gaming-neon",
] as const;

const FRAMES_PER_PRESET = 75;

export const PresetShowcase: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
      {SHOWCASE_PRESETS.map((key, i) => {
        const props = applyPreset(key);
        return (
          <Sequence key={key} from={i * FRAMES_PER_PRESET} durationInFrames={FRAMES_PER_PRESET}>
            <AbsoluteFill>
              <AnimatedCaptions captions={demoCaptions} {...props} />
              <div
                style={{
                  position: "absolute",
                  top: 32,
                  left: 32,
                  fontFamily: "ui-sans-serif, system-ui, sans-serif",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                {key}
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
