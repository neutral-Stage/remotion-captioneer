/**
 * Local Whisper.cpp STT provider
 */

import type { CaptionData } from "../types.js";
import type { STTProvider, STTProviderOptions } from "./base.js";
import { processAudio } from "../whisper.js";

export class LocalWhisperProvider implements STTProvider {
  readonly name = "local" as const;

  isReady(): boolean {
    return true;
  }

  async transcribe(
    audioPath: string,
    options?: STTProviderOptions
  ): Promise<CaptionData> {
    return processAudio(audioPath, {
      model: options?.model as any,
      language: options?.language,
    });
  }
}
