import { describe, expect, it } from "vitest";
import { parseYouTubeId } from "../hosting/youtube.js";
import { parseVimeoId } from "../hosting/vimeo.js";
import { detectHostingProvider, resolveVideoUrl } from "../hosting/registry.js";
import { validateStylePackage } from "../marketplace/schema.js";
import { readFileSync } from "fs";
import { join } from "path";

describe("hosting", () => {
  it("parses YouTube watch URLs", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("parses Vimeo URLs", () => {
    expect(parseVimeoId("https://vimeo.com/123456789")).toBe("123456789");
    expect(parseVimeoId("https://player.vimeo.com/video/123456789")).toBe(
      "123456789"
    );
  });

  it("resolves YouTube metadata without API key", async () => {
    const provider = detectHostingProvider("https://youtu.be/dQw4w9WgXcQ");
    expect(provider?.name).toBe("youtube");

    const info = await resolveVideoUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(info.provider).toBe("youtube");
    expect(info.videoId).toBe("dQw4w9WgXcQ");
    expect(info.thumbnailUrl).toContain("dQw4w9WgXcQ");
  });
});

describe("marketplace schema", () => {
  it("validates the sample style package", () => {
    const raw = JSON.parse(
      readFileSync(
        join(process.cwd(), "examples/marketplace/sample-style.json"),
        "utf-8"
      )
    );
    const pkg = validateStylePackage(raw);
    expect(pkg.meta.id).toBe("sample-neon-pulse");
    expect(pkg.preset.style).toBe("glow");
  });

  it("rejects unknown animation styles", () => {
    expect(() =>
      validateStylePackage({
        schemaVersion: 1,
        meta: {
          id: "bad",
          name: "Bad",
          description: "Bad",
          version: "1.0.0",
        },
        preset: {
          name: "Bad",
          description: "Bad",
          style: "custom-plugin",
          fontFamily: "Inter",
          fontSize: 48,
          fontColor: "#fff",
          highlightColor: "#000",
          position: "bottom",
        },
      })
    ).toThrow(/built-in style/);
  });
});
