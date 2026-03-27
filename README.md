# 🎬 remotion-captioneer

**Drop-in animated captions for [Remotion](https://remotion.dev).**

Feed it audio. Get word-level synced, beautifully animated captions. Four styles. Zero hassle.

[![CI](https://github.com/neutral-Stage/remotion-captioneer/actions/workflows/ci.yml/badge.svg)](https://github.com/neutral-Stage/remotion-captioneer/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/remotion-captioneer)](https://www.npmjs.com/package/remotion-captioneer)
[![license](https://img.shields.io/github/license/neutral-Stage/remotion-captioneer)](LICENSE)
[![remotion](https://img.shields.io/badge/remotion-4.x-blue)](https://remotion.dev)
[![CodeQL](https://github.com/neutral-Stage/remotion-captioneer/actions/workflows/codeql.yml/badge.svg)](https://github.com/neutral-Stage/remotion-captioneer/actions/workflows/codeql.yml)

### 🌐 [Live Demo →](https://neutral-stage.github.io/remotion-captioneer/)

---

## 🤝 Works With `@remotion/captions`

Our types are **fully compatible** with the official [`@remotion/captions`](https://www.remotion.dev/docs/captions/api) package. You can convert freely between them:

```ts
import { createTikTokStyleCaptions } from "@remotion/captions";
import { toCaptionArray, fromCaptionArray } from "remotion-captioneer";

// Convert our CaptionData → flat Caption[] for @remotion/captions
const flatCaptions = toCaptionArray(myCaptionData);
const { pages } = createTikTokStyleCaptions({
  captions: flatCaptions,
  combineTokensWithinMilliseconds: 1200,
});

// Or go the other way: Caption[] → CaptionData
const captionData = fromCaptionArray(flatCaptions);
```

| | `@remotion/captions` (official) | `remotion-captioneer` (this) |
|---|---|---|
| **Caption types** | ✅ `Caption` type | ✅ Compatible + `CaptionData` with segments |
| **Page segmentation** | ✅ `createTikTokStyleCaptions()` | ❌ Use official package |
| **Animated components** | ❌ Build yourself | ✅ 4 ready-to-use styles |
| **STT/transcription** | ❌ Separate package | ✅ 5 providers built-in |
| **CLI tool** | ❌ | ✅ `npx captioneer process` |

---

## 🎥 Caption Styles Preview

<table>
<tr>
<td width="50%">

### Word Highlight
Each word lights up as it's spoken with a scale animation.
```
"Hello world this is"
  dim  dim  GOLD  dim
```

</td>
<td width="50%">

### Karaoke
Progressive color fill — left-to-right like karaoke.
```
"Hello world this is"
 RED   red  ░░░░  ░░░
```

</td>
</tr>
<tr>
<td width="50%">

### Typewriter
Character-by-character reveal with blinking cursor.
```
┌─────────────────────┐
│ Hello world th|      │
└─────────────────────┘
```

</td>
<td width="50%">

### Bounce
Active word bounces up with spring physics.
```
"Hello  world  this  is"
  ↓     ↑      ↓     ↓
       bounce!
```

</td>
</tr>
</table>

👉 **See them animated live at the [demo page](https://neutral-stage.github.io/remotion-captioneer/).**

---

## ✨ Features

- 🎙️ **5 STT Providers** — Local Whisper, OpenAI, Groq, Deepgram, AssemblyAI
- 🎨 **4 Caption Styles** — Word Highlight, Karaoke, Typewriter, Bounce
- ⚡ **Drop-in Components** — `<AnimatedCaptions>` works out of the box
- 🔧 **CLI Tool** — `npx captioneer process audio.mp4` to generate caption data
- 📦 **Zero Config** — Works with sensible defaults, customizable everything
- 🔷 **TypeScript** — Full type definitions included
- 🐳 **Docker Ready** — Deploy rendering at scale

---

## 🚀 Quick Start

### 1. Install

```bash
npm install remotion-captioneer
```

### 2. Generate Captions from Audio

```bash
npx captioneer process my-audio.mp4
```

This creates `my-audio-captions.json` with word-level timestamps.

### 3. Use in Your Remotion Project

```tsx
import { AbsoluteFill } from "remotion";
import { AnimatedCaptions } from "remotion-captioneer";
import captions from "./my-audio-captions.json";

export const MyVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <AnimatedCaptions
        captions={captions}
        style="word-highlight"
        position="bottom"
        highlightColor="#FFD700"
      />
    </AbsoluteFill>
  );
};
```

That's it. Render with `npx remotion render` as usual.

---

## 🎨 Caption Styles

| Style | Description | Best For |
|-------|-------------|----------|
| `word-highlight` | Each word lights up as it's spoken with a scale animation | Podcasts, interviews |
| `karaoke` | Progressive color fill — left-to-right like karaoke | Music, singing |
| `typewriter` | Character-by-character reveal with a blinking cursor | Tutorials, code demos |
| `bounce` | Active word bounces up with a spring animation | Social media, reels |

### Style Examples

```tsx
<AnimatedCaptions captions={captions} style="word-highlight" />
<AnimatedCaptions captions={captions} style="karaoke" />
<AnimatedCaptions captions={captions} style="typewriter" />
<AnimatedCaptions captions={captions} style="bounce" />
```

---

## 📡 STT Providers

Choose your speech-to-text backend. Supports 5 providers out of the box:

| Provider | Env Variable | Speed | Offline | Best For |
|----------|-------------|-------|---------|----------|
| **Local Whisper** | — | ⭐⭐ | ✅ | Privacy, no API costs |
| **OpenAI** | `OPENAI_API_KEY` | ⭐⭐⭐ | ❌ | Best accuracy |
| **Groq** | `GROQ_API_KEY` | ⭐⭐⭐⭐⭐ | ❌ | Ultra-fast inference |
| **Deepgram** | `DEEPGRAM_API_KEY` | ⭐⭐⭐⭐ | ❌ | Real-time capable |
| **AssemblyAI** | `ASSEMBLYAI_API_KEY` | ⭐⭐⭐ | ❌ | Rich features |

### Auto-Detection

The CLI auto-detects available providers from environment variables:

```bash
# Groq is fastest — set this first if you have a key
export GROQ_API_KEY="gsk_..."

# Or OpenAI
export OPENAI_API_KEY="sk-..."

# Then just run — it picks the best available
npx captioneer process audio.mp4
```

### Explicit Provider

```bash
npx captioneer process audio.mp4 --provider groq
npx captioneer process audio.mp4 --provider openai --model whisper-1
npx captioneer process audio.mp4 --provider deepgram --model nova-2
npx captioneer process audio.mp4 --provider assemblyai
npx captioneer process audio.mp4 --provider local --model base
```

### Check Provider Status

```bash
npx captioneer providers
```

```
📡 Available STT Providers:

  local           ✅ ready
                  models: tiny, base, small, medium, large

  groq            ✅ ready
                  models: whisper-large-v3, whisper-large-v3-turbo, distil-whisper-large-v3-en

  openai          ⚪ not configured
                  models: whisper-1
```

### Programmatic Usage

```ts
import { GroqProvider, OpenAIProvider } from "remotion-captioneer";

// Groq — ultra-fast
const groq = new GroqProvider("gsk_...");
const captions = await groq.transcribe("audio.mp4", {
  model: "whisper-large-v3-turbo",
  language: "en",
});

// OpenAI
const openai = new OpenAIProvider("sk-...");
const captions = await openai.transcribe("audio.mp4");

// Auto-detect from env
import { detectProvider } from "remotion-captioneer";
const detected = detectProvider();
if (detected) {
  const captions = await detected.provider.transcribe("audio.mp4");
}
```

---

## 🎙️ CLI Reference

### Process Audio

```bash
# Basic usage (auto-detects provider from env vars)
npx captioneer process audio.mp4

# Specify provider
npx captioneer process audio.mp4 --provider groq
npx captioneer process audio.mp4 --provider openai --model whisper-1

# With options
npx captioneer process audio.mp4 --provider groq --language en --output captions.json
npx captioneer process audio.mp4 --provider local --model base

# Pass API key directly
npx captioneer process audio.mp4 --provider groq --api-key gsk_...
```

**Options:**
- `-p, --provider <provider>` — STT provider: `local`, `openai`, `groq`, `deepgram`, `assemblyai`
- `-m, --model <model>` — Model name (provider-specific)
- `-k, --api-key <key>` — API key (or use env vars)
- `-l, --language <lang>` — Language code: `en`, `es`, `fr`, `de`, etc.
- `-o, --output <path>` — Output JSON path
- `-v, --verbose` — Verbose output

### Other Commands

```bash
# List available providers and their status
npx captioneer providers

# List available caption styles
npx captioneer styles

# Open Remotion Studio with demos
npx captioneer demo
```

---

## 📖 Caption Data Format

The generated JSON follows this structure:

```typescript
interface CaptionData {
  segments: Array<{
    text: string;           // Full segment text
    startMs: number;        // Segment start time (ms)
    endMs: number;          // Segment end time (ms)
    words: Array<{
      word: string;         // Word text
      startMs: number;      // Word start time (ms)
      endMs: number;        // Word end time (ms)
      confidence: number;   // Whisper confidence (0-1)
    }>;
  }>;
  language: string;         // Detected language
  durationMs: number;       // Total duration (ms)
}
```

You can also create caption data manually or from other sources — just match this format.

---

## ⚙️ Configuration

Create a `.captioneerrc` file in your project root:

```json
{
  "whisperPath": "./whisper.cpp",
  "modelPath": "./whisper.cpp/models/ggml-base.bin",
  "defaultModel": "base",
  "defaultLanguage": "en",
  "defaultStyle": "word-highlight"
}
```

Or add to your `package.json`:

```json
{
  "captioneer": {
    "defaultModel": "base",
    "defaultLanguage": "en"
  }
}
```

---

## 🎬 Full Example

```tsx
import {
  AbsoluteFill,
  Audio,
  Composition,
  staticFile,
} from "remotion";
import { AnimatedCaptions } from "remotion-captioneer";
import captions from "./captions.json";

export const CaptionedVideo = () => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)",
    }}
  >
    <Audio src={staticFile("my-audio.mp4")} />
    <AnimatedCaptions
      captions={captions}
      style="karaoke"
      position="bottom"
      highlightColor="#FF6B6B"
      fontSize={64}
      fontFamily="Inter, sans-serif"
    />
  </AbsoluteFill>
);

export const RemotionRoot = () => (
  <Composition
    id="CaptionedVideo"
    component={CaptionedVideo}
    durationInFrames={900} // 30s at 30fps
    fps={30}
    width={1920}
    height={1080}
  />
);
```

---

## 🐳 Docker

```dockerfile
FROM node:20-slim

# Install whisper.cpp dependencies
RUN apt-get update && apt-get install -y git cmake build-essential

WORKDIR /app
COPY . .
RUN npm install

# The CLI will auto-install whisper.cpp on first run
ENTRYPOINT ["npx", "captioneer"]
```

---

## 🛠️ Component Props

### `<AnimatedCaptions>`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `captions` | `CaptionData` | required | Caption data object |
| `style` | `CaptionStyle` | `"word-highlight"` | Caption animation style |
| `fontFamily` | `string` | `"Inter, sans-serif"` | Font family |
| `fontSize` | `number` | `56` | Font size in px |
| `fontColor` | `string` | `"rgba(255,255,255,0.5)"` | Inactive text color |
| `highlightColor` | `string` | `"#FFD700"` | Active/highlight color |
| `position` | `"top" \| "center" \| "bottom"` | `"bottom"` | Vertical position |

---

## 🗺️ Roadmap

- [ ] More caption styles (wave, glow, typewriter-erase)
- [ ] Multi-line auto-wrapping with smart breaks
- [ ] Word-level emoji reactions
- [ ] Real-time preview server
- [ ] Batch processing mode
- [ ] Integration with other STT providers (Deepgram, AssemblyAI)

---

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT © [Shuvo Roy](https://github.com/neutral-Stage)

---

## 💡 Why This Exists

Everyone using Remotion for captioned videos ends up rebuilding the same thing:

> Get audio → run Whisper → parse output → sync to frames → animate words

This package handles steps 2-5 so you can focus on your content, not plumbing.

**⭐ Star this repo if it helps you!**
