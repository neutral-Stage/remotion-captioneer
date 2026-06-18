// Example 12 — Right-to-left captions (Arabic / Hebrew)
//
// Set textDirection on AnimatedCaptions for RTL scripts.

import { AbsoluteFill } from "remotion";
import { AnimatedCaptions } from "remotion-captioneer";
import captions from "./captions-rtl.json";

export const RtlExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
    <AnimatedCaptions
      captions={captions}
      style="word-highlight"
      highlightColor="#3b82f6"
      textDirection="rtl"
      position="bottom"
    />
  </AbsoluteFill>
);
