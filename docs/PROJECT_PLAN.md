# remotion-captioneer — Project plan

## Product surfaces

| Surface | Path | Status |
|---------|------|--------|
| Library API | `src/index.ts`, `src/node.ts` | ✅ |
| Remotion Studio | `src/studio/` + `remotion.config.ts` | ✅ Welcome + Gallery + 14 styles |
| Preview server | `dist/preview/` via `src/preview-server.ts` | ✅ Remotion Player + configurator |
| GitHub Pages | `docs/` (theme.css, app.js, ui-meta.json) | ✅ |
| Scaffold | `src/scaffold.ts` | ✅ |
| Examples | `examples/` + `captions.json` | ✅ through 12 |

## UI system

- Design tokens: `docs/theme.css` (canonical), `src/ui/tokens.css`, `src/ui/components.css` (chrome kit)
- Generated metadata: `npm run generate:meta` → `docs/ui-meta.json`
- Preview build: `npm run build:preview` → `dist/preview/`
- Thumbnails: `npm run generate:thumbnails` (optional, needs remotion still)

## Commands

| Goal | Command |
|------|---------|
| Studio | `npm start` |
| Web preview | `npm run preview:web` |
| Generate meta | `npm run generate:meta` |
| Test | `npm test` |
| Validate docs | `npm run validate:docs` |

## Optional next

- [x] Speaker diarization parsing in STT providers (AssemblyAI, ElevenLabs; `--diarize` CLI + preview)
- [x] Preview timeline editor (word timing drag, waveform, beat markers, JSON export)
- [x] Preview SRT/VTT export, undo/redo, snap-to-beat
- [x] CLI `captioneer analyze` and `export --format json`
- [x] `defaultStyle` in `.captioneerrc` wired to scaffold, preview, and process hints
- [x] Playwright smoke tests (docs + preview) via `npm run test:e2e`
- [x] Incremental ESLint gate (`npm run lint:incremental`) on critical paths
- [x] Full legacy ESLint cleanup (`npm run lint` passes; 11 non-pure-animation warnings remain)
- [x] Video hosting APIs foundation (`src/hosting/`, CLI, preview `/api/hosting/resolve`)
- [x] Style marketplace foundation (`src/marketplace/`, `captioneer styles install`, preview `/api/styles`)
