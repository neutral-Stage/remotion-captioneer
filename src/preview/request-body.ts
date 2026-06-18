/**
 * Bounded request body reader for preview upload endpoints.
 */

import type { IncomingMessage } from "http";

/** Default max upload size for preview STT/analyze (100 MB). */
export const PREVIEW_MAX_BODY_BYTES = 100 * 1024 * 1024;

export class RequestBodyTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Request body exceeds ${maxBytes} bytes`);
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readRequestBody(
  req: IncomingMessage,
  maxBytes: number = PREVIEW_MAX_BODY_BYTES
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    total += buf.length;
    if (total > maxBytes) {
      throw new RequestBodyTooLargeError(maxBytes);
    }
    chunks.push(buf);
  }

  return Buffer.concat(chunks);
}
