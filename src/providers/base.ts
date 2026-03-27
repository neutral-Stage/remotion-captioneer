/**
 * STT Provider Interface
 * All speech-to-text providers implement this
 */

import type { CaptionData } from "../types.js";

export interface STTProviderOptions {
  apiKey?: string;
  model?: string;
  language?: string;
  [key: string]: unknown;
}

export interface STTProvider {
  /** Provider name */
  name: string;

  /** Transcribe audio file and return caption data */
  transcribe(
    audioPath: string,
    options?: STTProviderOptions
  ): Promise<CaptionData>;

  /** Check if provider is configured and ready */
  isReady(): boolean;
}

export type ProviderName =
  | "local"
  | "openai"
  | "groq"
  | "deepgram"
  | "assemblyai";

export interface ProviderConfig {
  provider: ProviderName;
  apiKey?: string;
  model?: string;
  language?: string;
  whisperPath?: string;
  modelPath?: string;
}
