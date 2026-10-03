/**
 * Local Whisper.cpp STT provider
 */

import type { CaptionData } from "../types.js";
import type { STTProvider, STTProviderOptions } from "./base.js";
import type { WhisperOptions } from "../types.js";
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
      model: options?.model as WhisperOptions["model"] | undefined,
      language: options?.language,
    });
  }
}
