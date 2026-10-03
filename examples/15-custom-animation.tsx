// Example 15 — Custom keyframe animations (motion as data)
//
// A style package (or your JSX) can define word motion with a handful of
// keyframes sampled over each word's spoken progress. Colors must be hex,
// values are bounded — packages stay inert data, no code execution.
//
// The same shape works in marketplace packages (preset.animation) and the
// render CLI: npx captioneer render captions.json --audio clip.mp3 --animation anim.json

import { AbsoluteFill } from "remotion";
import { AnimatedCaptions, type AnimationSpec } from "remotion-captioneer";
import captions from "./captions.json";

const popIn: AnimationSpec = {
  easing: "ease-out",
  keyframes: [
    { at: 0, scale: 0.4, opacity: 0, yOffset: 24 },
    { at: 0.6, scale: 1.2, opacity: 1, yOffset: -6, color: "#FE2C55" },
    { at: 1, scale: 1, opacity: 1, yOffset: 0, color: "#FFFFFF" },
  ],
};

export const CustomAnimationExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
    <AnimatedCaptions captions={captions} animation={popIn} highlightColor="#FE2C55" />
  </AbsoluteFill>
);
