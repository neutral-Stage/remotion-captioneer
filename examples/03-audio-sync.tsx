// Example 3: Audio-Video Sync
// Requires ffmpeg on PATH for analyzeAudio()

import { AbsoluteFill, Audio, staticFile } from "remotion";
import {
  AnimatedCaptions,
  AudioSyncProvider,
  useBeatPulse,
  useVolume,
} from "remotion-captioneer";
import type { AudioAnalysis } from "remotion-captioneer";
import captions from "./captions.json";

// Generate once in Node: import { analyzeAudio } from "remotion-captioneer";
// const analysis = await analyzeAudio("./public/audio.mp3");
const audioAnalysis = {
  bpm: 120,
  beats: [{ timeMs: 0 }, { timeMs: 500 }, { timeMs: 1000 }],
  volumeFrames: [],
} as unknown as AudioAnalysis;

const BeatReactiveContent = () => {
  const pulse = useBeatPulse();
  const volume = useVolume();

  return (
    <AbsoluteFill
      style={{
        background: "#0a0a0a",
        transform: `scale(${1 + pulse * 0.03})`,
      }}
    >
      <Audio src={staticFile("audio.mp3")} />
      <AnimatedCaptions
        captions={captions}
        style="word-highlight"
        fontSize={Math.round(48 + volume * 16)}
        highlightColor="#FFD700"
      />
    </AbsoluteFill>
  );
};

export const SyncedVideo = () => (
  <AudioSyncProvider analysis={audioAnalysis}>
    <BeatReactiveContent />
  </AudioSyncProvider>
);
