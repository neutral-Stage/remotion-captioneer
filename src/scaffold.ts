#!/usr/bin/env node

/**
 * captioneer init — Scaffold a new Remotion caption project
 *
 * Creates a ready-to-use project with:
 * - Remotion setup
 * - Example composition
 * - Sample captions
 * - Package.json with dependencies
 */

import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, resolve } from "path";

export function scaffoldProject(projectName: string, dir: string = "."): void {
  const projectDir = resolve(dir, projectName);

  if (existsSync(projectDir)) {
    console.error(`❌ Directory already exists: ${projectDir}`);
    process.exit(1);
  }

  console.log(`\n🎬 Creating project: ${projectName}\n`);

  // Create directory structure
  mkdirSync(join(projectDir, "src"), { recursive: true });
  mkdirSync(join(projectDir, "public"), { recursive: true });

  // package.json
  writeFileSync(
    join(projectDir, "package.json"),
    JSON.stringify(
      {
        name: projectName,
        version: "1.0.0",
        description: "A Remotion captioned video project",
        scripts: {
          start: "npx remotion studio",
          build: "npx remotion render CaptionedVideo out/video.mp4",
          preview: "npx remotion preview",
        },
        dependencies: {
          remotion: "^4.0.438",
          "@remotion/cli": "^4.0.438",
          "remotion-captioneer": "^0.8.0",
          react: "^18.3.1",
          "react-dom": "^18.3.1",
        },
        devDependencies: {
          "@types/react": "^18.3.12",
          typescript: "^5.6.3",
        },
      },
      null,
      2
    )
  );

  // tsconfig.json
  writeFileSync(
    join(projectDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          outDir: "dist",
        },
        include: ["src/**/*"],
      },
      null,
      2
    )
  );

  // Sample captions
  writeFileSync(
    join(projectDir, "src", "captions.json"),
    JSON.stringify(
      {
        segments: [
          {
            text: "Welcome to your captioned video",
            startMs: 0,
            endMs: 2500,
            words: [
              { word: "Welcome", startMs: 0, endMs: 500, confidence: 0.98 },
              { word: "to", startMs: 500, endMs: 800, confidence: 0.99 },
              { word: "your", startMs: 800, endMs: 1200, confidence: 0.97 },
              { word: "captioned", startMs: 1200, endMs: 1800, confidence: 0.96 },
              { word: "video", startMs: 1800, endMs: 2500, confidence: 0.98 },
            ],
          },
          {
            text: "Built with remotion-captioneer",
            startMs: 2800,
            endMs: 5500,
            words: [
              { word: "Built", startMs: 2800, endMs: 3200, confidence: 0.98 },
              { word: "with", startMs: 3200, endMs: 3500, confidence: 0.99 },
              { word: "remotion-captioneer", startMs: 3500, endMs: 5500, confidence: 0.95 },
            ],
          },
          {
            text: "Drop-in animated captions for any project",
            startMs: 5800,
            endMs: 8500,
            words: [
              { word: "Drop-in", startMs: 5800, endMs: 6400, confidence: 0.94 },
              { word: "animated", startMs: 6400, endMs: 7000, confidence: 0.97 },
              { word: "captions", startMs: 7000, endMs: 7600, confidence: 0.98 },
              { word: "for", startMs: 7600, endMs: 7900, confidence: 0.99 },
              { word: "any", startMs: 7900, endMs: 8200, confidence: 0.98 },
              { word: "project", startMs: 8200, endMs: 8500, confidence: 0.97 },
            ],
          },
        ],
        language: "en",
        durationMs: 8500,
      },
      null,
      2
    )
  );

  // Main video component
  writeFileSync(
    join(projectDir, "src", "Video.tsx"),
    `import { AbsoluteFill, Audio, staticFile } from "remotion";
import { AnimatedCaptions, applyPreset } from "remotion-captioneer";
import captions from "./captions.json";

/**
 * CaptionedVideo — Your main video composition
 *
 * Customize the style prop to change the caption look:
 *   "word-highlight", "karaoke", "typewriter", "bounce",
 *   "wave", "glow", "pill", "flicker", "highlighter",
 *   "blur", "rainbow", "scale", "spotlight"
 *
 * Or use a preset:
 *   {...applyPreset("tiktok")}
 *   {...applyPreset("cinematic-gold")}
 *   {...applyPreset("podcast-bold")}
 */
export const CaptionedVideo = () => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
    }}
  >
    {/* Uncomment to add audio:
    <Audio src={staticFile("audio.mp3")} />
    */}

    <AnimatedCaptions
      captions={captions}
      style="word-highlight"
      position="bottom"
      highlightColor="#FFD700"
      fontSize={58}
    />
  </AbsoluteFill>
);
`
  );

  // Root composition
  writeFileSync(
    join(projectDir, "src", "Root.tsx"),
    `import { Composition } from "remotion";
import { CaptionedVideo } from "./Video";
import captions from "./captions.json";

// Calculate total frames from caption duration
const durationMs = captions.durationMs;
const fps = 30;
const durationInFrames = Math.ceil((durationMs / 1000) * fps) + 30; // +30 for padding

export const RemotionRoot = () => (
  <>
    <Composition
      id="CaptionedVideo"
      component={CaptionedVideo}
      durationInFrames={durationInFrames}
      fps={fps}
      width={1920}
      height={1080}
    />
  </>
);
`
  );

  // Index entry point
  writeFileSync(
    join(projectDir, "src", "index.ts"),
    `export { RemotionRoot } from "./Root";
export { CaptionedVideo } from "./Video";
`
  );

  // README
  writeFileSync(
    join(projectDir, "README.md"),
    `# ${projectName}

A captioned video project built with [Remotion](https://remotion.dev) and [remotion-captioneer](https://github.com/neutral-Stage/remotion-captioneer).

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Open Remotion Studio (preview)
npm start

# Render video
npm run build
\`\`\`

## Customize

### Change Caption Style

Edit \`src/Video.tsx\` and change the \`style\` prop:

\`\`\`tsx
<AnimatedCaptions
  captions={captions}
  style="karaoke"  // Try: word-highlight, karaoke, typewriter, bounce, wave, glow, pill, flicker, highlighter, blur, rainbow, scale, spotlight
  highlightColor="#FF6B6B"
/>
\`\`\`

### Use a Preset

\`\`\`tsx
import { AnimatedCaptions, applyPreset } from "remotion-captioneer";

<AnimatedCaptions
  captions={captions}
  {...applyPreset("tiktok")}  // Try: instagram-reels, podcast-bold, cinematic-gold, gaming-neon, etc.
/>
\`\`\`

### Add Your Own Audio

1. Drop an audio file in \`public/\`
2. Uncomment the \`<Audio>\` component in \`src/Video.tsx\`
3. Generate captions: \`npx captioneer process public/audio.mp3\`
4. Replace \`src/captions.json\` with the output

### Add Multiple Scenes

\`\`\`tsx
import { buildTemplate, TemplateComposition } from "remotion-captioneer";

const template = buildTemplate({
  name: "My Video",
  intro: { title: "Episode 1", subtitle: "Getting Started" },
  captions: [{ captions, captionStyle: "karaoke" }],
  outro: { heading: "Thanks for watching!", cta: "Subscribe" },
});

<TemplateComposition template={template} />
\`\`\`

## Resources

- [remotion-captioneer Docs](https://github.com/neutral-Stage/remotion-captioneer#readme)
- [Remotion Docs](https://remotion.dev/docs)
- [Caption Styles](https://github.com/neutral-Stage/remotion-captioneer#-caption-styles)
- [Presets](https://github.com/neutral-Stage/remotion-captioneer#-caption-presets)
`
  );

  // .gitignore
  writeFileSync(
    join(projectDir, ".gitignore"),
    `node_modules/
dist/
out/
.captioneer-cache/
`
  );

  console.log("✅ Project created!\n");
  console.log("  📁 " + projectDir);
  console.log("  📄 src/Video.tsx — Your video component");
  console.log("  📄 src/Root.tsx — Remotion compositions");
  console.log("  📄 src/captions.json — Sample caption data\n");
  console.log("  Next steps:");
  console.log("    cd " + projectName);
  console.log("    npm install");
  console.log("    npm start\n");
}
