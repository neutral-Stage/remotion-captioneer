/**
 * remotion-captioneer
 *
 * Drop-in animated captions for Remotion.
 * Audio → word-level synced subtitle components.
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

// Whisper integration
export {
  processAudio,
  loadCaptions,
  installWhisper,
  downloadModel,
} from "./whisper.js";

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
