/**
 * Caption Presets
 *
 * Ready-made configurations for common video styles.
 * Apply a preset to instantly get a professional look.
 */

import type { CaptionComponentProps, CaptionStyle } from "../types.js";

export interface CaptionPreset {
  name: string;
  description: string;
  style: CaptionStyle;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  highlightColor: string;
  position: "top" | "center" | "bottom";
}

/**
 * All available presets
 */
export const presets: Record<string, CaptionPreset> = {
  // ─── Social Media ────────────────────────────────────────────
  "tiktok": {
    name: "TikTok",
    description: "Bold white text, yellow highlight, bottom position — classic TikTok style",
    style: "word-highlight",
    fontFamily: "Inter, sans-serif",
    fontSize: 64,
    fontColor: "rgba(255,255,255,0.6)",
    highlightColor: "#FE2C55",
    position: "bottom",
  },

  "instagram-reels": {
    name: "Instagram Reels",
    description: "Clean, modern style with subtle animations",
    style: "karaoke",
    fontFamily: "Inter, sans-serif",
    fontSize: 56,
    fontColor: "rgba(255,255,255,0.5)",
    highlightColor: "#E1306C",
    position: "bottom",
  },

  "youtube-shorts": {
    name: "YouTube Shorts",
    description: "Bright, energetic style with bounce effect",
    style: "bounce",
    fontFamily: "Inter, sans-serif",
    fontSize: 58,
    fontColor: "rgba(255,255,255,0.5)",
    highlightColor: "#FF0000",
    position: "bottom",
  },

  "twitter-clips": {
    name: "Twitter/X Clips",
    description: "Minimal, clean style for Twitter video",
    style: "pill",
    fontFamily: "Inter, sans-serif",
    fontSize: 48,
    fontColor: "rgba(255,255,255,0.5)",
    highlightColor: "#1DA1F2",
    position: "bottom",
  },

  // ─── Podcast / Interview ─────────────────────────────────────
  "podcast-clean": {
    name: "Podcast Clean",
    description: "Clean word highlight for podcast clips",
    style: "word-highlight",
    fontFamily: "Inter, sans-serif",
    fontSize: 52,
    fontColor: "rgba(255,255,255,0.4)",
    highlightColor: "#FFFFFF",
    position: "bottom",
  },

  "podcast-bold": {
    name: "Podcast Bold",
    description: "Bold, high-contrast for podcast highlights",
    style: "glow",
    fontFamily: "Inter, sans-serif",
    fontSize: 60,
    fontColor: "rgba(255,255,255,0.3)",
    highlightColor: "#FFD700",
    position: "bottom",
  },

  // ─── Cinematic ───────────────────────────────────────────────
  "cinematic-gold": {
    name: "Cinematic Gold",
    description: "Elegant gold glow for cinematic content",
    style: "glow",
    fontFamily: "Playfair Display, serif",
    fontSize: 56,
    fontColor: "rgba(255,255,255,0.3)",
    highlightColor: "#D4AF37",
    position: "bottom",
  },

  "cinematic-white": {
    name: "Cinematic White",
    description: "Clean white typewriter for dramatic reveals",
    style: "typewriter",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 44,
    fontColor: "#FFFFFF",
    highlightColor: "#00FF88",
    position: "center",
  },

  "cinematic-neon": {
    name: "Cinematic Neon",
    description: "Neon glow for cyberpunk/futuristic content",
    style: "glow",
    fontFamily: "Inter, sans-serif",
    fontSize: 56,
    fontColor: "rgba(255,255,255,0.25)",
    highlightColor: "#00FFFF",
    position: "bottom",
  },

  // ─── Music ───────────────────────────────────────────────────
  "music-karaoke": {
    name: "Music Karaoke",
    description: "Classic karaoke fill for music videos",
    style: "karaoke",
    fontFamily: "Inter, sans-serif",
    fontSize: 60,
    fontColor: "rgba(255,255,255,0.3)",
    highlightColor: "#FF6B6B",
    position: "bottom",
  },

  "music-wave": {
    name: "Music Wave",
    description: "Rhythmic wave animation synced to the beat",
    style: "wave",
    fontFamily: "Inter, sans-serif",
    fontSize: 56,
    fontColor: "rgba(255,255,255,0.35)",
    highlightColor: "#00D4FF",
    position: "bottom",
  },

  // ─── Tutorial / Educational ──────────────────────────────────
  "tutorial-typewriter": {
    name: "Tutorial Typewriter",
    description: "Typewriter effect for code tutorials and walkthroughs",
    style: "typewriter",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 42,
    fontColor: "#FFFFFF",
    highlightColor: "#00FF88",
    position: "center",
  },

  "tutorial-erase": {
    name: "Tutorial Erase",
    description: "Type-then-erase for step-by-step tutorials",
    style: "typewriter-erase",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: 42,
    fontColor: "#FFFFFF",
    highlightColor: "#00FF88",
    position: "center",
  },

  // ─── Minimal ─────────────────────────────────────────────────
  "minimal-white": {
    name: "Minimal White",
    description: "Subtle white text, minimal animation",
    style: "word-highlight",
    fontFamily: "Inter, sans-serif",
    fontSize: 48,
    fontColor: "rgba(255,255,255,0.35)",
    highlightColor: "rgba(255,255,255,0.9)",
    position: "bottom",
  },

  "minimal-subtle": {
    name: "Minimal Subtle",
    description: "Nearly invisible until active — very clean",
    style: "word-highlight",
    fontFamily: "Inter, sans-serif",
    fontSize: 44,
    fontColor: "rgba(255,255,255,0.2)",
    highlightColor: "rgba(255,255,255,0.8)",
    position: "bottom",
  },

  // ─── Gaming ──────────────────────────────────────────────────
  "gaming-neon": {
    name: "Gaming Neon",
    description: "Neon glow style for gaming content and streams",
    style: "glow",
    fontFamily: "Inter, sans-serif",
    fontSize: 54,
    fontColor: "rgba(255,255,255,0.3)",
    highlightColor: "#00FF88",
    position: "bottom",
  },

  "gaming-bold": {
    name: "Gaming Bold",
    description: "Big bold bounce for high-energy gaming clips",
    style: "bounce",
    fontFamily: "Inter, sans-serif",
    fontSize: 64,
    fontColor: "rgba(255,255,255,0.4)",
    highlightColor: "#FF0055",
    position: "bottom",
  },

  // ─── News / Professional ────────────────────────────────────
  "news-ticker": {
    name: "News Ticker",
    description: "Clean typewriter for news and professional content",
    style: "typewriter",
    fontFamily: "Inter, sans-serif",
    fontSize: 44,
    fontColor: "#FFFFFF",
    highlightColor: "#00BCD4",
    position: "center",
  },

  "documentary": {
    name: "Documentary",
    description: "Elegant spotlight for documentary narration",
    style: "spotlight",
    fontFamily: "Playfair Display, serif",
    fontSize: 52,
    fontColor: "rgba(255,255,255,0.3)",
    highlightColor: "#D4AF37",
    position: "bottom",
  },

  // ─── Educational ────────────────────────────────────────────
  "education-highlighter": {
    name: "Education Highlighter",
    description: "Yellow highlighter for study and educational content",
    style: "highlighter",
    fontFamily: "Inter, sans-serif",
    fontSize: 52,
    fontColor: "rgba(255,255,255,0.4)",
    highlightColor: "#FFEB3B",
    position: "bottom",
  },

  "education-scale": {
    name: "Education Scale",
    description: "Words scale up to emphasize key points",
    style: "scale",
    fontFamily: "Inter, sans-serif",
    fontSize: 52,
    fontColor: "rgba(255,255,255,0.3)",
    highlightColor: "#34D399",
    position: "bottom",
  },

  // ─── Fun / Creative ─────────────────────────────────────────
  "fun-rainbow": {
    name: "Fun Rainbow",
    description: "Cycling rainbow colors for fun, playful content",
    style: "rainbow",
    fontFamily: "Inter, sans-serif",
    fontSize: 60,
    fontColor: "rgba(255,255,255,0.3)",
    highlightColor: "#FF00FF",
    position: "bottom",
  },

  "retro-flicker": {
    name: "Retro Flicker",
    description: "Neon sign flicker for retro/vintage content",
    style: "flicker",
    fontFamily: "Inter, sans-serif",
    fontSize: 56,
    fontColor: "rgba(255,255,255,0.2)",
    highlightColor: "#FF9500",
    position: "bottom",
  },
};

/**
 * Get a preset by name
 */
export function getPreset(name: string): CaptionPreset | null {
  return presets[name] ?? null;
}

/**
 * Get all preset names grouped by category
 */
export function getPresetCategories(): Record<string, string[]> {
  return {
    "Social Media": ["tiktok", "instagram-reels", "youtube-shorts", "twitter-clips"],
    "Podcast": ["podcast-clean", "podcast-bold"],
    "Cinematic": ["cinematic-gold", "cinematic-white", "cinematic-neon"],
    "Music": ["music-karaoke", "music-wave"],
    "Tutorial": ["tutorial-typewriter", "tutorial-erase"],
    "Minimal": ["minimal-white", "minimal-subtle"],
    "Gaming": ["gaming-neon", "gaming-bold"],
    "News & Documentary": ["news-ticker", "documentary"],
    "Education": ["education-highlighter", "education-scale"],
    "Fun & Creative": ["fun-rainbow", "retro-flicker"],
  };
}

/**
 * Apply a preset to get AnimatedCaptions props
 */
export function applyPreset(presetName: string): Partial<CaptionComponentProps> {
  const preset = getPreset(presetName);
  if (!preset) {
    console.warn(`Unknown preset: "${presetName}". Available: ${Object.keys(presets).join(", ")}`);
    return {};
  }

  return {
    style: preset.style,
    fontFamily: preset.fontFamily,
    fontSize: preset.fontSize,
    fontColor: preset.fontColor,
    highlightColor: preset.highlightColor,
    position: preset.position,
  };
}
