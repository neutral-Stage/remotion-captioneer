#!/usr/bin/env node
/**
 * Generate Remotion still thumbnails for docs (requires remotion CLI).
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs/thumbnails");

mkdirSync(outDir, { recursive: true });

if (!existsSync(join(root, "docs/ui-meta.json"))) {
  execSync("node scripts/generate-ui-meta.mjs", { cwd: root, stdio: "inherit" });
}

const meta = JSON.parse(readFileSync(join(root, "docs/ui-meta.json"), "utf8"));
const manifest = [];

for (const style of meta.styles) {
  const id = style.compositionId;
  const out = join(outDir, `${style.id}.png`);
  try {
    execSync(
      `npx remotion still src/studio/remotion-entry.tsx ${id} ${out} --frame=60`,
      { cwd: root, stdio: "pipe" }
    );
    manifest.push({ type: "style", id: style.id, path: `thumbnails/${style.id}.png` });
    console.log(`✓ ${style.id}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`Skip ${id}:`, msg.slice(0, 120));
  }
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Thumbnail manifest: ${manifest.length} images`);
