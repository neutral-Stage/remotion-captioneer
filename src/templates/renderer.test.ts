import { describe, it, expect } from "vitest";
import { buildTemplate } from "./index.js";
import type { Block, VideoTemplate } from "./types.js";

function countBlocks(blocks: Block[]): Record<string, number> {
  const counts: Record<string, number> = {};
  const visit = (block: Block): void => {
    counts[block.type] = (counts[block.type] ?? 0) + 1;
    if (block.type === "columns") {
      for (const child of block.columns) visit(child);
    }
    if (block.type === "grid") {
      for (const child of block.items) visit(child);
    }
  };
  for (const block of blocks) visit(block);
  return counts;
}

function allSceneBlocks(template: VideoTemplate): Block[] {
  return template.scenes.flatMap((s) => s.blocks);
}

describe("buildTemplate", () => {
  it("creates intro, caption, and outro scenes", () => {
    const template = buildTemplate({
      name: "Test",
      intro: { title: "Hello", subtitle: "Sub" },
      captions: [
        {
          captions: {
            language: "en",
            durationMs: 1000,
            segments: [],
          },
        },
      ],
      outro: { title: "Thanks" },
    });
    expect(template.scenes.length).toBeGreaterThanOrEqual(3);
    const types = countBlocks(allSceneBlocks(template));
    expect(types.heading).toBeGreaterThan(0);
    expect(types.captions).toBe(1);
  });

  it("supports columns and grid block types in custom scenes", () => {
    const template: VideoTemplate = {
      width: 1920,
      height: 1080,
      fps: 30,
      tokens: buildTemplate({
        name: "T",
        captions: [{ captions: { language: "en", durationMs: 1, segments: [] } }],
      }).tokens,
      scenes: [
        {
          id: "layout",
          durationInFrames: 90,
          blocks: [
            {
              id: "cols",
              type: "columns",
              columns: [
                { id: "a", type: "text", content: "Left" },
                { id: "b", type: "text", content: "Right" },
              ],
              ratios: [1, 1],
            },
            {
              id: "grid",
              type: "grid",
              columns: 2,
              items: [
                { id: "g1", type: "heading", content: "One" },
                { id: "g2", type: "heading", content: "Two" },
              ],
            },
            {
              id: "vid",
              type: "video",
              src: "clip.mp4",
            },
          ],
        },
      ],
    };
    const types = countBlocks(allSceneBlocks(template));
    expect(types.columns).toBe(1);
    expect(types.grid).toBe(1);
    expect(types.video).toBe(1);
    expect(types.text).toBe(2);
    expect(types.heading).toBe(2);
  });
});
