#!/usr/bin/env node
/**
 * Validates docs, README, and preview align with generated ui-meta.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const metaPath = join(root, "docs/ui-meta.json");
if (!existsSync(metaPath)) {
  console.error("Run: npm run generate:meta");
  process.exit(1);
}

const meta = JSON.parse(readFileSync(metaPath, "utf8"));
const html = readFileSync(join(root, "docs/index.html"), "utf8");
const readme = readFileSync(join(root, "README.md"), "utf8");
const appJs = readFileSync(join(root, "docs/app.js"), "utf8");
const previewJs = readFileSync(join(root, "src/preview/app.js"), "utf8");

let ok = true;
const fail = (msg) => {
  console.error(msg);
  ok = false;
};

if (!html.includes("applyPreset")) fail("docs/index.html should document applyPreset");
if (html.includes("transcribe(") && html.includes("from 'remotion-captioneer'")) {
  fail("docs should not import non-existent transcribe()");
}
if (html.includes("captioneer info")) fail("docs references removed captioneer info command");
if (html.includes("Diarization and sentiment")) {
  fail("docs should not claim AssemblyAI diarization until implemented");
}

if (/\bFour styles\b/i.test(readme)) fail('README still says "Four styles"');
if (readme.includes("✅ 4 ready-to-use styles") || readme.includes("Four styles. Zero")) {
  fail("README still advertises only 4 styles");
}

if (!html.includes("app.js")) fail("docs should load app.js");
if (!appJs.includes("ui-meta.json")) fail("docs app.js should fetch ui-meta.json");

if (!appJs.includes("META.categories") && !appJs.includes("categories")) {
  fail("docs app.js should use preset categories from ui-meta");
}

for (const s of meta.styles) {
  if (!appJs.includes("META.styles") && !appJs.includes(s.id)) {
    fail(`docs app missing style metadata for ${s.id}`);
  }
}

if (!previewJs.includes("api/meta") || !previewJs.includes("style-select")) {
  fail("preview app should load styles from /api/meta");
}

if (meta.styleCount !== 14) fail(`expected 14 styles, got ${meta.styleCount}`);

const categoryCount = Object.keys(meta.categories ?? {}).length;
if (categoryCount < 5) {
  fail(`ui-meta.json categories empty or too few (${categoryCount}); run npm run generate:meta`);
}

const buildPreview = readFileSync(join(root, "scripts/build-preview.mjs"), "utf8");
if (!buildPreview.includes("theme.css")) {
  fail("build-preview.mjs should copy theme.css into dist/preview");
}

const presetCount = meta.presetCount ?? meta.presets?.length;
if (presetCount == null) fail("ui-meta.json missing presetCount");
if (!readme.includes(String(presetCount))) {
  fail(`README should mention ${presetCount} presets (ui-meta presetCount)`);
}
if (/\b16 built-in presets\b/i.test(readme)) {
  fail("README still says 16 built-in presets");
}

const examplesDir = join(root, "examples");
for (const file of ["10-diarization.tsx", "11-translate.tsx", "12-rtl.tsx"]) {
  if (!existsSync(join(examplesDir, file))) {
    fail(`missing example ${file}`);
  }
}

if (!previewJs.includes("timeline-beats") && !previewJs.includes("renderBeatMarkers")) {
  fail("preview should implement beat markers when README claims them");
}
if (!previewJs.includes("buildWaveformFromFile") && !previewJs.includes("decodeAudioData")) {
  fail("preview should build waveform from audio");
}
if (!previewJs.includes("setupWordDrag") && !previewJs.includes("word-handle")) {
  fail("preview should support word timing drag editor");
}

console.log(
  `Validated: ${meta.styleCount} styles, ${meta.presetCount} presets in ui-meta.json`
);

if (!ok) process.exit(1);
console.log("docs/validate OK");
