# Changelog

## 1.1.0 — 2026-10-04

The production-pipeline release: everything between raw audio and a finished, watchable clip.

### Zero-React rendering

- **`captioneer render captions.json --audio clip.mp3`** outputs a captioned MP4 with no React project — style it with `--style`, `--preset`, `--color`, `--emphasis`, `--fps`, `--width`, `--height`
- **`--video footage.mp4`** burns captions over existing footage; `--duration` overrides output length
- Renderer packages are optional: the CLI prints the install hint when missing
- Duration derives from the captions (plus tail padding); a fail-fast guard rejects empty or overlapping word timings

### Custom keyframe animations (installable motion)

- Style packages can ship their own word motion via `preset.animation`: keyframes of `scale` / `opacity` / `yOffset` / hex `color` over each word's spoken progress, with linear/ease easing (`examples/15-custom-animation`)
- Strict validation keeps packages inert data — bounded numbers, 1–32 monotonic keyframes, `#RRGGBB[AA]` colors only — no code-execution or CSS-injection surface
- Works via the `animation` prop, marketplace packages, and `captioneer render --animation anim.json`

### Smart captions

- **Auto-emphasis**: `markEmphasis()` flags the words worth popping from timing and audio energy alone — *stretched* words (dragged-out delivery), ALL-CAPS words (shouting), and *loud* words (when you pass `analyzeAudio()` volume frames); manual flags preserved, `clearExisting` re-detects
- `emphasisStyle` (`scale` | `color` | `glow`) rendering in 12 of 14 styles (the typewriter pair reveals text as strings by design)
- **Per-speaker colors**: `speakerHighlight` recolors the animation to the active speaker for diarized captions
- **Beat snapping**: `snapCaptionsToBeats()` lands word pops on detected beats with strict monotonic ordering
- **Filler removal**: `filterFillers()` cuts "um"/"uh"/"you know" and closes timing gaps; "like" stays opt-in (`captioneer tighten`)

### Broadcast QA

- **Pacing analysis**: `analyzePacing()` measures characters-per-second against broadcast readability thresholds (17 fast / 20 too-fast) plus spoken WPM and a 0–100 readability score; `captioneer pacing --strict` is a CI-ready gate
- **Profanity filtering**: `filterProfanity()` masks (`d***`), removes, or flags — conservative matching so "hello" never trips "hell" and "class" never trips "ass" (`captioneer clean`)

### Translation glossary

- Brand names survive translation: `captioneer translate --glossary "Voxily:Voxily,Term:Exact"` keeps terms verbatim; terms are validated against a prompt-injection-safe charset before touching the OpenAI prompt
- New export: `formatGlossaryForPrompt`

### Style marketplace

- **`captioneer styles create "My Style" --style glow --color "#00FF88"`** scaffolds a schema-valid, shareable style package; `styles validate` checks any package before sharing
- Marketplace presets surface automatically in the CLI and preview editor

### Web

- Professional landing page at https://neutral-stage.github.io/remotion-captioneer/ with live smart-caption toggles (auto-emphasis, per-speaker colors) on the demo player

## 1.0.0 — 2026-10-03

The first stable release. Everything from the preview-editor roadmap (phases 14–32) has landed, and the package API is now locked in.

### Highlights

- **New preview editor** — `npx remotion-captioneer preview` now serves a full web editor with the Remotion Player, caption JSON upload, style/preset pickers, and export controls.
- **Style marketplace** — install third-party style packages locally (`marketplace:` presets appear automatically in the CLI and preview). Packages are schema-validated with a security-hardened loader.
- **Hosting integrations** — resolve YouTube/Vimeo URLs to metadata cards in the preview sidebar, plus hosting-aware exporters.
- **Speaker diarization** — AssemblyAI and ElevenLabs speaker labels with per-speaker styling (`examples/10-diarization`).
- **Studio gallery** — `remotion studio` now opens with a welcome composition, animated style gallery, preset showcase, and diarization demo.
- **CLI growth** — `analyze` with JSON output, batch mode, translate, export, and marketplace commands.

### Improvements

- Docs site redesign with an interactive configurator and live style toolbar (14 styles, 23 presets).
- 63 unit tests + 11 Playwright e2e smoke tests (docs, preview server, marketplace, hosting).
- `Dockerfile` for headless preview deployments.
- Release automation: tagging `v*` runs the full CI gate and publishes to npm.

### Fixes

- Presets module is now isomorphic — it no longer pulls Node built-ins into Remotion's browser bundle, fixing studio bundling for library consumers.

## 0.9.0 — 2026-05-20

- ElevenLabs STT provider (community contribution, PR #2).
- Caption translation and RTL support, preview STT, CI hardening, professional UI pass (PR #3).

Full history: https://github.com/neutral-Stage/remotion-captioneer/compare/v0.2.0...v1.0.0
