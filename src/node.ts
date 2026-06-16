/**
 * Node-only APIs (STT, export, translate, config).
 * Import from `remotion-captioneer/node` in server scripts to avoid pulling React into tooling.
 */

export {
  processAudio,
  loadCaptions,
  installWhisper,
  downloadModel,
} from "./whisper.js";

export {
  transcribeMediaFile,
  transcribeWithWhisper,
  defaultCaptionOutputPath,
  type TranscribeMediaOptions,
} from "./transcribe-media.js";

export {
  OpenAIProvider,
  GroqProvider,
  DeepgramProvider,
  AssemblyAIProvider,
  ElevenLabsProvider,
  LocalWhisperProvider,
  createProvider,
  detectProvider,
  listProviders,
  chunkWordsIntoSegments,
  listSpeakers,
  formatSpeakerLabel,
  speakerColorIndex,
} from "./providers/index.js";

export type { WordWithSpeaker } from "./providers/index.js";

export type {
  STTProvider,
  STTProviderOptions,
  ProviderName,
  ProviderConfig,
} from "./providers/index.js";

export {
  toSRT,
  toVTT,
  toASS,
  toPlainText,
  toJSON,
  toWordLevelSRT,
  toWordLevelVTT,
} from "./exporters.js";

export {
  translateCaptionData,
  assertValidTargetLanguageTag,
  assertCaptionDataShape,
  type TranslateCaptionsOptions,
} from "./translate.js";

export { loadConfig } from "./config.js";
export type { CaptioneerConfig } from "./config.js";

export type { CaptionData, CaptionSegment, Word } from "./types.js";
