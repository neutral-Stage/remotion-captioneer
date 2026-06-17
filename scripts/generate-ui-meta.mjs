#!/usr/bin/env node
/**
 * Generate ui-meta.json from source constants (styles, presets).
 * Run: node scripts/generate-ui-meta.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseCaptionStyles() {
  const src = readFileSync(join(root, "src/caption-styles.ts"), "utf8");
  const block = src.match(/CAPTION_STYLES[^[]*\[([\s\S]*?)\]\s*as\s+const/);
  if (!block) throw new Error("CAPTION_STYLES not found");
  const styles = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

  const labels = {};
  const labelBlock = src.match(/STYLE_LABELS[^=]*=\s*\{([\s\S]*?)\};/);
  if (labelBlock) {
    for (const m of labelBlock[1].matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
      labels[m[1]] = m[2];
    }
    for (const m of labelBlock[1].matchAll(/(\w[\w-]*):\s*"([^"]+)"/g)) {
      if (!labels[m[1]]) labels[m[1]] = m[2];
    }
  }

  return styles.map((id) => ({
    id,
    label: labels[id] ?? id,
    compositionId:
      id
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join("") + "Demo",
  }));
}

function parsePresets() {
  const src = readFileSync(join(root, "src/presets/index.ts"), "utf8");
  const categoriesBlock = src.match(
    /getPresetCategories\(\)[^{]*\{[\s\S]*?return\s*\{([\s\S]*?)\};/
  );
  const categories = {};
  if (categoriesBlock) {
    for (const m of categoriesBlock[1].matchAll(/"([^"]+)":\s*\[([^\]]*)\]/g)) {
      categories[m[1]] = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    }
  }

  const presetEntries = [];
  const presetBlock = src.match(/export const presets[^=]*=\s*\{([\s\S]*?)\};\s*\n\/\*\*/);
  if (!presetBlock) throw new Error("presets block not found");

  const chunks = presetBlock[1].split(/\n\s*"/);
  for (const chunk of chunks) {
    const keyMatch = chunk.match(/^([^"]+)":\s*\{/);
    if (!keyMatch) continue;
    const key = keyMatch[1];
    const name = chunk.match(/name:\s*"([^"]+)"/)?.[1] ?? key;
    const description = chunk.match(/description:\s*"([^"]+)"/)?.[1] ?? "";
    const style = chunk.match(/style:\s*"([^"]+)"/)?.[1] ?? "word-highlight";
    const highlightColor = chunk.match(/highlightColor:\s*"([^"]+)"/)?.[1] ?? "#FFD700";
    const fontColor = chunk.match(/fontColor:\s*"([^"]+)"/)?.[1] ?? "#fff";
    const fontSize = Number(chunk.match(/fontSize:\s*(\d+)/)?.[1] ?? 56);
    const position = chunk.match(/position:\s*"([^"]+)"/)?.[1] ?? "bottom";

    let category = "Other";
    for (const [cat, keys] of Object.entries(categories)) {
      if (keys.includes(key)) {
        category = cat;
        break;
      }
    }

    presetEntries.push({
      key,
      name,
      description,
      style,
      highlightColor,
      fontColor,
      fontSize,
      position,
      category,
    });
  }

  return { presets: presetEntries, categories };
}

const styles = parseCaptionStyles();
const { presets, categories } = parsePresets();

const meta = {
  generatedAt: new Date().toISOString(),
  styleCount: styles.length,
  presetCount: presets.length,
  styles,
  presets,
  categories,
};

const outDirs = [
  join(root, "src/generated"),
  join(root, "docs"),
];

for (const dir of outDirs) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "ui-meta.json"), JSON.stringify(meta, null, 2) + "\n");
}

console.log(`Generated ui-meta.json: ${styles.length} styles, ${presets.length} presets`);
