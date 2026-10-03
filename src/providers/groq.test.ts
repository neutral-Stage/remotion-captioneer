import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { GroqProvider } from "./groq.js";

describe("GroqProvider", () => {
  const originalFetch = globalThis.fetch;
  let tempDir: string;
  let audioPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "captioneer-groq-"));
    audioPath = join(tempDir, "test.mp3");
    writeFileSync(audioPath, Buffer.from([0, 1, 2, 3]));
  });

  afterEach(() => {
    vi.stubGlobal("fetch", originalFetch);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("parses verbose_json response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            language: "en",
            segments: [
              { start: 0, end: 1, text: "hello world" },
            ],
            words: [
              { word: "hello", start: 0, end: 0.5 },
              { word: "world", start: 0.5, end: 1 },
            ],
          }),
          { status: 200 }
        )
      )
    );

    const provider = new GroqProvider("test-key");
    const result = await provider.transcribe(audioPath);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]?.words).toHaveLength(2);
    expect(result.language).toBe("en");
  });
});
