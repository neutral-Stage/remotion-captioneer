// Example 7: Emoji Reactions
// Add emoji reactions that pop up at word-level timestamps

import { AbsoluteFill } from "remotion";
import {
  AnimatedCaptions,
  EmojiReactions,
  autoGenerateReactions,
} from "remotion-captioneer";
import captions from "./captions.json";

// Auto-generate reactions from keywords in captions
const reactions = autoGenerateReactions(captions);

export const EmojiVideo = () => (
  <AbsoluteFill style={{ background: "#0a0a0a" }}>
    <AnimatedCaptions
      captions={captions}
      style="word-highlight"
      highlightColor="#FFD700"
    />
    <EmojiReactions reactions={reactions} />
  </AbsoluteFill>
);

// Or define reactions manually:
// const manualReactions = [
//   { emoji: "🔥", timeMs: 1500, x: 0.3, y: 0.3, size: 60, animation: "pop" },
//   { emoji: "❤️", timeMs: 3000, x: 0.7, y: 0.4, size: 48, animation: "float" },
//   { emoji: "🚀", timeMs: 5000, x: 0.5, y: 0.2, size: 56, animation: "spin" },
// ];
