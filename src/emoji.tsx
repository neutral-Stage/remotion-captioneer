/**
 * Emoji Reactions
 *
 * Add emoji reactions that appear and animate at word-level timestamps.
 * Perfect for social media content — emojis pop up as words are spoken.
 */

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, random } from "remotion";
import type { CaptionData } from "./types.js";

export interface EmojiReaction {
  /** The emoji character */
  emoji: string;
  /** When to show (ms from video start) */
  timeMs: number;
  /** X position (0-1, relative to video width) */
  x?: number;
  /** Y position (0-1, relative to video height) */
  y?: number;
  /** Size in pixels */
  size?: number;
  /** Animation type */
  animation?: "pop" | "float" | "spin" | "shake";
  /** Duration visible in ms */
  durationMs?: number;
}

interface EmojiReactionsProps {
  readonly reactions: EmojiReaction[];
}

type EmojiAnimation = NonNullable<EmojiReaction["animation"]>;

function computeEmojiTransform(
  anim: EmojiAnimation,
  elapsed: number,
  progress: number,
  fps: number,
  x: number,
  y: number
): { transform: string; opacity: number } {
  if (anim === "pop") {
    const popScale = spring({
      frame: (elapsed / 1000) * fps,
      fps,
      config: { damping: 8, stiffness: 200 },
    });
    return {
      transform: `translate(${x}px, ${y}px) scale(${popScale})`,
      opacity: progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1,
    };
  }

  if (anim === "float") {
    const floatY = y - progress * 100;
    const floatScale = 1 + Math.sin(progress * Math.PI) * 0.2;
    return {
      transform: `translate(${x}px, ${floatY}px) scale(${floatScale})`,
      opacity: 1 - progress,
    };
  }

  if (anim === "spin") {
    const rotation = progress * 360;
    const spinScale = spring({
      frame: (elapsed / 1000) * fps,
      fps,
      config: { damping: 10, stiffness: 150 },
    });
    return {
      transform: `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${spinScale})`,
      opacity: progress > 0.8 ? 1 - (progress - 0.8) / 0.2 : 1,
    };
  }

  const shakeX = Math.sin(elapsed * 0.05) * 10;
  const shakeScale = spring({
    frame: (elapsed / 1000) * fps,
    fps,
    config: { damping: 6, stiffness: 300 },
  });
  return {
    transform: `translate(${x + shakeX}px, ${y}px) scale(${shakeScale})`,
    opacity: progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1,
  };
}

export const EmojiReactions: React.FC<EmojiReactionsProps> = ({ reactions }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  return (
    <AbsoluteFill>
      {reactions.map((reaction, i) => {
        const elapsed = currentTimeMs - reaction.timeMs;
        const duration = reaction.durationMs ?? 1500;

        // Only render if within time window
        if (elapsed < 0 || elapsed > duration) return null;

        const progress = elapsed / duration;
        const anim = reaction.animation ?? "pop";
        const size = reaction.size ?? 48;
        const x = (reaction.x ?? 0.5) * width;
        const y = (reaction.y ?? 0.5) * height;

        const { transform, opacity } = computeEmojiTransform(
          anim,
          elapsed,
          progress,
          fps,
          x,
          y
        );

        return (
          <div
            key={`${reaction.timeMs}-${i}`}
            style={{
              position: "absolute",
              fontSize: size,
              transform,
              opacity,
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            {reaction.emoji}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Auto-generate emoji reactions from captions based on keywords.
 * Maps common words to emojis.
 */
const WORD_EMOJI_MAP: Record<string, string> = {
  // Positive
  "love": "❤️", "heart": "❤️", "happy": "😊", "amazing": "🤩",
  "great": "🔥", "awesome": "🔥", "fire": "🔥", "hot": "🔥",
  "cool": "😎", "nice": "👍", "good": "👍", "yes": "✅",
  "perfect": "💯", "hundred": "💯", "money": "💰", "rich": "💰",
  "star": "⭐", "shine": "✨", "sparkle": "✨", "magic": "✨",
  "rocket": "🚀", "launch": "🚀", "grow": "📈", "up": "📈",
  "clap": "👏", "bravo": "👏", "congratulations": "🎉", "party": "🎉",
  "think": "🤔", "hmm": "🤔", "idea": "💡", "light": "💡",
  "code": "💻", "computer": "💻", "program": "💻", "tech": "💻",
  "phone": "📱", "mobile": "📱", "app": "📱",
  "music": "🎵", "song": "🎵", "listen": "👂",
  "camera": "📷", "photo": "📷", "picture": "📷",
  "video": "🎬", "movie": "🎬", "film": "🎬",
  "world": "🌍", "earth": "🌍", "global": "🌍",
  "time": "⏰", "clock": "⏰", "wait": "⏳",
  "check": "✅", "done": "✅", "finished": "✅", "complete": "✅",
  "stop": "🛑", "warning": "⚠️", "alert": "🚨",
  "question": "❓", "why": "❓", "how": "❓",
  "hello": "👋", "bye": "👋", "wave": "👋",
  "coffee": "☕", "tea": "☕", "drink": "🥤",
  "food": "🍕", "eat": "🍽️", "hungry": "🍽️",
  "sleep": "😴", "tired": "😴", "rest": "😴",
  "run": "🏃", "fast": "⚡", "speed": "⚡",
  "win": "🏆", "champion": "🏆", "first": "🥇",
  "bug": "🐛", "error": "🐛", "fix": "🔧",
  "ship": "🚢", "deploy": "🚢", "release": "🚢",
  "news": "📰", "breaking": "📰",
  "king": "👑", "queen": "👑", "best": "👑",
};

const EMOJI_ANIMATIONS: EmojiAnimation[] = ["pop", "float", "spin", "shake"];

/**
 * Auto-generate reactions from caption data
 */
export function autoGenerateReactions(captionData: CaptionData): EmojiReaction[] {
  const reactions: EmojiReaction[] = [];

  for (const segment of captionData.segments) {
    for (const word of segment.words) {
      const normalized = word.word.toLowerCase().trim();
      const emoji = WORD_EMOJI_MAP[normalized];

      if (emoji) {
        const seed = `${word.startMs}-${normalized}`;
        const animIndex = Math.floor(random(seed + "-anim") * EMOJI_ANIMATIONS.length);
        reactions.push({
          emoji,
          timeMs: word.startMs + (word.endMs - word.startMs) / 2,
          x: 0.15 + random(seed + "-x") * 0.7,
          y: 0.15 + random(seed + "-y") * 0.5,
          size: 40 + random(seed + "-size") * 20,
          animation: EMOJI_ANIMATIONS[animIndex] ?? "pop",
          durationMs: 1200 + random(seed + "-dur") * 800,
        });
      }
    }
  }

  return reactions;
}
