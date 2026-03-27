/**
 * Remotion Root — registers all compositions
 */

import React from "react";
import { Composition } from "remotion";
import { CaptionShowcase } from "./CaptionShowcase.js";
import type { CaptionData } from "./types.js";

// Demo captions for preview
const demoCaptions: CaptionData = {
  language: "en",
  durationMs: 8000,
  segments: [
    {
      text: "Hello world this is awesome",
      startMs: 0,
      endMs: 3000,
      words: [
        { word: "Hello", startMs: 0, endMs: 600, confidence: 0.98 },
        { word: "world", startMs: 600, endMs: 1200, confidence: 0.95 },
        { word: "this", startMs: 1200, endMs: 1800, confidence: 0.97 },
        { word: "is", startMs: 1800, endMs: 2400, confidence: 0.99 },
        { word: "awesome", startMs: 2400, endMs: 3000, confidence: 0.96 },
      ],
    },
    {
      text: "Remotion captions are beautiful",
      startMs: 3200,
      endMs: 6500,
      words: [
        { word: "Remotion", startMs: 3200, endMs: 4000, confidence: 0.98 },
        { word: "captions", startMs: 4000, endMs: 4800, confidence: 0.95 },
        { word: "are", startMs: 4800, endMs: 5300, confidence: 0.97 },
        { word: "beautiful", startMs: 5300, endMs: 6500, confidence: 0.96 },
      ],
    },
    {
      text: "Let's build something amazing",
      startMs: 6800,
      endMs: 8000,
      words: [
        { word: "Let's", startMs: 6800, endMs: 7200, confidence: 0.94 },
        { word: "build", startMs: 7200, endMs: 7500, confidence: 0.98 },
        { word: "something", startMs: 7500, endMs: 7800, confidence: 0.96 },
        { word: "amazing", startMs: 7800, endMs: 8000, confidence: 0.99 },
      ],
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WordHighlightDemo"
        component={CaptionShowcase}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          captions: demoCaptions,
          style: "word-highlight" as const,
        }}
      />
      <Composition
        id="KaraokeDemo"
        component={CaptionShowcase}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          captions: demoCaptions,
          style: "karaoke" as const,
        }}
      />
      <Composition
        id="TypewriterDemo"
        component={CaptionShowcase}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          captions: demoCaptions,
          style: "typewriter" as const,
        }}
      />
      <Composition
        id="BounceDemo"
        component={CaptionShowcase}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          captions: demoCaptions,
          style: "bounce" as const,
        }}
      />
    </>
  );
};
