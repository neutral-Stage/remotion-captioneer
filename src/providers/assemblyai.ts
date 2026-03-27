/**
 * AssemblyAI Provider
 * Industry-leading speech-to-text with word-level timestamps
 * https://www.assemblyai.com/docs/api-reference/transcripts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { CaptionData, CaptionSegment } from "../types.js";
import type { STTProvider, STTProviderOptions } from "./base.js";

const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2";

export interface AssemblyAIProviderOptions extends STTProviderOptions {
  apiKey?: string;
  languageCode?: string;
  punctuate?: boolean;
  formatText?: boolean;
}

export class AssemblyAIProvider implements STTProvider {
  name = "assemblyai";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.ASSEMBLYAI_API_KEY ?? "";
  }

  isReady(): boolean {
    return this.apiKey.length > 0;
  }

  async transcribe(
    audioPath: string,
    options: AssemblyAIProviderOptions = {}
  ): Promise<CaptionData> {
    if (!this.isReady()) {
      throw new Error(
        "AssemblyAI API key not set. Pass it as option or set ASSEMBLYAI_API_KEY env var."
      );
    }

    const resolved = resolve(audioPath);
    if (!existsSync(resolved)) {
      throw new Error(`Audio file not found: ${resolved}`);
    }

    console.log("🎙️ Transcribing with AssemblyAI...");

    // Step 1: Upload audio
    const audioBuffer = readFileSync(resolved);

    const uploadRes = await fetch(`${ASSEMBLYAI_API_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: audioBuffer,
    });

    if (!uploadRes.ok) {
      throw new Error(`AssemblyAI upload failed: ${uploadRes.statusText}`);
    }

    const { upload_url } = await uploadRes.json();

    // Step 2: Request transcription
    const transcriptRes = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
      method: "POST",
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: options.languageCode ?? "en",
        punctuate: options.punctuate ?? true,
        format_text: options.formatText ?? true,
        word_boost: [],
      }),
    });

    if (!transcriptRes.ok) {
      throw new Error(
        `AssemblyAI transcription request failed: ${transcriptRes.statusText}`
      );
    }

    const transcript = await transcriptRes.json();
    const transcriptId = transcript.id;

    // Step 3: Poll for completion
    console.log("⏳ Waiting for transcription to complete...");
    let result: any;

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusRes = await fetch(
        `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
        {
          headers: { Authorization: this.apiKey },
        }
      );

      result = await statusRes.json();

      if (result.status === "completed") break;
      if (result.status === "error") {
        throw new Error(`AssemblyAI error: ${result.error}`);
      }
    }

    return this.parseResponse(result);
  }

  private parseResponse(data: any): CaptionData {
    const words = data.words ?? [];

    // Group into segments of ~5 words
    const segments: CaptionSegment[] = [];
    const CHUNK_SIZE = 5;

    for (let i = 0; i < words.length; i += CHUNK_SIZE) {
      const chunk = words.slice(i, i + CHUNK_SIZE);
      const segWords = chunk.map((w: any) => ({
        word: w.text,
        startMs: w.start,
        endMs: w.end,
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
      language: data.language_code ?? "en",
      durationMs,
    };
  }
}
