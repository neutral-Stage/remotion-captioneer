/**
 * Parse preview upload headers for STT options.
 */
export function parseProcessHeaders(
  headers: Record<string, string | string[] | undefined>
): { diarize: boolean; numSpeakers: number | undefined } {
  const diarize = headers["x-diarize"] === "true";
  const speakersHeader = headers["x-speakers"];
  const parsed =
    typeof speakersHeader === "string" ? Number.parseInt(speakersHeader, 10) : undefined;
  return {
    diarize,
    numSpeakers: parsed !== undefined && Number.isFinite(parsed) ? parsed : undefined,
  };
}
