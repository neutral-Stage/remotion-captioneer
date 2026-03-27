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

export {
  createProvider,
  detectProvider,
  listProviders,
} from "./registry.js";
