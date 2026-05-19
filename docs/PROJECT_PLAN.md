# remotion-captioneer — Project plan

This document describes how the repo is organized, how surfaces connect, and what to do next for a polished, fully integrated product.

## Product surfaces (frontends)

| Surface | Path | Role | Status |
|---------|------|------|--------|
| **Library API** | `src/index.ts` → `dist/` | npm package: components, STT, export, translate | ✅ Primary product |
| **Remotion Studio** | `remotion.config.ts` → `src/remotion-entry.tsx` → `src/Root.tsx` | 14 style demos, shared `demoCaptions` | ✅ Aligned with `CAPTION_STYLES` |
| **Preview server** | `npx captioneer preview` → `src/preview-server.ts` | Quick browser QA (not pixel-perfect vs Remotion) | ⚠️ Audio → demo timings; JSON upload supported |
| **GitHub Pages** | `docs/index.html` | Marketing + canvas approximations of styles | ⚠️ Visual parity with Remotion is approximate |
| **Scaffold** | `npx captioneer init` → `src/scaffold.ts` | New user projects | ✅ Includes `remotion.config.ts` + `registerRoot` |
| **Examples** | `examples/*.tsx` + `examples/captions.json` | Copy-paste snippets | ✅ Sample data present |

**Principle:** Remotion components (`src/components/*`) are the **source of truth** for caption rendering. HTML demos (preview + Pages) are **approximations** for marketing/QA—not a third implementation to keep in sync long term.

## Architecture (how things connect)

```
Audio / JSON
    │
    ├─► CLI process / batch ──► whisper.ts | providers/* ──► CaptionData JSON
    │
    ├─► CLI translate ──► translate.ts (OpenAI) ──► CaptionData JSON
    │
    └─► User Remotion app
            │
            ▼
        AnimatedCaptions (style from CAPTION_STYLES)
            │
            ├─► presets (applyPreset)
            ├─► layouts / templates / emoji / sync (optional)
            └─► render / studio
```

## Completed integration work (this initiative)

- **Single style list:** `src/caption-styles.ts` → `CAPTION_STYLES`, used by `Root.tsx` (14 compositions).
- **Shared demo data:** `src/demo/captions.ts` for Studio + examples.
- **Scaffold:** `remotion-entry.tsx` + `remotion.config.ts` so `npm start` works in new projects.
- **Preview:** all 14 styles in `<select>`, JSON caption upload, accent preset cycling.
- **Docs site:** API snippets match real exports (`toSRT`, `applyPreset`, providers, CLI table).
- **CLI:** `demo` runs Studio from package root; `batch` requires explicit provider like `process`.
- **README:** removed duplicate “Option 2” block.

## Recommended next phases

### Phase 1 — Preview server ↔ library (medium)

- [ ] `POST /api/process` on preview server calling same code path as `captioneer process` (multipart upload).
- [ ] Optional: serve a small bundled client instead of 400-line inline HTML (`src/preview/` + esbuild).

### Phase 2 — Repo layout (low risk, high clarity)

- [ ] Move `cli.ts`, `scaffold.ts`, `preview-server.ts` → `src/cli/`
- [ ] Move `Root.tsx`, `remotion-entry.tsx`, `CaptionShowcase.tsx`, `demo/` → `src/studio/`
- [ ] Keep publishing `dist/` unchanged via `package.json` `main` / `bin` paths

### Phase 3 — Docs & marketing (low)

- [ ] Generate style cards on GitHub Pages from `CAPTION_STYLES` at build time (one script, avoids drift).
- [ ] Fix layout docs: remove “Spacer” primitive claim or add `Spacer` to `layouts/`.
- [ ] Align README preset/style counts with `presets/index.ts`.

### Phase 4 — Quality gates (medium)

- [ ] Vitest for `utils`, `exporters`, `assertCaptionDataShape`, `assertValidTargetLanguageTag`
- [ ] CI: fail on `eslint` (remove `|| true`), add `npx remotion compositions` smoke on Node 20
- [ ] Optional: mock OpenAI for `translate` tests

### Phase 5 — STT & sync hardening (as needed)

- [ ] Document ffmpeg requirement for `analyzeAudio`
- [ ] Unify local STT: remove misleading local stub in `registry.ts` or implement `createProvider('local')`
- [ ] Wire `examples/03-audio-sync.tsx` with real `analyzeAudio` sample

## Definition of “done” for frontends

1. **Remotion Studio** lists all 14 compositions and renders without webpack errors.
2. **`captioneer init` → npm start** works without manual `registerRoot` fixes.
3. **Preview** accepts real `CaptionData` JSON; audio path documented until API wired.
4. **docs/index.html** code samples compile against `src/index.ts` exports.
5. **No contradictory CLI/docs** (command names, preset keys, export APIs).

## Commands cheat sheet

| Goal | Command |
|------|---------|
| Develop library + Studio | `npm install && npm start` |
| List compositions | `npx remotion compositions` |
| Preview in browser | `npx captioneer preview` |
| Transcribe | `npx captioneer process audio.mp4` |
| Translate | `npx captioneer translate caps.json -t es` |
| New project | `npx captioneer init my-video` |
