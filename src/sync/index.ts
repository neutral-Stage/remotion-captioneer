export {
  analyzeAudio,
  type AudioAnalysis,
  type BeatInfo,
  type VolumeFrame,
  type AnalyzeOptions,
} from "./audio-analysis.js";

export {
  AudioSyncProvider,
  useAudioAnalysis,
  useVolume,
  useBeat,
  useEnergy,
  useBeatPulse,
  useIsOnBeat,
  useTimeToNextBeat,
  volumeScale,
  energyOpacity,
} from "./hooks.js";

export {
  useTimelineValue,
  useTimelineTrigger,
  useTimelineProgress,
  fadeInOut,
  type Keyframe,
  type TimelineAnimation,
} from "./timeline.js";
