import { describe, expect, it } from "vitest";
import {
  assertRenderableCaptions,
  computeRenderMetadata,
  type RenderInputProps,
} from "./pipeline.js";
import type { CaptionData, Word } from "../types.js";

function word(text: string, startMs: number, endMs: number): Word {
  return { word: text, startMs, endMs, confidence: 1 };
}

const captions: CaptionData = {
  segments: [
    {
      text: "hello world",
      startMs: 0,
      endMs: 2000,
      words: [word("hello", 0, 1000), word("world", 1000, 2000)],
    },
  ],
  language: "en",
  durationMs: 2000,
};

const base: RenderInputProps = { captions };

describe("computeRenderMetadata", () => {
  it("derives duration from the caption data plus tail padding", () => {
    const meta = computeRenderMetadata({ ...base, fps: 30 });
    // 2000ms @ 30fps = 60 frames + 15 tail
    expect(meta.durationInFrames).toBe(75);
    expect(meta.fps).toBe(30);
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(1920);
  });

  it("uses custom fps and resolution", () => {
    const meta = computeRenderMetadata({ ...base, fps: 60, width: 1920, height: 1080 });
    expect(meta.durationInFrames).toBe(135);
    expect(meta.width).toBe(1920);
    expect(meta.height).toBe(1080);
  });

  it("rejects invalid fps and resolution", () => {
    expect(() => computeRenderMetadata({ ...base, fps: 0 })).toThrow(/fps/);
    expect(() => computeRenderMetadata({ ...base, width: -5, height: 1080 })).toThrow(
      /resolution/i
    );
  });
});

describe("assertRenderableCaptions", () => {
  it("accepts well-formed captions", () => {
    expect(() => assertRenderableCaptions(captions)).not.toThrow();
  });

  it("rejects captions without words", () => {
    expect(() =>
      assertRenderableCaptions({ ...captions, segments: [{ ...captions.segments[0]!, words: [] }] })
    ).toThrow(/no words/i);
  });

  it("rejects non-positive word durations", () => {
    const broken: CaptionData = {
      ...captions,
      segments: [
        {
          ...captions.segments[0]!,
          words: [word("bad", 500, 500)],
        },
      ],
    };
    expect(() => assertRenderableCaptions(broken)).toThrow(/non-positive duration/i);
  });

  it("rejects overlapping words", () => {
    const overlapping: CaptionData = {
      ...captions,
      segments: [
        {
          ...captions.segments[0]!,
          words: [word("a", 0, 500), word("b", 200, 600)],
        },
      ],
    };
    expect(() => assertRenderableCaptions(overlapping)).toThrow(/before the previous word/i);
  });
});
