/**
 * remotion-captioneer
 *
 * Drop-in animated captions for Remotion.
 * Audio → word-level synced subtitle components.
 * Supports: Local Whisper, OpenAI, Groq, Deepgram, AssemblyAI
 *
 * Also includes: Audio-video sync, templates, and layout primitives.
 */

// Types (compatible with @remotion/captions)
export type {
  Caption,
  TikTokPage,
  Word,
  CaptionSegment,
  CaptionData,
  CaptionStyle,
  CaptionComponentProps,
  WhisperOptions,
  ProcessAudioOptions,
} from "./types.js";

export { toCaptionArray, fromCaptionArray } from "./types.js";

// Components
export {
  AnimatedCaptions,
  WordHighlight,
  Karaoke,
  Typewriter,
  Bounce,
  Wave,
  Glow,
  TypewriterErase,
  Pill,
} from "./components/index.js";

// Whisper integration (local)
export {
  processAudio,
  loadCaptions,
  installWhisper,
  downloadModel,
} from "./whisper.js";

// STT Providers
export type {
  STTProvider,
  STTProviderOptions,
  ProviderName,
  ProviderConfig,
} from "./providers/index.js";

export {
  OpenAIProvider,
  GroqProvider,
  DeepgramProvider,
  AssemblyAIProvider,
  createProvider,
  detectProvider,
  listProviders,
} from "./providers/index.js";

// ─── Audio-Video Sync ─────────────────────────────────────────────

export {
  analyzeAudio,
  type AudioAnalysis,
  type BeatInfo,
  type VolumeFrame,
  type AnalyzeOptions,
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
  useTimelineValue,
  useTimelineTrigger,
  useTimelineProgress,
  fadeInOut,
  type Keyframe,
  type TimelineAnimation,
} from "./sync/index.js";

// ─── Templates ────────────────────────────────────────────────────

export type {
  VideoTemplate,
  Scene,
  Block,
  BlockType,
  DesignTokens,
  ColorTokens,
  TypographyTokens,
  AnimationConfig,
  TextBlock,
  ImageBlock,
  VideoBlock,
  AudioBlock,
  CaptionsBlock,
  DividerBlock,
  SpacerBlock,
  ColumnsBlock,
  GridBlock,
  LogoBlock,
} from "./templates/index.js";

export {
  createIntroScene,
  createCaptionScene,
  createOutroScene,
  createDividerScene,
  buildTemplate,
  TemplateComposition,
} from "./templates/index.js";

// ─── Layout Primitives ────────────────────────────────────────────

export {
  Container,
  Stack,
  Row,
  Columns,
  Grid,
  Center,
  Positioned,
  Overlay,
  GradientBg,
  FadeIn,
  SlideUp,
} from "./layouts/index.js";

// Utilities
export {
  getActiveSegment,
  getActiveWord,
  getActiveWordIndex,
  getWordProgress,
  groupWordsIntoLines,
  smartWrap,
  paginateCaptions,
  estimateReadingTimeMs,
  msToFrame,
  frameToMs,
} from "./utils.js";

// Config
export { loadConfig } from "./config.js";
export type { CaptioneerConfig } from "./config.js";
