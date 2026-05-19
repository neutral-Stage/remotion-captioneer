/**
 * Caption translation helpers (OpenAI).
 * Preserves per-segment word count and timing; only text fields are updated.
 */

import type { CaptionData, CaptionSegment, Word } from "./types.js";

export type TranslateCaptionsOptions = {
  /** BCP-47 language code, e.g. "es", "fr", "de", "ar", "he", "zh-Hans" */
  targetLanguage: string;
  /** Defaults to OPENAI_API_KEY */
  apiKey?: string;
  /** Chat model (default gpt-4o-mini) */
  model?: string;
  /** OpenAI request timeout in ms (default 120_000) */
  timeoutMs?: number;
  /** Set `language` on returned CaptionData (default true) */
  updateLanguage?: boolean;
  /** Progress callback for batched translation */
  onProgress?: (message: string) => void;
};

/** Segments per OpenAI request to avoid huge prompts and truncated JSON. */
const SEGMENT_BATCH_SIZE = 25;

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

/**
 * Safe subset of BCP-47 tags for the system prompt (prevents prompt injection).
 * Allows primary + optional subtags (letters/digits only in subtags).
 */
export function assertValidTargetLanguageTag(tag: string): string {
  const trimmed = tag.trim();
  if (trimmed.length < 2 || trimmed.length > 35) {
    throw new Error(
      `Invalid target language: length must be 2–35 characters after trim.`
    );
  }
  // Alphanumeric + hyphens only; no spaces, quotes, or JSON-breaking chars.
  if (!/^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/.test(trimmed)) {
    throw new Error(
      `Invalid target language code "${tag.trim()}". Use a BCP-47 tag like es, fr-CA, zh-Hans.`
    );
  }
  return trimmed;
}

export function assertCaptionDataShape(data: unknown): CaptionData {
  if (!data || typeof data !== "object") {
    throw new Error("Caption data must be a non-null object");
  }
  const o = data as Record<string, unknown>;
  if (!Array.isArray(o.segments)) {
    throw new Error('Invalid caption file: expected top-level "segments" array');
  }
  for (let i = 0; i < o.segments.length; i++) {
    const seg = o.segments[i];
    if (!seg || typeof seg !== "object") {
      throw new Error(`Invalid segment at index ${i}: expected object`);
    }
    const words = (seg as Record<string, unknown>).words;
    if (!Array.isArray(words)) {
      throw new Error(`Invalid segment at index ${i}: expected "words" array`);
    }
    for (let j = 0; j < words.length; j++) {
      const w = words[j];
      if (!w || typeof w !== "object") {
        throw new Error(`Invalid word at segment ${i}, word ${j}: expected object`);
      }
      if (typeof (w as Record<string, unknown>).word !== "string") {
        throw new Error(
          `Invalid word at segment ${i}, word ${j}: expected string "word" field`
        );
      }
    }
  }
  if (typeof o.language !== "string") {
    throw new Error('Invalid caption file: expected string "language" field');
  }
  if (typeof o.durationMs !== "number" || !Number.isFinite(o.durationMs)) {
    throw new Error('Invalid caption file: expected finite number "durationMs"');
  }
  return data as CaptionData;
}

function parseJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object");
  }
  return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
}

async function fetchOpenAIChat(
  body: Record<string, unknown>,
  apiKey: string,
  timeoutMs: number
): Promise<OpenAIChatResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const json = (await res.json()) as OpenAIChatResponse;
    if (!res.ok) {
      throw new Error(
        json.error?.message ?? `OpenAI request failed (${res.status})`
      );
    }
    return json;
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        `OpenAI request timed out after ${timeoutMs}ms. Try again or increase timeoutMs.`
      );
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

async function translateWordListsBatch(
  segments: Array<{ words: string[] }>,
  safeTargetLanguage: string,
  opts: TranslateCaptionsOptions
): Promise<string[][]> {
  const apiKey = opts.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OpenAI API key missing. Set OPENAI_API_KEY or pass apiKey in options."
    );
  }

  const model = opts.model ?? "gpt-4o-mini";
  const timeoutMs = opts.timeoutMs ?? 120_000;

  // safeTargetLanguage is already validated — safe to embed in instructions.
  const payload = {
    model,
    temperature: 0.2,
    response_format: { type: "json_object" as const },
    messages: [
      {
        role: "system" as const,
        content: [
          "You translate subtitle/caption words for video.",
          `Target language tag: ${safeTargetLanguage}`,
          'Return JSON: {"segments":[{"words":["..."]}]}',
          "Rules:",
          "- Same number of segments as input, same order.",
          "- Each segment has the same number of words as input, same order.",
          '- Preserve punctuation attached to words (e.g. "hello," stays one token).',
          "- Do not add explanations.",
        ].join("\n"),
      },
      {
        role: "user" as const,
        content: JSON.stringify({ segments }),
      },
    ],
  };

  const body = await fetchOpenAIChat(payload, apiKey, timeoutMs);

  const content = body.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const parsed = parseJsonObject(content);
  const outSegs = parsed.segments;
  if (!Array.isArray(outSegs)) {
    throw new Error('Invalid response: expected "segments" array');
  }

  return outSegs.map((seg, i) => {
    if (!seg || typeof seg !== "object") {
      throw new Error(`Invalid segment at index ${i}`);
    }
    const { words } = seg as { words?: unknown };
    if (!Array.isArray(words) || !words.every((w) => typeof w === "string")) {
      throw new Error(`Invalid words array at segment ${i}`);
    }
    return words as string[];
  });
}

/**
 * Returns new CaptionData with translated `text` and each `word.word`;
 * timings, confidence, and language code are preserved (language is not auto-updated).
 */
export async function translateCaptionData(
  captionData: CaptionData,
  opts: TranslateCaptionsOptions
): Promise<CaptionData> {
  const safeTargetLanguage = assertValidTargetLanguageTag(opts.targetLanguage);

  const input = captionData.segments.map((s) => ({
    words: s.words.map((w) => w.word),
  }));

  const translatedLists: string[][] = [];
  const totalBatches = Math.ceil(input.length / SEGMENT_BATCH_SIZE) || 1;
  for (let i = 0; i < input.length; i += SEGMENT_BATCH_SIZE) {
    const batch = input.slice(i, i + SEGMENT_BATCH_SIZE);
    const batchNum = Math.floor(i / SEGMENT_BATCH_SIZE) + 1;
    opts.onProgress?.(
      `Translating batch ${batchNum}/${totalBatches} (${batch.length} segments)...`
    );
    const batchOut = await translateWordListsBatch(
      batch,
      safeTargetLanguage,
      opts
    );
    if (batchOut.length !== batch.length) {
      throw new Error(
        `Translation batch at offset ${i}: expected ${batch.length} segments, got ${batchOut.length}`
      );
    }
    translatedLists.push(...batchOut);
  }

  if (translatedLists.length !== captionData.segments.length) {
    throw new Error("Translation returned wrong segment count");
  }

  const segments: CaptionSegment[] = captionData.segments.map((seg, i) => {
    const newWordsStr = translatedLists[i];
    if (newWordsStr.length !== seg.words.length) {
      throw new Error(
        `Segment ${i}: expected ${seg.words.length} words, got ${newWordsStr.length}`
      );
    }
    const words: Word[] = seg.words.map((w, j) => ({
      ...w,
      word: newWordsStr[j]!,
    }));
    const text = words.map((w) => w.word).join(" ");
    return { ...seg, text, words };
  });

  const updateLanguage = opts.updateLanguage !== false;

  return {
    ...captionData,
    language: updateLanguage ? safeTargetLanguage : captionData.language,
    segments,
  };
}
