/**
 * Provider Registry
 * Factory for creating and managing STT providers
 */

import type { CaptionData } from "../types.js";
import type {
  STTProvider,
  STTProviderOptions,
  ProviderName,
  ProviderConfig,
} from "./base.js";
import { OpenAIProvider } from "./openai.js";
import { GroqProvider } from "./groq.js";
import { DeepgramProvider } from "./deepgram.js";
import { AssemblyAIProvider } from "./assemblyai.js";
import { LocalWhisperProvider } from "./local.js";
import { ElevenLabsProvider } from "./elevenlabs.js";

export type { STTProvider, STTProviderOptions, ProviderName, ProviderConfig } from "./base.js";
export { OpenAIProvider } from "./openai.js";
export { GroqProvider } from "./groq.js";
export { DeepgramProvider } from "./deepgram.js";
export { AssemblyAIProvider } from "./assemblyai.js";
export { ElevenLabsProvider } from "./elevenlabs.js";

/**
 * Create a provider instance by name
 */
export function createProvider(
  name: ProviderName,
  apiKey?: string
): STTProvider {
  switch (name) {
    case "local":
      return new LocalWhisperProvider();
    case "openai":
      return new OpenAIProvider(apiKey);
    case "groq":
      return new GroqProvider(apiKey);
    case "deepgram":
      return new DeepgramProvider(apiKey);
    case "assemblyai":
      return new AssemblyAIProvider(apiKey);
    case "elevenlabs":
      return new ElevenLabsProvider(apiKey);
    default:
      throw new Error(`Unknown provider: ${name}`);
  }
}

/**
 * Auto-detect available provider from environment variables
 */
export function detectProvider(): { name: ProviderName; provider: STTProvider } | null {
  if (process.env.GROQ_API_KEY) {
    return { name: "groq", provider: new GroqProvider() };
  }
  if (process.env.OPENAI_API_KEY) {
    return { name: "openai", provider: new OpenAIProvider() };
  }
  if (process.env.DEEPGRAM_API_KEY) {
    return { name: "deepgram", provider: new DeepgramProvider() };
  }
  if (process.env.ASSEMBLYAI_API_KEY) {
    return { name: "assemblyai", provider: new AssemblyAIProvider() };
  }
  if (process.env.ELEVENLABS_API_KEY) {
    return { name: "elevenlabs", provider: new ElevenLabsProvider() };
  }
  return null;
}

/**
 * List all available providers and their status
 */
export function listProviders(): Array<{
  name: ProviderName;
  ready: boolean;
  models: string[];
}> {
  const providers: Array<{ name: ProviderName; provider: STTProvider; models: string[] }> = [
    {
      name: "local",
      provider: new LocalWhisperProvider(),
      models: ["tiny", "base", "small", "medium", "large"],
    },
    {
      name: "openai",
      provider: new OpenAIProvider(),
      models: ["whisper-1"],
    },
    {
      name: "groq",
      provider: new GroqProvider(),
      models: ["whisper-large-v3", "whisper-large-v3-turbo", "distil-whisper-large-v3-en"],
    },
    {
      name: "deepgram",
      provider: new DeepgramProvider(),
      models: ["nova-2", "nova-2-medical", "enhanced", "base"],
    },
    {
      name: "assemblyai",
      provider: new AssemblyAIProvider(),
      models: ["best"],
    },
    {
      name: "elevenlabs",
      provider: new ElevenLabsProvider(),
      models: ["scribe_v2", "scribe_v1"],
    },
  ];

  return providers.map(({ name, provider, models }) => ({
    name,
    ready: provider.isReady(),
    models,
  }));
}
