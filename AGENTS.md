# Cursor Cloud / agent instructions

## Update script (VM startup)

```bash
npm install
```

## Develop

```bash
npm install
npm run build
npm start
```

Remotion Studio loads **14** demo compositions from `src/studio/`.

## Preview server

```bash
npm run build
npm run preview:web
```

Open http://localhost:3456 — upload **audio** (uses `POST /api/process` + STT env keys) or **caption JSON**.

## Tests & checks

```bash
npm test
npx tsc --noEmit
npx remotion compositions
npm run validate:docs
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Groq Whisper STT |
| `OPENAI_API_KEY` | OpenAI Whisper + `captioneer translate` |
| `DEEPGRAM_API_KEY` | Deepgram STT |
| `ASSEMBLYAI_API_KEY` | AssemblyAI STT |
| `ELEVENLABS_API_KEY` | ElevenLabs Scribe STT |

Local whisper: `captioneer process audio.mp4 --provider local` (requires whisper.cpp setup).

## Design (docs & preview UI)

Marketing and preview surfaces use a neutral zinc palette with a single blue accent (`#3b82f6`). Shared tokens live in `docs/theme.css`; the preview server inlines matching CSS variables. Avoid purple/gold gradients and emoji-heavy headings in new UI.

## Architecture

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md).

Node-only imports: `remotion-captioneer/node` (STT, export, translate).
