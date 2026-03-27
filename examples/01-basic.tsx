// Example 1: Basic Captioned Video
// Shows the simplest way to add animated captions

import { AbsoluteFill } from "remotion";
import { AnimatedCaptions } from "remotion-captioneer";
import captions from "./captions.json";

export const BasicExample = () => (
  <AbsoluteFill style={{ background: "#0a0a0a" }}>
    <AnimatedCaptions
      captions={captions}
      style="word-highlight"
      highlightColor="#FFD700"
      position="bottom"
    />
  </AbsoluteFill>
);
