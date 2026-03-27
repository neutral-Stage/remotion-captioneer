/**
 * Deepgram Provider
 * Real-time and batch speech-to-text with Nova models
 * https://developers.deepgram.com/reference/speech-to-text
 */

import { readFileSync, existsSync } from "fs";
import { resolve, basename } from "path";
import type { CaptionData, CaptionSegment } from "../types.js";
import type { STTProvider, STTProviderOptions } from "./base.js";

const DEEPGRAM_API_URL = "https://api.deepgram.com/v1/listen";

export interface DeepgramProviderOptions extends STTProviderOptions {
  apiKey?: string;
  model?: "nova-2" | "nova-2-medical" | "enhanced" | "base";
  language?: string;
  smartFormat?: boolean;
  punctuate?: boolean;
  paragraphs?: boolean;
}

export class DeepgramProvider implements STTProvider {
  name = "deepgram";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.DEEPGRAM_API_KEY ?? "";
  }

  isReady(): boolean {
    return this.apiKey.length > 0;
  }

  async transcribe(
    audioPath: string,
    options: DeepgramProviderOptions = {}
  ): Promise<CaptionData> {
    if (!this.isReady()) {
      throw new Error(
        "Deepgram API key not set. Pass it as option or set DEEPGRAM_API_KEY env var."
      );
    }

    const resolved = resolve(audioPath);
    if (!existsSync(resolved)) {
      throw new Error(`Audio file not found: ${resolved}`);
    }

    console.log("🎙️ Transcribing with Deepgram...");

    const audioBuffer = readFileSync(resolved);

    const params = new URLSearchParams({
      model: options.model ?? "nova-2",
      smart_format: String(options.smartFormat ?? true),
      punctuate: String(options.punctuate ?? true),
      words: "true",
    });

    if (options.language) {
      params.append("language", options.language);
    }

    const response = await fetch(`${DEEPGRAM_API_URL}?${params}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${this.apiKey}`,
        "Content-Type": "audio/mpeg",
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Deepgram API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return this.parseResponse(data);
  }

  private parseResponse(data: any): CaptionData {
    const result = data.results?.channels?.[0]?.alternatives?.[0];
    if (!result) {
      throw new Error("No transcription results from Deepgram");
    }

    const words = result.words ?? [];

    // Group words into segments (paragraphs or 5-word chunks)
    const segments: CaptionSegment[] = [];
    const CHUNK_SIZE = 5;

    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      const chunk = words.slice(i, i + CHUNK_SIZE);
      const segWords = chunk.map((w: any) => ({
        word: w.word,
        startMs: Math.round(w.start * 1000),
        endMs: Math.round(w.end * 1000),
        confidence: w.confidence ?? 1.0,
      }));

      segments.push({
        text: segWords.map((w: any) => w.word).join(" "),
        startMs: segWords[0].startMs,
        endMs: segWords[segWords.length - 1].endMs,
        words: segWords,
      });
    }

    const durationMs =
      segments.length > 0 ? segments[segments.length - 1].endMs : 0;

    return {
      segments,
      language: data.results?.channels?.[0]?.detected_language ?? "en",
      durationMs,
    };
  }
}
