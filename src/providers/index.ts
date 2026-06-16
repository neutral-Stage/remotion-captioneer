export type {
  STTProvider,
  STTProviderOptions,
  ProviderName,
  ProviderConfig,
} from "./base.js";

export { OpenAIProvider } from "./openai.js";
export { GroqProvider } from "./groq.js";
export { DeepgramProvider } from "./deepgram.js";
export { AssemblyAIProvider } from "./assemblyai.js";
export { LocalWhisperProvider } from "./local.js";
export { ElevenLabsProvider } from "./elevenlabs.js";

export {
  createProvider,
  detectProvider,
  listProviders,
} from "./registry.js";

export {
  chunkWordsIntoSegments,
  listSpeakers,
  formatSpeakerLabel,
  speakerColorIndex,
} from "./diarization.js";
export type { WordWithSpeaker } from "./diarization.js";
