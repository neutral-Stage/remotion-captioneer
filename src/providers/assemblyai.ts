/**
 * AssemblyAI Provider
 * Industry-leading speech-to-text with word-level timestamps
 * https://www.assemblyai.com/docs/api-reference/transcripts
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { CaptionData } from "../types.js";
import type { STTProvider, STTProviderOptions } from "./base.js";
import { chunkWordsIntoSegments, type WordWithSpeaker } from "./diarization.js";

const ASSEMBLYAI_API_URL = "https://api.assemblyai.com/v2";

interface AssemblyAIWord {
  text: string;
  start: number;
  end: number;
  confidence?: number;
  speaker?: string;
}

interface AssemblyAITranscript {
  words?: AssemblyAIWord[];
  language_code?: string;
  status?: string;
  error?: string;
}

export interface AssemblyAIProviderOptions extends STTProviderOptions {
  apiKey?: string;
  languageCode?: string;
  punctuate?: boolean;
  formatText?: boolean;
  /** Enable speaker diarization (labels words with A, B, C, …) */
  speakerLabels?: boolean;
  /** Hint for number of speakers when diarization is enabled */
  speakersExpected?: number;
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

    const uploadPayload = (await uploadRes.json()) as { upload_url: string };
    const uploadUrl = uploadPayload.upload_url;

    const languageCode = options.languageCode ?? options.language;

    // Step 2: Request transcription
    const transcriptBody: Record<string, unknown> = {
      audio_url: uploadUrl,
      punctuate: options.punctuate ?? true,
      format_text: options.formatText ?? true,
      word_boost: [],
      speaker_labels: options.speakerLabels ?? false,
    };
    if (languageCode) {
      transcriptBody.language_code = languageCode;
    }
    if (typeof options.speakersExpected === "number") {
      transcriptBody.speakers_expected = options.speakersExpected;
    }

    const transcriptRes = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
      method: "POST",
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transcriptBody),
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
    let result: AssemblyAITranscript | undefined;

    for (;;) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 2000);
      });

      const statusRes = await fetch(
        `${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`,
        {
          headers: { Authorization: this.apiKey },
        }
      );

      result = (await statusRes.json()) as AssemblyAITranscript;

      if (result.status === "completed" || result.status === "error") {
        break;
      }
    }

    if (!result || result.status === "error") {
      throw new Error(`AssemblyAI error: ${result?.error ?? "unknown"}`);
    }

    return this.parseResponse(result);
  }

  private parseResponse(data: AssemblyAITranscript): CaptionData {
    const words: WordWithSpeaker[] = (data.words ?? []).map((w) => ({
      word: w.text,
      startMs: w.start,
      endMs: w.end,
      confidence: w.confidence ?? 1.0,
      speaker: w.speaker ? String(w.speaker) : undefined,
    }));

    const segments = chunkWordsIntoSegments(words);

    const durationMs =
      segments.length > 0 ? segments[segments.length - 1].endMs : 0;

    return {
      segments,
      language: data.language_code ?? "en",
      durationMs,
    };
  }
}
