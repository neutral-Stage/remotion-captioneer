import { describe, expect, it } from "vitest";
import { Readable } from "stream";
import type { IncomingMessage } from "http";
import {
  PREVIEW_MAX_BODY_BYTES,
  readRequestBody,
  RequestBodyTooLargeError,
} from "./request-body.js";

function mockRequest(chunks: Buffer[]): IncomingMessage {
  const stream = Readable.from(chunks);
  return stream as unknown as IncomingMessage;
}

describe("readRequestBody", () => {
  it("concatenates chunks", async () => {
    const body = await readRequestBody(
      mockRequest([Buffer.from("hello"), Buffer.from(" world")])
    );
    expect(body.toString("utf-8")).toBe("hello world");
  });

  it("rejects bodies over the max size", async () => {
    const big = Buffer.alloc(2048);
    await expect(readRequestBody(mockRequest([big]), 1024)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });

  it("allows bodies within limit", async () => {
    const body = await readRequestBody(mockRequest([Buffer.from("ok")]), 1024);
    expect(body.toString()).toBe("ok");
  });
});
