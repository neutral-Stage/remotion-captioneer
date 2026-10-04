# remotion-captioneer

**Drop-in animated captions for [Remotion](https://remotion.dev).**

Feed it audio. Get word-level synced, beautifully animated captions. **14 styles.** Zero hassle.

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
| **Animated components** | ❌ Build yourself | ✅ 14 ready-to-use styles |
| **STT/transcription** | ❌ Separate package | ✅ 6 providers built-in |
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

- 🧠 **Smart Captions** — Auto-emphasis (stretched / caps / loud), per-speaker colors, beat-snapped timing, filler-word removal
- 🎞️ **Custom Animations** — keyframe word motion as data; installable via marketplace style packages
- 🎥 **Zero-React Rendering** — `captioneer render captions.json --audio clip.mp3` (or `--video footage.mp4`) outputs a captioned MP4
- 📺 **Broadcast QA** — Characters-per-second pacing analysis + profanity filtering (mask/remove/flag)
- 🎙️ **6 STT Providers** — Local Whisper, OpenAI, Groq, Deepgram, AssemblyAI, ElevenLabs
- 🎨 **14 Caption Styles** — Word Highlight, Karaoke, Typewriter, Bounce, Wave, Glow, Erase, Pill, Flicker, Highlighter, Blur, Rainbow, Scale, Spotlight
- 🎭 **23 Presets** — TikTok, Instagram, YouTube, Podcast, Cinematic, Music, Tutorial, Minimal, Gaming, News, Education, Fun
- 🎵 **Audio-Video Sync** — Beat detection, volume-reactive animations, timeline keyframes
- 📦 **Template System** — Data-driven video generation from JSON config
- 🧱 **Layout Primitives** — Stack, Row, Columns, Grid, Center, FadeIn, SlideUp
- 📤 **7 Export Formats** — SRT, VTT, ASS, TXT, word-level SRT & VTT
- ⚡ **Drop-in Components** — `<AnimatedCaptions>` works out of the box
- 🔧 **CLI Tool** — process, batch, export, translate, emphasize, preview, presets, providers, styles, init, demo
- 📐 **Zero Config** — Works with sensible defaults, customizable everything
- 🔷 **TypeScript** — Full type definitions included
- 🐳 **Docker** — `Dockerfile` for headless preview (see repo root)

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

Choose your speech-to-text backend. Supports 6 providers out of the box:

| Provider | Env Variable | Speed | Offline | Best For |
|----------|-------------|-------|---------|----------|
| **Local Whisper** | — | ⭐⭐ | ✅ | Privacy, no API costs |
| **OpenAI** | `OPENAI_API_KEY` | ⭐⭐⭐ | ❌ | Best accuracy |
| **Groq** | `GROQ_API_KEY` | ⭐⭐⭐⭐⭐ | ❌ | Ultra-fast inference |
| **Deepgram** | `DEEPGRAM_API_KEY` | ⭐⭐⭐⭐ | ❌ | Real-time capable |
| **AssemblyAI** | `ASSEMBLYAI_API_KEY` | ⭐⭐⭐ | ❌ | Rich features |
| **ElevenLabs** | `ELEVENLABS_API_KEY` | ⭐⭐⭐⭐ | ❌ | Scribe transcription |

---

## 🎭 Caption Presets

Apply a professional look instantly with one of 23 built-in presets:

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

### 🛍️ Style Marketplace

Install style packages from a JSON file or raw URL, and **create your own in one command**:

```bash
# Scaffold a style package (schema-validated before it's written)
npx captioneer styles create "Sunday Gold" \
  --style glow --color "#D4AF37" --font "Playfair Display, serif" --author "You"

# Check any package against the marketplace schema
npx captioneer styles validate sunday-gold.captioneer-style.json

# Install locally (project or user scope) and see it in the preview picker
npx captioneer styles install sunday-gold.captioneer-style.json --project
npx captioneer preview
```

A style package is a small JSON file that layers colors/fonts on top of the 14 built-in animations — share the file (gist, repo raw URL) and anyone can `styles install` it.

### 🎞️ Ship your own motion (custom animations)

Since 1.1, a package can also define a **keyframe word animation** — colors must be hex, numbers are bounded, so packages stay inert data (no code execution):

```json
{
  "schemaVersion": 1,
  "meta": { "id": "pop-in", "name": "Pop In", "description": "Words pop and settle", "version": "1.0.0" },
  "preset": {
    "name": "Pop In", "description": "Words pop and settle",
    "style": "word-highlight", "fontFamily": "Inter, sans-serif", "fontSize": 60,
    "fontColor": "rgba(255,255,255,0.4)", "highlightColor": "#FE2C55", "position": "bottom",
    "animation": {
      "easing": "ease-out",
      "keyframes": [
        { "at": 0,   "scale": 0.4, "opacity": 0, "yOffset": 24 },
        { "at": 0.6, "scale": 1.2, "opacity": 1, "yOffset": -6, "color": "#FE2C55" },
        { "at": 1,   "scale": 1,   "opacity": 1, "yOffset": 0,  "color": "#FFFFFF" }
      ]
    }
  }
}
```

Use it inline too: `<AnimatedCaptions captions={c} animation={popIn} />` (see `examples/15-custom-animation.tsx`), or in the render CLI with `--animation anim.json`.

---

## 🧠 Smart Captions

### Auto-Emphasis

Pro captioners manually flag the "juicy" words so they pop harder. `markEmphasis` does it automatically from word timing and (optionally) audio energy — **stretched** words (dragged-out delivery), **ALL-CAPS** words (shouting), and **loud** words (spoken far above the volume baseline, when you pass `analyzeAudio()` volume frames) get flagged; your manual flags are kept:

```tsx
import { AnimatedCaptions, markEmphasis } from "remotion-captioneer";

const emphasized = markEmphasis(captions); // pure: returns a new CaptionData

<AnimatedCaptions
  captions={emphasized}
  emphasisStyle="scale"     // "scale" | "color" | "glow"
  emphasisColor="#f59e0b"   // defaults to highlightColor
/>
```

Emphasis rendering is supported by 12 of the 14 styles — everything except the two typewriter styles, which reveal text as continuous strings. Set `word.emphasis = true` yourself for full manual control, and use `detectEmphasis(captions)` to inspect what would be flagged. From the CLI: `npx captioneer emphasize captions.json --in-place`. Loudness detection needs the audio:

```ts
import { markEmphasis, analyzeAudio } from "remotion-captioneer";

const analysis = await analyzeAudio("./clip.mp3");
const emphasized = markEmphasis(captions, {
  audio: { volumeFrames: analysis.volumeFrames, loudFactor: 1.6 },
});
```

### Filler-Word Removal

Cut the "um"s and tighten speech — the podcast-clip edit, done from STT timing alone. `filterFillers` removes hesitation sounds and discourse fillers ("you know", "i mean") and optionally shifts following words earlier to close the gaps:

```ts
import { filterFillers } from "remotion-captioneer";

const { captions: tight, matches } = filterFillers(captions, { closeGaps: true });
```

"like" is deliberately not in the default list (timing can't tell "I, like, guess" from "I like pizza") — opt in with `extraFillers`. From the CLI: `npx captioneer tighten captions.json --in-place`.

### Per-Speaker Colors

With diarized captions, `speakerHighlight` recolors the whole animation to the active speaker's palette color — multi-speaker clips read like pro captions:

```tsx
<AnimatedCaptions
  captions={diarizedCaptions}
  speakerHighlight                    // one color per speaker
  speakerColors={["#3b82f6", "#f59e0b"]}
  showSpeakerLabels                   // optional label chip
/>
```

### Beat-Snapped Timing

Make word pops land on the music. `snapCaptionsToBeats` nudges word starts to the nearest detected beat (within a tolerance, durations and ordering preserved):

```tsx
import { analyzeAudio, snapCaptionsToBeats } from "remotion-captioneer";

const analysis = await analyzeAudio("./voice.mp3"); // or useAudioAnalysis() inside compositions
const snapped = snapCaptionsToBeats(captions, analysis.beats, { toleranceMs: 120 });

<AnimatedCaptions captions={snapped} style="bounce" />
```

---

## 🎥 Render Without React

Not writing a Remotion app? Get a captioned MP4 straight from the CLI — captions JSON plus an audio file is all it takes:

```bash
npx captioneer process clip.mp3                    # 1. transcribe → captions.json
npx captioneer tighten captions.json --in-place    # 2. (optional) cut the "um"s
npx captioneer emphasize captions.json --in-place  # 3. (optional) flag the juicy words
npx captioneer render captions.json \
  --audio clip.mp3 --preset tiktok --out clip-captioned.mp4   # 4. render
```

Caption existing footage instead of a bare audio track with `--video`:

```bash
npx captioneer render captions.json --video footage.mp4 --duration 12 --out captioned.mp4
```

Style options mirror the component props (`--style`, `--preset`, `--color`, `--emphasis`, `--fps`, `--width`, `--height`, `--animation` for custom keyframe motion). The first run needs the renderer packages — the CLI tells you if they're missing: `npm i -D @remotion/bundler@4 @remotion/renderer@4`.

---

## 📺 Broadcast QA

### Pacing analysis

Subtitle standards recommend keeping captions under ~17–20 characters per second. `analyzePacing` measures every segment against that (plus spoken WPM) so you catch unreadable captions before publishing:

```ts
import { analyzePacing } from "remotion-captioneer";

const report = analyzePacing(captions, { fastCps: 17, maxCps: 20 });
report.segments.forEach((s) => console.log(s.status, s.cps.toFixed(1), s.text));
// readabilityScore: 0-100 share of captioned time that reads comfortably
```

From the CLI (exit code 1 with `--strict` — handy as a CI gate):

```bash
npx captioneer pacing captions.json --max-cps 20 --strict
```

### Profanity filtering

Family-friendly captions without re-transcribing. `filterProfanity` masks, removes, or just reports flagged words; matching is conservative (punctuation-stripped, case-insensitive, suffixed/compound forms; "hello" never trips "hell"). Extend with `extraWords`, override with `allowWords`:

```ts
import { filterProfanity } from "remotion-captioneer";

const { captions: clean, matches } = filterProfanity(captions, {
  mode: "mask",           // "mask" | "remove" | "flag"
  keepFirstLetter: true,  // damn → d***
});
```

```bash
npx captioneer clean captions.json --mode mask --keep-first-letter --in-place
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

# Or ElevenLabs
export ELEVENLABS_API_KEY="..."

# Then just run — it picks the best available
npx captioneer process audio.mp4
```

### Explicit Provider

```bash
npx captioneer process audio.mp4 --provider groq
npx captioneer process audio.mp4 --provider openai --model whisper-1
npx captioneer process audio.mp4 --provider deepgram --model nova-2
npx captioneer process audio.mp4 --provider assemblyai
npx captioneer process audio.mp4 --provider elevenlabs --model scribe_v2
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
import { ElevenLabsProvider, GroqProvider, OpenAIProvider } from "remotion-captioneer";

// Groq — ultra-fast
const groq = new GroqProvider("gsk_...");
const captions = await groq.transcribe("audio.mp4", {
  model: "whisper-large-v3-turbo",
  language: "en",
});

// OpenAI
const openai = new OpenAIProvider("sk-...");
const captions = await openai.transcribe("audio.mp4");

// ElevenLabs Scribe
const elevenlabs = new ElevenLabsProvider("...");
const scribeCaptions = await elevenlabs.transcribe("audio.mp4", {
  model: "scribe_v2",
  language: "en",
});

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
npx captioneer process audio.mp4 --provider elevenlabs --model scribe_v2

# With options
npx captioneer process audio.mp4 --provider groq --language en --output captions.json
npx captioneer process audio.mp4 --provider local --model base

# Pass API key directly
npx captioneer process audio.mp4 --provider groq --api-key gsk_...
```

**Options:**
- `-p, --provider <provider>` — STT provider: `local`, `openai`, `groq`, `deepgram`, `assemblyai`, `elevenlabs`
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

# Translate caption JSON (OpenAI; preserves word-level timings)
npx captioneer translate captions.json --target es
npx captioneer translate captions.json --target ar -o captions-ar.json

# Translate while keeping brand terms verbatim
npx captioneer translate captions.json --target es --glossary "Voxily:Voxily,Remotion:Remotion"

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
| `backgroundColor` | `string` | — | Optional caption area background |
| `position` | `"top" \| "center" \| "bottom"` | `"bottom"` | Vertical position |
| `maxWidth` | `number` | — | Max caption width in px |
| `wordsPerLine` | `number` | — | Words per line when wrapping |
| `useSmartWrap` | `boolean` | `false` | Use `smartWrap()` for line breaks |
| `textDirection` | `"ltr" \| "rtl" \| "auto"` | `"ltr"` | Text direction for RTL scripts |

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
| `08-style-gallery.tsx` | Cycling all 14 styles in one composition |
| `09-preset-picker.tsx` | Applying presets to AnimatedCaptions |
| `10-diarization.tsx` | Speaker labels with `--diarize` |
| `11-translate.tsx` | `translateCaptionData` / `captioneer translate` |
| `12-rtl.tsx` | RTL captions with `textDirection="rtl"` |
| `13-hosting.tsx` | YouTube / Vimeo URL metadata via `resolveVideoUrl` |

---

## 🗺️ Roadmap

### ✅ Completed

- [x] 14 caption styles (word-highlight, karaoke, typewriter, bounce, wave, glow, typewriter-erase, pill, flicker, highlighter, blur, rainbow, scale, spotlight)
- [x] 23 caption presets across 10 categories
- [x] Multi-line auto-wrapping with smart breaks (`smartWrap()`)
- [x] Word-level emoji reactions (`EmojiReactions` + `autoGenerateReactions()`)
- [x] Real-time preview server (`npx captioneer preview`)
- [x] Batch processing mode (`npx captioneer batch ./audio/`)
- [x] Multi-provider STT (OpenAI, Groq, Deepgram, AssemblyAI, ElevenLabs, Local Whisper)
- [x] @remotion/captions compatibility layer
- [x] Audio-video sync (beat detection, volume hooks, timeline keyframes)
- [x] Template system for data-driven videos
- [x] Layout primitives (Stack, Row, Columns, Grid, FadeIn, SlideUp, etc.)
- [x] Export formats (SRT, VTT, ASS, TXT, word-level SRT & VTT)
- [x] Project scaffolder (`npx captioneer init`)
- [x] 10 working examples covering all features
- [x] 14 CLI commands (init, process, batch, export, translate, emphasize, tighten, clean, pacing, render, preview, presets, providers, styles, demo)
- [x] GitHub Pages demo with all 14 styles animated
- [x] GitHub Actions CI/CD (build, test, release to npm, CodeQL)
- [x] 0 vulnerabilities in npm audit

### 🔮 Future

- [x] Caption style marketplace (JSON packages, create/validate/install/list, preview preset picker)
- [x] Auto-emphasis detection (`markEmphasis` + `emphasisStyle` rendering; `captioneer emphasize`)
- [x] Per-speaker caption colors (`speakerHighlight`)
- [x] Beat-snapped word timing (`snapCaptionsToBeats`)
- [x] Zero-React MP4 rendering (`captioneer render captions.json --audio clip.mp3 --video footage.mp4`)
- [x] Broadcast QA (pacing/CPS analysis `captioneer pacing`; profanity filter `captioneer clean`)
- [x] Custom keyframe animations as data (`animation` prop, marketplace `preset.animation`, `--animation`)
- [x] Filler-word removal with gap closing (`filterFillers`; `captioneer tighten`)
- [x] Loud-word emphasis detection from audio volume (`markEmphasis` with `audio.volumeFrames`)
- [x] ~~AI-powered auto-emoji~~ (`autoGenerateReactions()` — keyword-based emoji generation from 60+ word→emoji mappings)
- [x] Multi-language caption support with RTL (OpenAI `translateCaptionData` + `captioneer translate`; `AnimatedCaptions` `textDirection="rtl"`)
- [x] ~~Caption editor with visual timeline~~ (Preview server with playback controls, progress bar, beat markers, style selector)
- [x] Video hosting APIs (YouTube/Vimeo resolve — CLI + preview URL import UI)
- [x] ~~Real-time caption rendering in browser~~ (`npx captioneer preview` — live browser-based caption rendering with audio sync)
- [x] Caption translation utilities (`translateCaptionData`, `captioneer translate`)
- [x] Speaker diarization (`--diarize` on AssemblyAI & ElevenLabs; `speaker` on segments)

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
