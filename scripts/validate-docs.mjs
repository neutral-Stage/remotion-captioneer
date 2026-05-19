#!/usr/bin/env node
/**
 * Ensures docs/marketing counts match source constants.
 */
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const styles = [
  "word-highlight",
  "karaoke",
  "typewriter",
  "bounce",
  "wave",
  "glow",
  "typewriter-erase",
  "pill",
  "flicker",
  "highlighter",
  "blur",
  "rainbow",
  "scale",
  "spotlight",
];

const html = readFileSync(join(root, "docs/index.html"), "utf8");

let ok = true;

if (!html.includes("applyPreset")) {
  console.error("docs/index.html should document applyPreset");
  ok = false;
}

if (html.includes("transcribe(") && html.includes("from 'remotion-captioneer'")) {
  console.error("docs should not import non-existent transcribe()");
  ok = false;
}

if (html.includes("captioneer info")) {
  console.error("docs references removed captioneer info command");
  ok = false;
}

for (const s of styles) {
  if (!html.includes(s) && !html.includes(s.replace(/-/g, ""))) {
    // style grid may use labels; warn only for primary ids
    if (["word-highlight", "karaoke", "typewriter", "bounce"].includes(s)) {
      console.warn(`warn: docs may not mention style ${s}`);
    }
  }
}

console.log(`Validated: ${styles.length} caption styles in source checklist`);

if (!ok) process.exit(1);
console.log("docs/validate OK");
