/**
 * Shared speech-to-text entry for CLI and preview server.
 */

import { basename, extname, resolve } from "path";
import type { CaptionData } from "./types.js";
import type { ProviderName } from "./providers/base.js";
import { loadConfig } from "./config.js";
import { createProvider } from "./providers/registry.js";

export type TranscribeMediaOptions = {
  provider?: ProviderName | string;
  model?: string;
  apiKey?: string;
  language?: string;
  whisperPath?: string;
  modelPath?: string;
  onProgress?: (message: string) => void;
};

function detectDefaultProvider(): ProviderName | null {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.DEEPGRAM_API_KEY) return "deepgram";
  if (process.env.ASSEMBLYAI_API_KEY) return "assemblyai";
  return null;
}

function getApiKeyForProvider(provider: string): string | undefined {
  const envMap: Record<string, string> = {
    openai: "OPENAI_API_KEY",
    groq: "GROQ_API_KEY",
    deepgram: "DEEPGRAM_API_KEY",
    assemblyai: "ASSEMBLYAI_API_KEY",
  };
  return process.env[envMap[provider]];
}

/**
 * Transcribe an audio/video file to CaptionData (same logic as `captioneer process`).
 */
export async function transcribeMediaFile(
  audioPath: string,
  options: TranscribeMediaOptions = {}
): Promise<CaptionData> {
  const resolved = resolve(audioPath);
  const config = await loadConfig();

  const providerName =
    (options.provider as ProviderName | undefined) ??
    config?.defaultProvider ??
    detectDefaultProvider();

  if (!providerName) {
    throw new Error(
      "No STT provider available. Set OPENAI_API_KEY, GROQ_API_KEY, DEEPGRAM_API_KEY, or ASSEMBLYAI_API_KEY, or use provider local."
    );
  }

  options.onProgress?.(`Using provider: ${providerName}`);

  if (providerName === "local") {
    const { processAudio } = await import("./whisper.js");
    return processAudio(resolved, {
      model: (options.model as any) ?? config?.defaultModel ?? "base",
      language: options.language ?? config?.defaultLanguage,
      whisperPath: options.whisperPath ?? config?.whisperPath,
      modelPath: options.modelPath ?? config?.modelPath,
    });
  }

  const apiKey = options.apiKey ?? getApiKeyForProvider(providerName);
  const provider = createProvider(providerName, apiKey);

  if (!provider.isReady()) {
    throw new Error(
      `${providerName} API key not set. Use --api-key or set ${providerName.toUpperCase()}_API_KEY`
    );
  }

  return provider.transcribe(resolved, {
    model: options.model,
    language: options.language,
  });
}

/** @deprecated Use `transcribeMediaFile` — alias for docs compatibility */
export const transcribeWithWhisper = transcribeMediaFile;

export function defaultCaptionOutputPath(audioPath: string, cwd = process.cwd()): string {
  const resolved = resolve(audioPath);
  return resolve(cwd, `${basename(resolved, extname(resolved))}-captions.json`);
}
