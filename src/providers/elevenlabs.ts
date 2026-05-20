/**
 * ElevenLabs Scribe API Provider
 * https://elevenlabs.io/docs/api-reference/speech-to-text/convert
 */

import { existsSync, readFileSync } from "fs";
import { basename, extname, resolve } from "path";
import type { CaptionData, CaptionSegment, Word } from "../types.js";
import type { STTProvider, STTProviderOptions } from "./base.js";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/speech-to-text";

type ElevenLabsWordType = "word" | "spacing" | "audio_event";

interface ElevenLabsWord {
  text?: string;
  start?: number | null;
  end?: number | null;
  type?: ElevenLabsWordType | string;
  logprob?: number | null;
}

interface ElevenLabsTranscript {
  language_code?: string;
  text?: string;
  words?: ElevenLabsWord[];
  transcripts?: ElevenLabsTranscript[] | Record<string, ElevenLabsTranscript>;
}

type TimedElevenLabsWord = ElevenLabsWord & {
  text: string;
  start: number;
  end: number;
};

export interface ElevenLabsProviderOptions extends STTProviderOptions {
  apiKey?: string;
  model?: "scribe_v2" | "scribe_v1";
  language?: string;
  languageCode?: string;
  tagAudioEvents?: boolean;
  diarize?: boolean;
  numSpeakers?: number;
  timestampsGranularity?: "word";
  fileFormat?: "other" | "pcm_s16le_16";
  temperature?: number;
  seed?: number;
  keyterms?: string[];
  useMultiChannel?: boolean;
}

export class ElevenLabsProvider implements STTProvider {
  name = "elevenlabs";
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.ELEVENLABS_API_KEY ?? "";
  }

  isReady(): boolean {
    return this.apiKey.length > 0;
  }

  async transcribe(
    audioPath: string,
    options: ElevenLabsProviderOptions = {}
  ): Promise<CaptionData> {
    if (!this.isReady()) {
      throw new Error(
        "ElevenLabs API key not set. Pass it as option or set ELEVENLABS_API_KEY env var."
      );
    }

    const resolved = resolve(audioPath);
    if (!existsSync(resolved)) {
      throw new Error(`Audio file not found: ${resolved}`);
    }

    const timestampsGranularity = getTimestampsGranularity(options);

    console.log("🎙️ Transcribing with ElevenLabs Scribe...");

    const audioBuffer = readFileSync(resolved);
    const fileName = basename(resolved);

    const formData = new FormData();
    formData.append(
      "file",
      new Blob([audioBuffer], { type: getMimeType(resolved) }),
      fileName
    );
    formData.append("model_id", options.model ?? "scribe_v2");
    formData.append("timestamps_granularity", timestampsGranularity);
    formData.append("file_format", options.fileFormat ?? "other");

    const languageCode = options.languageCode ?? options.language;
    if (languageCode) {
      formData.append("language_code", languageCode);
    }
    if (typeof options.tagAudioEvents === "boolean") {
      formData.append("tag_audio_events", String(options.tagAudioEvents));
    }
    if (typeof options.diarize === "boolean") {
      formData.append("diarize", String(options.diarize));
    }
    if (typeof options.numSpeakers === "number") {
      formData.append("num_speakers", String(options.numSpeakers));
    }
    if (typeof options.temperature === "number") {
      formData.append("temperature", String(options.temperature));
    }
    if (typeof options.seed === "number") {
      formData.append("seed", String(options.seed));
    }
    if (typeof options.useMultiChannel === "boolean") {
      formData.append("use_multi_channel", String(options.useMultiChannel));
    }
    for (const keyterm of options.keyterms ?? []) {
      formData.append("keyterms", keyterm);
    }

    const response = await fetch(ELEVENLABS_API_URL, {
      method: "POST",
      headers: {
        "xi-api-key": this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return this.parseResponse(data, languageCode);
  }

  private parseResponse(
    data: ElevenLabsTranscript,
    requestedLanguage?: string
  ): CaptionData {
    const transcripts = flattenTranscripts(data);
    const language = normalizeLanguageCode(
      requestedLanguage ??
        transcripts.find((transcript) => transcript.language_code)
          ?.language_code
    );

    const words = transcripts
      .flatMap((transcript) => transcript.words ?? [])
      .filter(isTimedWord)
      .sort((a, b) => a.start - b.start)
      .map(toCaptionWord);

    const segments = chunkWords(words);
    const durationMs =
      segments.length > 0 ? segments[segments.length - 1].endMs : 0;

    return {
      segments,
      language,
      durationMs,
    };
  }
}

function getTimestampsGranularity(
  options: ElevenLabsProviderOptions
): "word" {
  const value = (options as Record<string, unknown>).timestampsGranularity;

  if (value === undefined || value === "word") {
    return "word";
  }

  throw new Error(
    'ElevenLabsProvider only supports timestampsGranularity: "word" because CaptionData requires word-level timestamps.'
  );
}

function flattenTranscripts(data: ElevenLabsTranscript): ElevenLabsTranscript[] {
  if (!data.transcripts) {
    return [data];
  }

  if (Array.isArray(data.transcripts)) {
    return data.transcripts;
  }

  return Object.values(data.transcripts);
}

function isTimedWord(word: ElevenLabsWord): word is TimedElevenLabsWord {
  return (
    word.type === "word" &&
    typeof word.text === "string" &&
    typeof word.start === "number" &&
    typeof word.end === "number"
  );
}

function toCaptionWord(word: TimedElevenLabsWord): Word {
  return {
    word: word.text.trim(),
    startMs: Math.round(word.start * 1000),
    endMs: Math.round(word.end * 1000),
    confidence: confidenceFromLogprob(word.logprob),
  };
}

function confidenceFromLogprob(logprob?: number | null): number {
  if (typeof logprob !== "number" || Number.isNaN(logprob)) {
    return 1.0;
  }

  return Math.max(0, Math.min(1, Math.exp(logprob)));
}

const LANGUAGE_CODE_MAP: Record<string, string> = {
  eng: "en",
  cmn: "zh",
  zho: "zh",
  chi: "zh",
  spa: "es",
  fra: "fr",
  fre: "fr",
  deu: "de",
  ger: "de",
  ita: "it",
  jpn: "ja",
  kor: "ko",
  por: "pt",
  rus: "ru",
  ara: "ar",
  hin: "hi",
};

function normalizeLanguageCode(language?: string): string {
  if (!language) {
    return "en";
  }

  const code = language.trim();
  const mapped = LANGUAGE_CODE_MAP[code.toLowerCase()];
  return mapped ?? code.toLowerCase();
}

function chunkWords(words: Word[]): CaptionSegment[] {
  const segments: CaptionSegment[] = [];
  const CHUNK_SIZE = 5;

  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE);
    const text = chunk.map((word) => word.word).join(" ").trim();

    if (!text) {
      continue;
    }

    segments.push({
      text,
      startMs: chunk[0].startMs,
      endMs: chunk[chunk.length - 1].endMs,
      words: chunk,
    });
  }

  return segments;
}

function getMimeType(filePath: string): string {
  switch (extname(filePath).toLowerCase()) {
    case ".wav":
      return "audio/wav";
    case ".m4a":
      return "audio/mp4";
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".webm":
      return "video/webm";
    case ".ogg":
      return "audio/ogg";
    case ".flac":
      return "audio/flac";
    case ".mp3":
    default:
      return "audio/mpeg";
  }
}
