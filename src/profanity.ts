/**
 * Profanity filtering — family-friendly captions without re-transcribing.
 *
 * Modes:
 * - "mask":  replace flagged words with asterisks (optionally keeping the
 *   first letter): "damn" → "****" or "d***"
 * - "remove": drop flagged words entirely (text and timing re-derived)
 * - "flag":  report matches without changing the captions
 *
 * Matching is conservative: punctuation-stripped, case-insensitive exact
 * matches against the built-in list plus suffixed forms (-s, -ing, -ed,
 * -er(s)); a small prefix allowlist catches compounds ("shitshow") without
 * flagging lookalikes ("hello" never trips "hell"). Extend or override via
 * `extraWords` / `allowWords`.
 */

import type { CaptionData, CaptionSegment } from "./types.js";

export type ProfanityMode = "mask" | "remove" | "flag";

export interface ProfanityOptions {
  mode?: ProfanityMode;
  /** Mask character (default "*") */
  maskChar?: string;
  /** Keep the first letter when masking: "damn" → "d***" (default false) */
  keepFirstLetter?: boolean;
  /** Extra words/stems to flag */
  extraWords?: string[];
  /** Words to never flag (overrides the built-in list) */
  allowWords?: string[];
}

export interface ProfanityMatch {
  segmentIndex: number;
  wordIndex: number;
  word: string;
  maskedTo: string;
}

export interface ProfanityResult {
  captions: CaptionData;
  matches: ProfanityMatch[];
}

const BUILT_IN = [
  "asshole",
  "bastard",
  "bitch",
  "bollocks",
  "bullshit",
  "crap",
  "cunt",
  "damn",
  "dammit",
  "dick",
  "douche",
  "fuck",
  "goddamn",
  "goddammit",
  "hell",
  "jackass",
  "motherfucker",
  "nigga",
  "nigger",
  "piss",
  "prick",
  "pussy",
  "shit",
  "shitty",
  "slut",
  "twat",
  "wank",
  "whore",
];

const SUFFIXES = ["", "s", "es", "ing", "ed", "er", "ers"] as const;

/**
 * Stems safe to match as prefixes (catches compounds like "shitshow" or
 * "fucking"). Deliberately tiny — stems like "hell" or "dick" would flag
 * "hello"/"dickens", so they match exact/suffixed forms only.
 */
const PREFIXABLE = new Set([
  "asshole",
  "bullshit",
  "cunt",
  "fuck",
  "motherfucker",
  "nigga",
  "nigger",
  "shit",
]);

function normalize(word: string): string {
  const stripped = word.toLowerCase().replace(/[^a-z0-9']/g, "");
  // Trim trailing apostrophes without a backtracking regex (CodeQL ReDoS).
  let end = stripped.length;
  while (end > 0 && stripped[end - 1] === "'") end--;
  return stripped.slice(0, end);
}

function buildMatchers(
  options: Required<Pick<ProfanityOptions, "extraWords" | "allowWords">>
): {
  exact: Set<string>;
  prefixes: string[];
} {
  const allowed = new Set(options.allowWords.map(normalize));
  const exact = new Set<string>();
  const prefixes: string[] = [];

  for (const raw of [...BUILT_IN, ...options.extraWords]) {
    const stem = normalize(raw);
    if (!stem || allowed.has(stem)) continue;
    for (const suffix of SUFFIXES) {
      exact.add(stem + suffix);
    }
    if (PREFIXABLE.has(stem)) {
      prefixes.push(stem);
    }
  }
  // allowWords also removes suffixed forms of allowed stems.
  for (const raw of options.allowWords) {
    const stem = normalize(raw);
    for (const suffix of SUFFIXES) {
      exact.delete(stem + suffix);
    }
  }

  return { exact, prefixes };
}

const isCoreChar = (ch: string): boolean => /[\w']/.test(ch);

function maskWord(word: string, maskChar: string, keepFirstLetter: boolean): string {
  // Preserve leading/trailing punctuation so sentence rhythm survives.
  // Scanned manually — no backtracking regexes on uncontrolled input.
  let start = 0;
  while (start < word.length && !isCoreChar(word[start]!)) start++;
  let end = word.length;
  while (end > start && !isCoreChar(word[end - 1]!)) end--;
  const lead = word.slice(0, start);
  const trail = word.slice(end);
  const core = word.slice(start, end);
  if (core.length === 0) return word;
  const mask = maskChar.repeat(
    Math.max(1, core.length - (keepFirstLetter ? 1 : 0))
  );
  return lead + (keepFirstLetter ? core[0]! + mask : mask) + trail;
}

export function filterProfanity(
  captions: CaptionData,
  options: ProfanityOptions = {}
): ProfanityResult {
  const opts = {
    mode: options.mode ?? "mask",
    maskChar: options.maskChar ?? "*",
    keepFirstLetter: options.keepFirstLetter ?? false,
    extraWords: options.extraWords ?? [],
    allowWords: options.allowWords ?? [],
  };
  const { exact, prefixes } = buildMatchers(opts);

  const matches: ProfanityMatch[] = [];

  const isFlagged = (normalized: string): boolean => {
    if (exact.has(normalized)) return true;
    return prefixes.some((p) => normalized.startsWith(p) && normalized.length > p.length);
  };

  const segments = captions.segments.map((segment, segmentIndex) => {
    let changed = false;
    const words = [];

    for (let wordIndex = 0; wordIndex < segment.words.length; wordIndex++) {
      const word = segment.words[wordIndex]!;
      const normalized = normalize(word.word);
      if (!normalized || !isFlagged(normalized)) {
        words.push(word);
        continue;
      }

      const maskedTo = maskWord(word.word, opts.maskChar, opts.keepFirstLetter);
      matches.push({ segmentIndex, wordIndex, word: word.word, maskedTo });

      if (opts.mode === "remove") {
        changed = true;
        continue;
      }
      if (opts.mode === "mask" && maskedTo !== word.word) {
        words.push({ ...word, word: maskedTo });
        changed = true;
        continue;
      }
      words.push(word);
    }

    if (opts.mode === "flag" || !changed) return segment;

    const nextSegment: CaptionSegment = {
      ...segment,
      words,
      text: words.map((w) => w.word).join(" "),
    };
    if (words.length > 0) {
      nextSegment.startMs = words[0]!.startMs;
      nextSegment.endMs = words[words.length - 1]!.endMs;
    }
    return nextSegment;
  });

  if (
    opts.mode === "flag" ||
    segments.every((segment, i) => segment === captions.segments[i])
  ) {
    return { captions, matches };
  }

  return { captions: { ...captions, segments }, matches };
}
