#!/usr/bin/env node
/**
 * Build preview static assets + Remotion Player bundle.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as esbuild from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "dist/preview");
const srcDir = join(root, "src/preview");

mkdirSync(outDir, { recursive: true });

// Copy static assets + design tokens
copyFileSync(join(srcDir, "index.html"), join(outDir, "index.html"));
copyFileSync(join(srcDir, "app.js"), join(outDir, "app.js"));
copyFileSync(join(srcDir, "styles.css"), join(outDir, "styles.css"));
copyFileSync(join(root, "docs/theme.css"), join(outDir, "theme.css"));

// Copy theme + ui-meta
copyFileSync(join(root, "docs/ui-meta.json"), join(outDir, "ui-meta.json"));

// Bundle Remotion Player
await esbuild.build({
  entryPoints: [join(srcDir, "player-entry.tsx")],
  bundle: true,
  outfile: join(outDir, "player.js"),
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  loader: { ".tsx": "tsx", ".ts": "ts" },
  jsx: "automatic",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  external: [],
  logLevel: "info",
});

console.log("Built preview bundle → dist/preview/");
