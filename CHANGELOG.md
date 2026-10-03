# Changelog

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
