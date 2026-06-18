/**
 * Parse preview upload headers for STT options.
 */

import { assertValidTargetLanguageTag } from "../translate.js";

const MIN_SPEAKERS = 1;
const MAX_SPEAKERS = 20;

export function clampNumSpeakers(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded < MIN_SPEAKERS) return MIN_SPEAKERS;
  if (rounded > MAX_SPEAKERS) return MAX_SPEAKERS;
  return rounded;
}

export function parseLanguageHeader(
  header: string | string[] | undefined
): string | undefined {
  if (typeof header !== "string" || !header.trim()) return undefined;
  return assertValidTargetLanguageTag(header);
}

export function parseProcessHeaders(
  headers: Record<string, string | string[] | undefined>
): { diarize: boolean; numSpeakers: number | undefined; language?: string } {
  const diarize = headers["x-diarize"] === "true";
  const speakersHeader = headers["x-speakers"];
  const parsed =
    typeof speakersHeader === "string" ? Number.parseInt(speakersHeader, 10) : undefined;
  const language = parseLanguageHeader(headers["x-language"]);

  return {
    diarize,
    numSpeakers: clampNumSpeakers(parsed),
    language,
  };
}
