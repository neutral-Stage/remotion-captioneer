// Example 4: Multi-Scene Template
// Build complete videos from config — intro, content, outro

import { TemplateComposition, buildTemplate } from "remotion-captioneer";
import captions from "./captions.json";

const template = buildTemplate({
  name: "My Captioned Video",
  width: 1920,
  height: 1080,
  fps: 30,

  // Design tokens for consistent theming
  tokens: {
    colors: {
      primary: "#6366F1",
      accent: "#FFD700",
      background: "#0a0a0a",
      text: "#FFFFFF",
    },
    typography: {
      headingFont: "Inter, sans-serif",
      bodyFont: "Inter, sans-serif",
    },
  },

  // Intro scene
  intro: {
    title: "Episode 1",
    subtitle: "Getting Started with Captions",
    logo: "/logo.png",
    durationSec: 3,
  },

  // Captioned content scenes
  captions: [
    {
      captions,
      captionStyle: "word-highlight",
      highlightColor: "#FFD700",
    },
  ],

  // Outro scene
  outro: {
    heading: "Thanks for watching!",
    cta: "Like & Subscribe for more",
    logo: "/logo.png",
    durationSec: 3,
  },
});

export const TemplateVideo = () => (
  <TemplateComposition template={template} />
);
