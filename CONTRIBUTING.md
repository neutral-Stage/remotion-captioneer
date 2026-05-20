# Contributing to remotion-captioneer

Thanks for your interest in contributing! 🎉

## Getting Started

1. Fork the repo and clone it locally
2. Install dependencies: `npm install`
3. Create a branch: `git checkout -b feature/your-feature`

## Development

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Preview in Remotion Studio
npm start
```

## Project Structure

See [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for how surfaces connect.

```
src/
├── components/       # 14 caption style components + AnimatedCaptions
├── caption-styles.ts # CAPTION_STYLES (single list)
├── demo/captions.ts  # Shared demo CaptionData
├── providers/        # Cloud STT providers + registry
├── sync/             # Audio analysis + hooks
├── templates/        # Template builder + renderer
├── layouts/          # Layout primitives
├── presets/          # Style presets
├── cli.ts            # CLI (captioneer)
├── preview-server.ts # Browser preview (captioneer preview)
├── remotion-entry.tsx# Remotion registerRoot entry
├── Root.tsx          # Studio demo compositions (all styles)
└── index.ts          # npm package exports
```

## Adding a New Caption Style

1. Create a new component in `src/components/`
2. It receives `captions: CaptionData` and renders animated words
3. Use `useCurrentFrame()` + `useVideoConfig()` to get timing
4. Export it from `src/components/index.ts`
5. Add it to `CaptionStyle` in `types.ts` and `CAPTION_STYLES` in `caption-styles.ts`
6. Add it to the `styleMap` in `AnimatedCaptions.tsx`
7. Studio picks it up automatically via `Root.tsx` (no manual composition per style)
8. Update preview-server `<select>`, README, and `docs/index.html` if user-facing

## Code Style

- TypeScript strict mode
- Prettier for formatting
- Functional components with hooks
- CSS-in-JS (Remotion style)

## Pull Requests

- Keep PRs focused on one feature/fix
- Include screenshots/videos for visual changes
- Update README if adding new features
- Add types for all new exports

## Reporting Issues

Use the issue templates. Include:
- Remotion version
- Node version
- OS
- Minimal reproduction

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
