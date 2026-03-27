// Example 3: Audio-Video Sync
// Beat-reactive animations synchronized to audio

import { AbsoluteFill, Audio, staticFile } from "remotion";
import {
  AnimatedCaptions,
  AudioSyncProvider,
  useBeatPulse,
  useVolume,
  analyzeAudio,
} from "remotion-captioneer";
import captions from "./captions.json";

// Pre-analyze audio (run this once, cache the result)
// const analysis = await analyzeAudio("my-audio.mp4");

const BeatReactiveContent = () => {
  const pulse = useBeatPulse();
  const volume = useVolume();

  return (
    <AbsoluteFill
      style={{
        background: "#0a0a0a",
        // Background pulses with the beat
        transform: `scale(${1 + pulse * 0.03})`,
      }}
    >
      <Audio src={staticFile("audio.mp3")} />
      <AnimatedCaptions
        captions={captions}
        style="word-highlight"
        // Caption size reacts to volume
        fontSize={Math.round(48 + volume * 16)}
        highlightColor="#FFD700"
      />
    </AbsoluteFill>
  );
};

// Wrap with AudioSyncProvider (pass your pre-analyzed data)
// export const SyncedVideo = () => (
//   <AudioSyncProvider analysis={audioAnalysis}>
//     <BeatReactiveContent />
//   </AudioSyncProvider>
// );
