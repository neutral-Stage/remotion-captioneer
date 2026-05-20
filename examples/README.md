# Examples

Copy these snippets into a Remotion project that has `remotion-captioneer` installed.

## Setup

```bash
npx captioneer init my-video
cd my-video
npm install
```

Or add to an existing Remotion app:

```bash
npm install remotion-captioneer
```

## Sample captions

All `*.tsx` examples import `./captions.json` in this folder. Use the same shape as `captioneer process` output.

## Files

| File | Topic |
|------|--------|
| `01-basic.tsx` | Minimal `AnimatedCaptions` |
| `02-presets.tsx` | `applyPreset()` |
| `03-audio-sync.tsx` | Beat/volume hooks (requires `ffmpeg` for `analyzeAudio`) |
| `04-template.tsx` | `buildTemplate` + `TemplateComposition` |
| `05-layouts.tsx` | Layout primitives |
| `06-export.ts` | `toSRT` / `toVTT` (Node) |
| `07-emoji.tsx` | Emoji reactions |

## Run in this repo

From repo root after `npm run build`:

```bash
npm start
```
