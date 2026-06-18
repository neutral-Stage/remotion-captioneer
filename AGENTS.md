# Cursor Cloud / agent instructions

## Update script (VM startup)

```bash
npm install
npm run generate:meta
```

## Develop

```bash
npm install
npm run build
npm start
```

Remotion Studio: **Welcome** composition first, then **Gallery/** and **Styles/** folders (`src/studio/Root.tsx`).

## Preview server

```bash
npm run build          # includes build:preview → dist/preview/
npm run preview:web
```

Open http://localhost:3456 — Remotion Player preview, configurator, timeline editor. Upload **audio** (`POST /api/process`) or **caption JSON**.

Preview binds **127.0.0.1** by default (dev only). Use `captioneer preview --host 0.0.0.0` only on trusted networks.

Deep links: `?style=karaoke&preset=tiktok`

## Design tokens

- Canonical: [`docs/theme.css`](docs/theme.css)
- Preview imports: [`src/ui/tokens.css`](src/ui/tokens.css)
- Guide: [`docs/DESIGN.md`](docs/DESIGN.md)

## Tests & checks

```bash
npm test
npm run test:e2e        # Playwright smoke (docs + preview; run build first)
npx tsc --noEmit
npx remotion compositions
npm run validate:docs
npm run generate:meta
npm run lint:incremental
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Groq Whisper STT |
| `OPENAI_API_KEY` | OpenAI Whisper + `captioneer translate` |
| `DEEPGRAM_API_KEY` | Deepgram STT |
| `ASSEMBLYAI_API_KEY` | AssemblyAI STT |
| `ELEVENLABS_API_KEY` | ElevenLabs Scribe STT |
| `YOUTUBE_API_KEY` | YouTube hosting metadata (optional) |
| `VIMEO_ACCESS_TOKEN` | Vimeo hosting metadata (optional) |

Local whisper: `captioneer process audio.mp4 --provider local` (requires whisper.cpp setup).

## Design (docs & preview UI)

Marketing and preview chrome: neutral zinc + blue accent (`#3b82f6`). Caption preset colors are separate. See `docs/DESIGN.md`.

## Docker preview

```bash
docker build -t captioneer .
docker run -p 3456:3456 -e OPENAI_API_KEY=... captioneer
```

## Architecture

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md).

Node-only imports: `remotion-captioneer/node` (STT, export, translate).
