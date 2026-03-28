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
- 🎨 **14 Caption Styles** — Word Highlight, Karaoke, Typewriter, Bounce, Wave, Glow, Erase, Pill, Flicker, Highlighter, Blur, Rainbow, Scale, Spotlight
- 🎭 **24 Presets** — TikTok, Instagram, YouTube, Podcast, Cinematic, Music, Tutorial, Minimal, Gaming, News, Education, Fun
- 🎵 **Audio-Video Sync** — Beat detection, volume-reactive animations, timeline keyframes
- 📦 **Template System** — Data-driven video generation from JSON config
- 🧱 **Layout Primitives** — Stack, Row, Columns, Grid, Center, FadeIn, SlideUp
- 📤 **7 Export Formats** — SRT, VTT, ASS, TXT, word-level SRT & VTT
- ⚡ **Drop-in Components** — `<AnimatedCaptions>` works out of the box
- 🔧 **CLI Tool** — process, batch, export, presets, providers, styles
- 📐 **Zero Config** — Works with sensible defaults, customizable everything
- 🔷 **TypeScript** — Full type definitions included
- 🐳 **Docker Ready** — Deploy rendering at scale

---

## 🚀 Quick Start

### Option 1: Scaffold a Project

```bash
npx captioneer init my-video
cd my-video
npm install
npm start
```

This creates a ready-to-use Remotion project with captions.

### Option 2: Add to Existing Project

#### 1. Install

```bash
npm install remotion-captioneer
```

### Option 2: Add to Existing Project

#### 1. Install

```bash
npm install remotion-captioneer
```

#### 2. Generate Captions from Audio

```bash
npx captioneer process my-audio.mp4
```

This creates `my-audio-captions.json` with word-level timestamps.

#### 3. Use in Your Remotion Project

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

14 animated styles, each with a unique visual feel:

| Style | Effect | Best For |
|-------|--------|----------|
| `word-highlight` | Each word lights up with scale animation | Podcasts, interviews |
| `karaoke` | Progressive left-to-right color fill | Music, singing |
| `typewriter` | Character-by-character reveal + cursor | Tutorials, code demos |
| `bounce` | Active word bounces with spring physics | Social media, reels |
| `wave` | Words animate in a wave pattern | Music, rhythmic content |
| `glow` | Neon glow pulsing on active word | Cinematic, dramatic |
| `typewriter-erase` | Types then erases word-by-word | Transitions, reveals |
| `pill` | Active word in a colored pill/badge | Clean, modern look |
| `flicker` | Flickers in like a neon sign | Retro, neon aesthetic |
| `highlighter` | Yellow highlighter behind active word | Study, educational |
| `blur` | Future words blur, active word sharpens | Dramatic reveals |
| `rainbow` | Cycling rainbow colors on active word | Fun, playful content |
| `scale` | Words grow from small to full size | Energetic, bold |
| `spotlight` | Radial spotlight effect behind active word | Theatrical, stage |

```tsx
<AnimatedCaptions captions={captions} style="word-highlight" />
<AnimatedCaptions captions={captions} style="karaoke" />
<AnimatedCaptions captions={captions} style="typewriter" />
<AnimatedCaptions captions={captions} style="bounce" />
<AnimatedCaptions captions={captions} style="wave" />
<AnimatedCaptions captions={captions} style="glow" />
<AnimatedCaptions captions={captions} style="typewriter-erase" />
<AnimatedCaptions captions={captions} style="pill" />
<AnimatedCaptions captions={captions} style="flicker" />
<AnimatedCaptions captions={captions} style="highlighter" />
<AnimatedCaptions captions={captions} style="blur" />
<AnimatedCaptions captions={captions} style="rainbow" />
<AnimatedCaptions captions={captions} style="scale" />
<AnimatedCaptions captions={captions} style="spotlight" />
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

---

## 🎭 Caption Presets

Apply a professional look instantly with one of 16 built-in presets:

```tsx
import { AnimatedCaptions, applyPreset } from "remotion-captioneer";

// Use a preset
<AnimatedCaptions
  captions={captions}
  {...applyPreset("tiktok")}
/>

// Or spread individual props
const tiktokStyle = applyPreset("cinematic-gold");
<AnimatedCaptions captions={captions} {...tiktokStyle} />
```

### Available Presets

| Category | Presets |
|----------|---------|
| **Social Media** | `tiktok`, `instagram-reels`, `youtube-shorts`, `twitter-clips` |
| **Podcast** | `podcast-clean`, `podcast-bold` |
| **Cinematic** | `cinematic-gold`, `cinematic-white`, `cinematic-neon` |
| **Music** | `music-karaoke`, `music-wave` |
| **Tutorial** | `tutorial-typewriter`, `tutorial-erase` |
| **Minimal** | `minimal-white`, `minimal-subtle` |
| **Gaming** | `gaming-neon`, `gaming-bold` |
| **News & Documentary** | `news-ticker`, `documentary` |
| **Education** | `education-highlighter`, `education-scale` |
| **Fun & Creative** | `fun-rainbow`, `retro-flicker` |

```bash
# List presets from CLI
npx captioneer presets
```

---

## 📤 Export Formats

Export captions to standard subtitle formats:

```ts
import { toSRT, toVTT, toASS, toPlainText } from "remotion-captioneer";

const srt = toSRT(captionData);       // SubRip (.srt)
const vtt = toVTT(captionData);       // WebVTT (.vtt)
const ass = toASS(captionData);       // SubStation Alpha (.ass)
const txt = toPlainText(captionData); // Plain text

// Word-level exports (for custom timing)
const srtWords = toWordLevelSRT(captionData);
const vttWords = toWordLevelVTT(captionData);
```

```bash
# Export from CLI
npx captioneer export captions.json --format srt
npx captioneer export captions.json --format vtt --output subtitles.vtt
npx captioneer export captions.json --format ass
npx captioneer export captions.json --format srt-words
```

**Formats:** `srt`, `vtt`, `ass`, `txt`, `srt-words`, `vtt-words`

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

## 🎵 Audio-Video Sync

**Frame-perfect animations synchronized to audio.** No more manually timing keyframes.

### Pre-analyze Audio

```ts
import { analyzeAudio } from "remotion-captioneer";

const analysis = await analyzeAudio("my-audio.mp4");
// Returns: beats, volumeFrames, bpm, energy levels
```

### Beat-Reactive Hooks

```tsx
import {
  AudioSyncProvider,
  useBeatPulse,
  useVolume,
  useEnergy,
} from "remotion-captioneer";

// Wrap your composition
const MyVideo = () => (
  <AudioSyncProvider analysis={audioAnalysis}>
    <BeatReactiveContent />
  </AudioSyncProvider>
);

// Use in any child component
const BeatReactiveContent = () => {
  const pulse = useBeatPulse();       // 0→1 spring on each beat
  const volume = useVolume();          // Current volume 0-1
  const energy = useEnergy();          // Smoothed energy 0-1

  return (
    <div style={{
      transform: `scale(${1 + pulse * 0.2})`,
      opacity: 0.5 + volume * 0.5,
    }}>
      🎵 Synced to the beat!
    </div>
  );
};
```

### Timeline Keyframes

```tsx
import { useTimelineValue, fadeInOut } from "remotion-captioneer";

// Map animation to audio timestamps (in ms)
const opacity = useTimelineValue({
  keyframes: [
    { timeMs: 0, value: 0 },
    { timeMs: 1000, value: 1, easing: "easeOut" },
    { timeMs: 5000, value: 1 },
    { timeMs: 6000, value: 0, easing: "easeIn" },
  ],
  defaultValue: 0,
});

// Or use the helper
const fadeOpacity = useTimelineValue(
  fadeInOut(0, 1000, 5000, 6000)
);
```

### Available Hooks

| Hook | Returns | Use For |
|------|---------|---------|
| `useVolume()` | `number` (0-1) | Opacity, scale, size |
| `useBeat()` | `BeatInfo \| null` | Flash effects, pulses |
| `useBeatPulse()` | `number` (0-1 spring) | Bounce, scale on beat |
| `useEnergy()` | `number` (0-1) | Background intensity |
| `useIsOnBeat()` | `boolean` | Conditional rendering |
| `useTimelineValue()` | `number` | Keyframe animations |
| `useTimelineProgress()` | `number` (0-1) | Progress bars |

---

## 📦 Template System

**Build videos from JSON config.** No code needed for simple videos.

### Quick Template

```ts
import { buildTemplate, TemplateComposition } from "remotion-captioneer";

const template = buildTemplate({
  name: "My Captioned Video",
  intro: {
    title: "Episode 1",
    subtitle: "Getting Started",
    logo: "/logo.png",
  },
  captions: [
    { captions: myCaptions, captionStyle: "word-highlight" },
  ],
  outro: {
    heading: "Thanks for watching!",
    cta: "Subscribe for more",
    logo: "/logo.png",
  },
});

// Use as Remotion composition
<TemplateComposition template={template} />
```

### Preset Scenes

```ts
import {
  createIntroScene,
  createCaptionScene,
  createOutroScene,
  createDividerScene,
} from "remotion-captioneer";

const intro = createIntroScene({
  title: "My Video",
  subtitle: "A demo",
  durationSec: 3,
});

const content = createCaptionScene({
  captions: myCaptions,
  captionStyle: "karaoke",
  highlightColor: "#FF6B6B",
});

const outro = createOutroScene({
  heading: "The End",
  cta: "Like & Subscribe",
  logo: "/logo.png",
});
```

### Design Tokens

Customize the entire look with a single config:

```ts
const template = buildTemplate({
  name: "Brand Video",
  tokens: {
    colors: {
      primary: "#6366F1",
      accent: "#FFD700",
      background: "#0a0a0a",
      text: "#FFFFFF",
    },
    typography: {
      headingFont: "Poppins, sans-serif",
      bodyFont: "Inter, sans-serif",
    },
  },
  // ...
});
```

---

## 🧱 Layout Primitives

**Composable layout building blocks** for any Remotion video:

```tsx
import {
  Stack, Row, Columns, Grid,
  Center, FadeIn, SlideUp,
  GradientBg, Overlay, Positioned,
} from "remotion-captioneer";

// Vertical stack
<Stack gap={24}>
  <FadeIn delayMs={0}>Title</FadeIn>
  <FadeIn delayMs={200}>Subtitle</FadeIn>
</Stack>

// Horizontal columns
<Columns ratios={[2, 1]} gap={32}>
  <div>Main content</div>
  <div>Sidebar</div>
</Columns>

// Grid layout
<Grid columns={3} gap={16}>
  {items.map(item => <Card key={item.id} />)}
</Grid>

// Animated entrance
<SlideUp delayMs={500} durationMs={800}>
  <div>Slides up with delay</div>
</SlideUp>

// Gradient background
<GradientBg from="#0a0a0a" to="#1a1a2e">
  <Center>Content here</Center>
</GradientBg>
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
# Scaffold a new project
npx captioneer init my-video

# List available providers and their status
npx captioneer providers

# List available caption styles
npx captioneer styles

# List available presets
npx captioneer presets

# Export captions to SRT/VTT/ASS
npx captioneer export captions.json --format srt
npx captioneer export captions.json --format vtt --output subs.vtt

# Batch process a directory of audio files
npx captioneer batch ./audio-files/
npx captioneer batch ./audio-files/ --provider groq --output-dir ./captions/

# Start real-time preview server
npx captioneer preview

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

## 📚 Examples

See the [`examples/`](https://github.com/neutral-Stage/remotion-captioneer/tree/main/examples) directory for complete working examples:

| File | What it shows |
|------|---------------|
| `01-basic.tsx` | Simplest captioned video |
| `02-presets.tsx` | Using presets (TikTok, Cinematic, Gaming) |
| `03-audio-sync.tsx` | Beat-reactive animations |
| `04-template.tsx` | Multi-scene template (intro → content → outro) |
| `05-layouts.tsx` | Custom layouts with primitives |
| `06-export.ts` | Export to SRT, VTT, ASS formats |
| `07-emoji.tsx` | Emoji reactions at word timestamps |

---

## 🗺️ Roadmap

### ✅ Completed

- [x] 14 caption styles (word-highlight, karaoke, typewriter, bounce, wave, glow, typewriter-erase, pill, flicker, highlighter, blur, rainbow, scale, spotlight)
- [x] 24 caption presets across 10 categories (Social, Podcast, Cinematic, Music, Tutorial, Minimal, Gaming, News, Education, Fun)
- [x] Multi-line auto-wrapping with smart breaks (`smartWrap()`)
- [x] Word-level emoji reactions (`EmojiReactions` + `autoGenerateReactions()`)
- [x] Real-time preview server (`npx captioneer preview`)
- [x] Batch processing mode (`npx captioneer batch ./audio/`)
- [x] Multi-provider STT (OpenAI, Groq, Deepgram, AssemblyAI, Local Whisper)
- [x] @remotion/captions compatibility layer
- [x] Audio-video sync (beat detection, volume hooks, timeline keyframes)
- [x] Template system for data-driven videos
- [x] Layout primitives (Stack, Row, Columns, Grid, FadeIn, SlideUp, etc.)
- [x] Export formats (SRT, VTT, ASS, TXT, word-level SRT & VTT)
- [x] Project scaffolder (`npx captioneer init`)
- [x] 7 working examples covering all features
- [x] 10 CLI commands (init, process, batch, export, preview, presets, providers, styles, demo)
- [x] GitHub Pages demo with all 14 styles animated
- [x] GitHub Actions CI/CD (build, test, release to npm, CodeQL)
- [x] 0 vulnerabilities in npm audit

### 🔮 Future

- [ ] Caption style marketplace (community-contributed styles)
- [ ] AI-powered auto-emoji (LLM suggests emojis from context)
- [ ] Multi-language caption support with RTL
- [ ] Caption editor with visual timeline
- [ ] Integration with video hosting APIs (YouTube, Vimeo)
- [ ] Real-time caption rendering in browser (WebCodecs)
- [ ] Caption translation utilities
- [ ] Speaker diarization (multi-speaker support)

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
