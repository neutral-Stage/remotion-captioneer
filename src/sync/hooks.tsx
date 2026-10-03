/**
 * Audio Sync Hooks
 *
 * React hooks for synchronizing animations to audio data.
 * Drop these into any Remotion composition.
 */

import React, { createContext, useContext, useMemo } from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";
import type { AudioAnalysis, BeatInfo, VolumeFrame } from "./audio-analysis.js";

// ─── Context ──────────────────────────────────────────────────────

const AudioSyncContext = createContext<AudioAnalysis | null>(null);

/**
 * Provider that makes audio analysis available to all child components.
 * Wrap your composition with this.
 */
export const AudioSyncProvider: React.FC<{
  readonly analysis: AudioAnalysis;
  readonly children: React.ReactNode;
}> = ({ analysis, children }) => {
  return (
    <AudioSyncContext.Provider value={analysis}>
      {children}
    </AudioSyncContext.Provider>
  );
};

// ─── Hooks ────────────────────────────────────────────────────────

/**
 * Get the full audio analysis data
 */
export function useAudioAnalysis(): AudioAnalysis {
  const analysis = useContext(AudioSyncContext);
  if (!analysis) {
    throw new Error(
      "useAudioAnalysis must be used within an <AudioSyncProvider>"
    );
  }
  return analysis;
}

/**
 * Get current volume level (0-1) at the current frame.
 * Great for scaling, opacity, or pulse animations.
 */
export function useVolume(): number {
  const analysis = useAudioAnalysis();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  return useMemo(() => {
    return getVolumeAtTime(analysis.volumeFrames, currentTimeMs);
  }, [analysis.volumeFrames, currentTimeMs]);
}

/**
 * Get beat information at the current frame.
 * Returns null if not on a beat, or { strength } if on a beat.
 *
 * Use this for pulse effects, flash animations, etc.
 */
export function useBeat(threshold: number = 0.3): BeatInfo | null {
  const analysis = useAudioAnalysis();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  return useMemo(() => {
    const beatWindowMs = 1000 / fps; // One frame window

    return (
      analysis.beats.find(
        (b) =>
          Math.abs(b.timeMs - currentTimeMs) < beatWindowMs &&
          b.strength >= threshold
      ) ?? null
    );
  }, [analysis.beats, currentTimeMs, fps, threshold]);
}

/**
 * Get energy level (0-1) at current frame.
 * Smoothed over 500ms segments.
 * Use for background intensity, color shifts, etc.
 */
export function useEnergy(): number {
  const analysis = useAudioAnalysis();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  return useMemo(() => {
    return findEnergyAtTime(analysis.energy, currentTimeMs);
  }, [analysis.energy, currentTimeMs]);
}

/**
 * Get a spring-animated value that pulses on beats.
 * Returns 0 normally, springs to 1 on each beat.
 */
export function useBeatPulse(threshold: number = 0.3): number {
  const analysis = useAudioAnalysis();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  const lastBeat = useMemo(
    () => findLastBeatBefore(analysis.beats, currentTimeMs),
    [analysis.beats, currentTimeMs]
  );

  if (!lastBeat || lastBeat.strength < threshold) return 0;

  const framesSinceBeat = ((currentTimeMs - lastBeat.timeMs) / 1000) * fps;

  return spring({
    frame: framesSinceBeat,
    fps,
    config: {
      damping: 12,
      stiffness: 200,
      mass: 0.5,
    },
  });
}

/**
 * Check if we're currently "on a beat" within a given window
 */
export function useIsOnBeat(windowMs: number = 150): boolean {
  const analysis = useAudioAnalysis();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  return useMemo(() => {
    return analysis.beats.some(
      (b) => Math.abs(b.timeMs - currentTimeMs) < windowMs
    );
  }, [analysis.beats, currentTimeMs, windowMs]);
}

/**
 * Get the time until the next beat in ms
 */
export function useTimeToNextBeat(): number {
  const analysis = useAudioAnalysis();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;

  return useMemo(() => {
    const next = findNextBeatAfter(analysis.beats, currentTimeMs);
    return next ? next.timeMs - currentTimeMs : Infinity;
  }, [analysis.beats, currentTimeMs]);
}

// ─── Utilities ────────────────────────────────────────────────────

function findLastBeatBefore(
  beats: BeatInfo[],
  timeMs: number
): BeatInfo | undefined {
  if (beats.length === 0) return undefined;

  let lo = 0;
  let hi = beats.length - 1;
  let best = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (beats[mid]!.timeMs <= timeMs) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return best >= 0 ? beats[best] : undefined;
}

function findNextBeatAfter(
  beats: BeatInfo[],
  timeMs: number
): BeatInfo | undefined {
  if (beats.length === 0) return undefined;

  let lo = 0;
  let hi = beats.length - 1;
  let best = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (beats[mid]!.timeMs > timeMs) {
      best = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  return best >= 0 ? beats[best] : undefined;
}

function findEnergyAtTime(
  energy: AudioAnalysis["energy"],
  timeMs: number
): number {
  if (energy.length === 0) return 0;

  let lo = 0;
  let hi = energy.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const seg = energy[mid]!;
    if (timeMs < seg.startMs) {
      hi = mid - 1;
    } else if (timeMs >= seg.endMs) {
      lo = mid + 1;
    } else {
      return seg.level;
    }
  }

  return 0;
}

/**
 * Get volume at a specific time from volume frames
 */
function getVolumeAtTime(
  volumeFrames: VolumeFrame[],
  timeMs: number
): number {
  if (volumeFrames.length === 0) return 0;

  let lo = 0;
  let hi = volumeFrames.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const frame = volumeFrames[mid]!;
    if (timeMs < frame.timeMs) {
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }

  const afterIndex = Math.min(lo, volumeFrames.length - 1);
  const beforeIndex = Math.max(0, afterIndex - 1);
  const before = volumeFrames[beforeIndex]!;
  const after = volumeFrames[afterIndex]!;

  if (after.timeMs === before.timeMs) return before.volume;

  const t = (timeMs - before.timeMs) / (after.timeMs - before.timeMs);
  return before.volume + (after.volume - before.volume) * t;
}

/**
 * Utility: scale a value based on volume
 */
export function volumeScale(
  volume: number,
  min: number = 1,
  max: number = 1.3
): number {
  return min + volume * (max - min);
}

/**
 * Utility: opacity based on energy
 */
export function energyOpacity(
  energy: number,
  min: number = 0.3,
  max: number = 1
): number {
  return min + energy * (max - min);
}
