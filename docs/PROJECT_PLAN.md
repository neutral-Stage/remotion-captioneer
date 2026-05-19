# remotion-captioneer — Project plan

## Product surfaces

| Surface | Path | Status |
|---------|------|--------|
| Library API | `src/index.ts`, `src/node.ts` | ✅ |
| Remotion Studio | `src/studio/` + `remotion.config.ts` | ✅ 14 compositions |
| Preview server | `src/preview-server.ts` | ✅ JSON + `POST /api/process` STT |
| GitHub Pages | `docs/index.html` | ✅ API snippets aligned |
| Scaffold | `src/scaffold.ts` | ✅ `registerRoot` + config |
| Examples | `examples/` + `captions.json` | ✅ README |

## Implemented (maintenance backlog → done)

- [x] `transcribeMediaFile()` shared by CLI + preview
- [x] `LocalWhisperProvider` + `createProvider('local')`
- [x] `translateCaptionData` sets `language`; batch progress logging
- [x] `AnimatedCaptions`: `backgroundColor`, `maxWidth`, `wordsPerLine`, `useSmartWrap`
- [x] `remotion-captioneer/node` export subpath
- [x] Vitest + CI test + `remotion compositions` smoke
- [x] `AGENTS.md`, `validate:docs`, examples README
- [x] Studio under `src/studio/`

## Next (optional)

- [ ] Extract preview HTML to `src/preview/` bundle
- [ ] Full ESLint cleanup (lint job is `continue-on-error` until legacy rules fixed)
- [ ] Preview pixel parity with Remotion (or embed rendered clips on Pages)
- [ ] Speaker diarization / hosting APIs (roadmap)

## Commands

| Goal | Command |
|------|---------|
| Studio | `npm start` |
| Web preview | `npm run preview:web` |
| Test | `npm test` |
| Transcribe | `npx captioneer process audio.mp4` |
| Node API | `import { transcribeMediaFile } from "remotion-captioneer/node"` |
