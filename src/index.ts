/**
 * remotion-captioneer
 *
 * Drop-in animated captions for Remotion.
 * Audio → word-level synced subtitle components.
 * Supports: Local Whisper, OpenAI, Groq, Deepgram, AssemblyAI
 */

// Types
export type {
  Word,
  CaptionSegment,
  CaptionData,
  CaptionStyle,
  CaptionComponentProps,
  WhisperOptions,
  ProcessAudioOptions,
} from "./types.js";

// Components
export {
  AnimatedCaptions,
  WordHighlight,
  Karaoke,
  Typewriter,
  Bounce,
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

// Utilities
export {
  getActiveSegment,
  getActiveWord,
  getActiveWordIndex,
  getWordProgress,
  groupWordsIntoLines,
  msToFrame,
  frameToMs,
} from "./utils.js";

// Config
export { loadConfig } from "./config.js";
export type { CaptioneerConfig } from "./config.js";
