# Changelog

## 1.2.0 — 2026-10-08

The autopilot release: one command from raw audio to a finished, captioned MP4 — plus the AI-agent surface and long-overdue whisper.cpp compatibility fixes.

### 🚀 One-command autopilot

```bash
npx captioneer autopilot clip.mp3 --preset tiktok
```

Transcribes → removes filler words → auto-emphasizes → renders the captioned MP4. Local whisper auto-installs on first use (clone + build + tiny model); video input burns captions over its own footage; the processed captions JSON is saved next to the output for reuse. Flags pass through: `--provider`, `--style`/`--preset`/`--color`/`--emphasis`, `--no-tighten`, `--no-emphasize`, `--fps`/`--width`/`--height`.

Verified end-to-end on real speech from a cold machine: whisper built, 21 words transcribed with true per-word timing, 2 fillers removed, 1 word emphasized, 225-frame MP4 rendered.

### 🩺 `captioneer doctor`

Environment health report — Node/runtime, STT keys (with local-whisper fallback noted), renderer packages, whisper config. Warns on optional pieces instead of failing.

### 🤖 AI-agent friendly

- **`llms.txt`** — full API / CLI / data-format cheatsheet in the emerging llms.txt format: install, one-command pipeline, React snippet, every core function, CaptionData + style package + animation schemas, and agent tips (transform order, quality gates). Linked from the landing footer and README.
- All caption transforms are pure JSON-in/JSON-out with `--in-place` / stdout modes — agent-scriptable by design.

### 🐛 whisper.cpp compatibility (local STT was broken on current builds)

- Binary detection probes `whisper-cli` (upstream renamed from `main`) with legacy fallback; half-installed clones rebuild instead of re-cloning
- CLI invocation fixed for current builds (`-oj` is a flag; no `"false"` value args — they were parsed as input files)
- Word-level timing restored: run with `--max-len 1` and parse per-word millisecond `offsets`, re-chunked into readable caption segments; legacy timed-token JSON still parses; special tokens (`[_BEG_]`, `[_TT_*]`) and zero-duration words filtered
- **Proper word merging**: whisper emits *tokens*, not words — subword continuations ("caption" + "ier"), contraction tails ("let" + "'s"), and standalone punctuation now fold into the preceding word via each token's raw leading-space signal, so captions never show lone commas or split words
- **Emphasis no longer squashes word spacing**: the `scale` emphasis mode boosts font size instead of transform scale — transform-only scaling painted glyphs outside their layout box and ate the inter-word gaps (pixel-verified: word gaps restored to 16–20px with multiple emphasized words on a line)
- **Autopilot defaults to the `base` model** (meaningfully better than `tiny` on real speech) and supports **`--prompt "Your Brand Name"`** to bias transcription toward brand names and domain vocabulary

### 🎬 Landing page

The live demo now renders real caption lines (past words lit, active word animated per style, future words dim) across all 14 styles — replacing the one-word-at-a-time flash that misrepresented the components. Autopilot leads the pipeline section; the CLI table covers all 16 commands; roadmap reorganized into grouped Completed and an honest Future.

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
