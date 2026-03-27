/**
 * Audio-Video Sync System
 *
 * Pre-analyze audio to extract beat/tempo, volume envelope,
 * and energy data for frame-perfect animation synchronization.
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, basename, extname } from "path";

export interface BeatInfo {
  /** Beat timestamp in ms */
  timeMs: number;
  /** Beat strength 0-1 */
  strength: number;
}

export interface VolumeFrame {
  /** Timestamp in ms */
  timeMs: number;
  /** RMS volume 0-1 */
  volume: number;
  /** Peak volume 0-1 */
  peak: number;
}

export interface AudioAnalysis {
  /** Beats detected in the audio */
  beats: BeatInfo[];
  /** Volume over time (sampled) */
  volumeFrames: VolumeFrame[];
  /** Detected BPM (approximate) */
  bpm: number;
  /** Total duration in ms */
  durationMs: number;
  /** Energy levels per segment (for background intensity) */
  energy: Array<{ startMs: number; endMs: number; level: number }>;
}

export interface AnalyzeOptions {
  /** Path to ffmpeg binary */
  ffmpegPath?: string;
  /** Volume sample interval in ms */
  sampleIntervalMs?: number;
  /** Beat sensitivity 0-1 (higher = more beats) */
  beatSensitivity?: number;
}

/**
 * Analyze audio file to extract beats, volume, and energy data.
 *
 * Uses ffmpeg to extract volume samples, then applies beat detection.
 */
export async function analyzeAudio(
  audioPath: string,
  options: AnalyzeOptions = {}
): Promise<AudioAnalysis> {
  const resolved = resolve(audioPath);
  if (!existsSync(resolved)) {
    throw new Error(`Audio file not found: ${resolved}`);
  }

  const ffmpegPath = options.ffmpegPath ?? "ffmpeg";
  const sampleIntervalMs = options.sampleIntervalMs ?? 50;

  const cacheDir = resolve(process.cwd(), ".captioneer-cache");
  mkdirSync(cacheDir, { recursive: true });

  const baseName = basename(resolved, extname(resolved));
  const cachePath = resolve(cacheDir, `${baseName}-analysis.json`);

  // Check cache
  if (existsSync(cachePath)) {
    console.log("✅ Using cached audio analysis");
    return JSON.parse(readFileSync(cachePath, "utf-8")) as AudioAnalysis;
  }

  console.log("🎵 Analyzing audio...");

  // Extract volume data using ffmpeg volumedetect + astats
  let volumeData: string;
  try {
    // Use ffmpeg astats filter to get per-segment volume
    const statsCmd = `"${ffmpegPath}" -i "${resolved}" -af "astats=metadata=1:reset=${Math.round(sampleIntervalMs / 1000 * 30)}" -f null - 2>&1`;
    volumeData = execSync(statsCmd, {
      encoding: "utf-8",
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (e: any) {
    // Fallback: generate synthetic volume from duration
    console.warn("⚠️ ffmpeg not available, generating synthetic audio analysis");
    return generateSyntheticAnalysis(resolved);
  }

  // Parse RMS volume from astats output
  const rmsMatches = volumeData.matchAll(
    /RMS level dB:\s*([-\d.]+)/g
  );

  const volumeFrames: VolumeFrame[] = [];
  let frameIndex = 0;

  for (const match of rmsMatches) {
    const db = parseFloat(match[1]);
    // Convert dB to 0-1 range (-60dB = 0, 0dB = 1)
    const volume = Math.max(0, Math.min(1, (db + 60) / 60));
    volumeFrames.push({
      timeMs: frameIndex * sampleIntervalMs,
      volume,
      peak: Math.min(1, volume * 1.5),
    });
    frameIndex++;
  }

  // If we couldn't parse volume data, fall back to synthetic
  if (volumeFrames.length === 0) {
    console.warn("⚠️ Could not parse volume data, generating synthetic analysis");
    return generateSyntheticAnalysis(resolved);
  }

  // Detect beats using onset detection
  const beats = detectBeats(volumeFrames, options.beatSensitivity ?? 0.5);

  // Estimate BPM
  const bpm = estimateBPM(beats);

  // Compute energy levels
  const energy = computeEnergy(volumeFrames);

  const durationMs =
    volumeFrames.length > 0
      ? volumeFrames[volumeFrames.length - 1].timeMs
      : 0;

  const analysis: AudioAnalysis = {
    beats,
    volumeFrames,
    bpm,
    durationMs,
    energy,
  };

  // Cache result
  writeFileSync(cachePath, JSON.stringify(analysis, null, 2));
  console.log(
    `✅ Audio analysis complete: ${beats.length} beats, ~${bpm} BPM, ${durationMs}ms`
  );

  return analysis;
}

/**
 * Simple onset-based beat detection
 */
function detectBeats(
  volumeFrames: VolumeFrame[],
  sensitivity: number
): BeatInfo[] {
  const beats: BeatInfo[] = [];
  const threshold = 0.3 * (1 - sensitivity * 0.5);
  const minGapMs = 150; // Minimum gap between beats

  let lastBeatTime = -minGapMs;

  for (let i = 1; i < volumeFrames.length - 1; i++) {
    const prev = volumeFrames[i - 1].volume;
    const curr = volumeFrames[i].volume;
    const next = volumeFrames[i + 1].volume;

    // Peak detection: current is higher than neighbors and above threshold
    if (
      curr > prev &&
      curr > next &&
      curr > threshold &&
      volumeFrames[i].timeMs - lastBeatTime >= minGapMs
    ) {
      beats.push({
        timeMs: volumeFrames[i].timeMs,
        strength: Math.min(1, curr),
      });
      lastBeatTime = volumeFrames[i].timeMs;
    }
  }

  return beats;
}

/**
 * Estimate BPM from beat intervals
 */
function estimateBPM(beats: BeatInfo[]): number {
  if (beats.length < 2) return 120;

  const intervals: number[] = [];
  for (let i = 1; i < Math.min(beats.length, 100); i++) {
    intervals.push(beats[i].timeMs - beats[i - 1].timeMs);
  }

  if (intervals.length === 0) return 120;

  // Median interval
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];

  if (median <= 0) return 120;
  return Math.round(60000 / median);
}

/**
 * Compute energy levels per 500ms segment
 */
function computeEnergy(
  volumeFrames: VolumeFrame[]
): Array<{ startMs: number; endMs: number; level: number }> {
  const SEGMENT_MS = 500;
  const energy: Array<{ startMs: number; endMs: number; level: number }> = [];

  let i = 0;
  while (i < volumeFrames.length) {
    const startMs = volumeFrames[i].timeMs;
    let sum = 0;
    let count = 0;

    while (
      i < volumeFrames.length &&
      volumeFrames[i].timeMs < startMs + SEGMENT_MS
    ) {
      sum += volumeFrames[i].volume;
      count++;
      i++;
    }

    energy.push({
      startMs,
      endMs: startMs + SEGMENT_MS,
      level: count > 0 ? sum / count : 0,
    });
  }

  return energy;
}

/**
 * Generate synthetic analysis when ffmpeg is not available
 */
function generateSyntheticAnalysis(audioPath: string): AudioAnalysis {
  // Estimate duration from file (rough)
  const durationMs = 30000; // Default 30s

  const volumeFrames: VolumeFrame[] = [];
  const intervalMs = 50;
  for (let t = 0; t < durationMs; t += intervalMs) {
    volumeFrames.push({
      timeMs: t,
      volume: 0.3 + Math.random() * 0.3,
      peak: 0.5 + Math.random() * 0.3,
    });
  }

  const beats: BeatInfo[] = [];
  for (let t = 0; t < durationMs; t += 500) {
    beats.push({ timeMs: t, strength: 0.5 + Math.random() * 0.5 });
  }

  return {
    beats,
    volumeFrames,
    bpm: 120,
    durationMs,
    energy: computeEnergy(volumeFrames),
  };
}
