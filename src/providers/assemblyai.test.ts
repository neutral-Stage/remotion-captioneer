import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { AssemblyAIProvider } from "./assemblyai.js";

describe("AssemblyAIProvider language", () => {
  const originalFetch = globalThis.fetch;
  let tempDir: string;
  let audioPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "captioneer-aai-"));
    audioPath = join(tempDir, "test.mp3");
    writeFileSync(audioPath, Buffer.from([0, 1, 2, 3]));

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.endsWith("/upload")) {
          return new Response(JSON.stringify({ upload_url: "https://upload.test/audio" }), {
            status: 200,
          });
        }
        if (url.endsWith("/transcript") && init?.method === "POST") {
          return new Response(JSON.stringify({ id: "tx-1" }), { status: 200 });
        }
        if (url.includes("/transcript/tx-1")) {
          return new Response(
            JSON.stringify({
              status: "completed",
              language_code: "es",
              words: [{ text: "hola", start: 0, end: 400, confidence: 0.99 }],
            }),
            { status: 200 }
          );
        }
        return new Response("not found", { status: 404 });
      })
    );
  });

  afterEach(() => {
    vi.stubGlobal("fetch", originalFetch);
    vi.restoreAllMocks();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("maps options.language to language_code in transcript request", async () => {
    const provider = new AssemblyAIProvider("test-key");
    await provider.transcribe(audioPath, { language: "es" });

    const transcriptCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) => url.endsWith("/transcript") && init?.method === "POST"
    );
    expect(transcriptCall).toBeDefined();
    const body = JSON.parse((transcriptCall![1] as RequestInit).body as string);
    expect(body.language_code).toBe("es");
  });

  it("omits language_code when no language is set (auto-detect)", async () => {
    const provider = new AssemblyAIProvider("test-key");
    await provider.transcribe(audioPath, {});

    const transcriptCall = (fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      ([url, init]) => url.endsWith("/transcript") && init?.method === "POST"
    );
    const body = JSON.parse((transcriptCall![1] as RequestInit).body as string);
    expect(body.language_code).toBeUndefined();
  });
});
