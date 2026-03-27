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

```
src/
├── components/       # Caption style components
├── types.ts          # TypeScript type definitions
├── utils.ts          # Timing/frame utilities
├── whisper.ts        # Whisper.cpp integration
├── cli.ts            # CLI tool
├── Root.tsx          # Remotion compositions
└── index.ts          # Public exports
```

## Adding a New Caption Style

1. Create a new component in `src/components/`
2. It receives `captions: CaptionData` and renders animated words
3. Use `useCurrentFrame()` + `useVideoConfig()` to get timing
4. Export it from `src/components/index.ts`
5. Add it to the `styleMap` in `AnimatedCaptions.tsx`
6. Add a demo composition in `Root.tsx`
7. Update the README

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
