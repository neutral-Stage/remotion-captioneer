/**
 * OpenAI Whisper API Provider
 * https://platform.openai.com/docs/guides/speech-to-text
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, basename, extname } from "path";
import type { CaptionData, CaptionSegment, Word } from "../types.js";
import type { STTProvider, STTProviderOptions } from "./base.js";

const OPENAI_API_URL = "https://api.openai.com/v1/audio/transcriptions";

export interface OpenAIProviderOptions extends STTProviderOptions {
  apiKey?: string;
  model?: "whisper-1";
  language?: string;
  responseFormat?: "json" | "verbose_json";
  timestampGranularities?: ("word" | "segment")[];
}

export class OpenAIProvider implements STTProvider {
  name = "openai";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY ?? "";
  }

  isReady(): boolean {
    return this.apiKey.length > 0;
  }

  async transcribe(
    audioPath: string,
    options: OpenAIProviderOptions = {}
  ): Promise<CaptionData> {
    if (!this.isReady()) {
      throw new Error(
        "OpenAI API key not set. Pass it as option or set OPENAI_API_KEY env var."
      );
    }

    const resolved = resolve(audioPath);
    if (!existsSync(resolved)) {
      throw new Error(`Audio file not found: ${resolved}`);
    }

    console.log("🎙️ Transcribing with OpenAI Whisper API...");

    const audioBuffer = readFileSync(resolved);
    const fileName = basename(resolved);

    // Build multipart form data
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([audioBuffer], { type: "audio/mpeg" }),
      fileName
    );
    formData.append("model", options.model ?? "whisper-1");
    formData.append("response_format", "verbose_json");
    formData.append(
      "timestamp_granularities[]",
      "word"
    );
    formData.append(
      "timestamp_granularities[]",
      "segment"
    );

    if (options.language) {
      formData.append("language", options.language);
    }

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  private parseResponse(data: any): CaptionData {
    const segments: CaptionSegment[] = (data.segments ?? []).map(
      (seg: any) => {
        // Match words to segments by time overlap
        const segWords = (data.words ?? [])
          .filter(
            (w: any) =>
              w.start >= seg.start && w.end <= seg.end
          )
          .map((w: any) => ({
            word: w.word.trim(),
            startMs: Math.round(w.start * 1000),
            endMs: Math.round(w.end * 1000),
            confidence: 1.0,
          }));

        return {
          text: seg.text.trim(),
          startMs: Math.round(seg.start * 1000),
          endMs: Math.round(seg.end * 1000),
          words: segWords.length > 0 ? segWords : [{
            word: seg.text.trim(),
            startMs: Math.round(seg.start * 1000),
            endMs: Math.round(seg.end * 1000),
            confidence: 1.0,
          }],
        };
      }
    );

    const durationMs =
      segments.length > 0 ? segments[segments.length - 1].endMs : 0;

    return {
      segments,
      language: data.language ?? "en",
      durationMs,
    };
  }
}
