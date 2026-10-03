/**
 * Smoke tests — render each caption style component
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import { CAPTION_STYLES } from "../caption-styles.js";
import { demoCaptions } from "../studio/demo/captions.js";
import { AnimatedCaptions } from "./AnimatedCaptions.js";

// Remotion hooks need a frame context — mock for unit smoke tests
vi.mock("remotion", async () => {
  const actual = await vi.importActual<typeof import("remotion")>("remotion");
  return {
    ...actual,
    useCurrentFrame: () => 30,
    useVideoConfig: () => ({ fps: 30, width: 1920, height: 1080, durationInFrames: 240 }),
    spring: () => 1,
    interpolate: (_v: number, _i: number[], o: number[]) => o[1] ?? 1,
  };
});

describe("AnimatedCaptions styles", () => {
  for (const style of CAPTION_STYLES) {
    it(`renders style: ${style}`, () => {
      const { container } = render(
        <AnimatedCaptions captions={demoCaptions} style={style} highlightColor="#3b82f6" />
      );
      expect(container.firstChild).toBeTruthy();
    });
  }
});
