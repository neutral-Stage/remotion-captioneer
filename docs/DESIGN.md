# Captioneer design system

## Chrome vs caption colors

| Layer | Purpose | Tokens |
|-------|---------|--------|
| **Product chrome** | Docs, preview server, marketing UI | `--color-accent` (`#3b82f6`), zinc surfaces |
| **Caption presets** | Platform looks (TikTok, YouTube, etc.) | Per-preset `highlightColor` in `src/presets/` |
| **Template defaults** | User-brandable video templates | `template-default` purple/gold in `buildTemplate()` |

Do **not** use purple/gold gradients in marketing UI. Preset highlight colors are intentional and separate from product chrome.

## Token file

Canonical tokens: [`theme.css`](theme.css)

Preview imports: [`src/ui/tokens.css`](../src/ui/tokens.css) → `@import` of `docs/theme.css`.

## Usage

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--card-radius);
  color: var(--color-text-primary);
}

.button-primary {
  background: var(--color-accent);
  border-radius: var(--button-radius);
  transition: background var(--duration-normal) var(--ease-default);
}
```

## Accessibility

- Minimum tap target: 44px on touch layouts
- Respect `prefers-reduced-motion` (tokens zero out durations)
- Text on `--color-surface`: use `--color-text-primary` or `--color-text-secondary` for WCAG AA
