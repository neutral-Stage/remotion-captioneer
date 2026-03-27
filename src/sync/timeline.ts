/**
 * Timeline Sync
 *
 * Map animation keyframes to audio timestamps.
 * Define animations declaratively tied to audio timing.
 */

import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export interface Keyframe {
  /** Time in ms when this keyframe triggers */
  timeMs: number;
  /** Value at this keyframe */
  value: number;
  /** Interpolation type */
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "spring";
  /** Spring config (only for spring easing) */
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
}

export interface TimelineAnimation {
  /** Keyframes for this animation */
  keyframes: Keyframe[];
  /** Default value before first keyframe */
  defaultValue?: number;
}

/**
 * Get the interpolated value from a timeline animation at the current frame.
 *
 * @example
 * const scale = useTimelineValue({
 *   keyframes: [
 *     { timeMs: 0, value: 1 },
 *     { timeMs: 1000, value: 1.2, easing: "spring" },
 *     { timeMs: 2000, value: 1 },
 *   ],
 *   defaultValue: 1,
 * });
 */
export function useTimelineValue(anim: TimelineAnimation): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const defaultValue = anim.defaultValue ?? 0;

  const { keyframes } = anim;
  if (keyframes.length === 0) return defaultValue;
  if (keyframes.length === 1) return keyframes[0].value;

  // Before first keyframe
  if (currentTimeMs <= keyframes[0].timeMs) return defaultValue;

  // After last keyframe
  if (currentTimeMs >= keyframes[keyframes.length - 1].timeMs) {
    return keyframes[keyframes.length - 1].value;
  }

  // Find surrounding keyframes
  for (let i = 0; i < keyframes.length - 1; i++) {
    const kf = keyframes[i];
    const next = keyframes[i + 1];

    if (currentTimeMs >= kf.timeMs && currentTimeMs <= next.timeMs) {
      const progress =
        (currentTimeMs - kf.timeMs) / (next.timeMs - kf.timeMs);

      const easing = next.easing ?? "linear";

      if (easing === "spring") {
        const elapsedFrames =
          ((currentTimeMs - kf.timeMs) / 1000) * fps;
        const springVal = spring({
          frame: elapsedFrames,
          fps,
          config: next.springConfig ?? { damping: 10, stiffness: 100 },
        });
        return kf.value + (next.value - kf.value) * springVal;
      }

      const easedProgress = applyEasing(progress, easing);
      return kf.value + (next.value - kf.value) * easedProgress;
    }
  }

  return defaultValue;
}

/**
 * Get a boolean indicating if a specific time has been reached
 */
export function useTimelineTrigger(timeMs: number, windowMs: number = 100): boolean {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  return currentTimeMs >= timeMs && currentTimeMs < timeMs + windowMs;
}

/**
 * Get progress (0-1) through a time range
 */
export function useTimelineProgress(
  startMs: number,
  endMs: number
): number {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  if (currentTimeMs < startMs) return 0;
  if (currentTimeMs > endMs) return 1;
  return (currentTimeMs - startMs) / (endMs - startMs);
}

/**
 * Helper to define a range animation (fade in, stay, fade out)
 */
export function fadeInOut(
  fadeInStartMs: number,
  fadeInEndMs: number,
  fadeOutStartMs: number,
  fadeOutEndMs: number
): TimelineAnimation {
  return {
    keyframes: [
      { timeMs: fadeInStartMs, value: 0 },
      { timeMs: fadeInEndMs, value: 1, easing: "easeOut" },
      { timeMs: fadeOutStartMs, value: 1 },
      { timeMs: fadeOutEndMs, value: 0, easing: "easeIn" },
    ],
    defaultValue: 0,
  };
}

// ─── Easing functions ─────────────────────────────────────────────

function applyEasing(
  t: number,
  easing: "linear" | "easeIn" | "easeOut" | "easeInOut"
): number {
  switch (easing) {
    case "linear":
      return t;
    case "easeIn":
      return t * t;
    case "easeOut":
      return 1 - (1 - t) * (1 - t);
    case "easeInOut":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
}
