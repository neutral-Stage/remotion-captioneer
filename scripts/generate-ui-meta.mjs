#!/usr/bin/env node
/**
 * Generate ui-meta.json from source constants (styles, presets).
 * Run: node scripts/generate-ui-meta.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

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
  const presetBlock = src.match(/export const presets[^=]*=\s*\{([\s\S]*?)\};\s*\n/);
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

function loadMarketplacePresetsForMeta(root) {
  const dirs = [
    join(root, ".captioneer", "styles"),
    join(homedir(), ".captioneer", "styles"),
  ];
  const presets = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = JSON.parse(readFileSync(join(dir, file), "utf-8"));
        if (raw.schemaVersion !== 1 || !raw.meta?.id || !raw.preset) continue;
        const p = raw.preset;
        presets.push({
          key: `marketplace:${raw.meta.id}`,
          name: `${p.name || raw.meta.name} (installed)`,
          description: p.description || raw.meta.description || "",
          style: p.style,
          highlightColor: p.highlightColor ?? "#3b82f6",
          fontColor: p.fontColor ?? "#fff",
          fontSize: p.fontSize ?? 56,
          position: p.position ?? "bottom",
          category: "Marketplace",
          marketplace: true,
        });
      } catch {
        // skip invalid packages
      }
    }
  }
  return presets;
}

const styles = parseCaptionStyles();
const { presets: builtinPresets, categories } = parsePresets();
const marketplacePresets = loadMarketplacePresetsForMeta(root);
const presets = [...builtinPresets, ...marketplacePresets];

const meta = {
  generatedAt: new Date().toISOString(),
  styleCount: styles.length,
  presetCount: presets.length,
  marketplacePresetCount: marketplacePresets.length,
  styles,
  presets,
  categories: {
    ...categories,
    ...(marketplacePresets.length > 0 ? { Marketplace: marketplacePresets.map((p) => p.key) } : {}),
  },
};

const outDirs = [
  join(root, "src/generated"),
  join(root, "docs"),
];

for (const dir of outDirs) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "ui-meta.json"), JSON.stringify(meta, null, 2) + "\n");
}

// Sync shared UI kit → docs (GitHub Pages serves docs/ statically)
const componentsSrc = join(root, "src/ui/components.css");
const componentsDocs = join(root, "docs/components.css");
copyFileSync(componentsSrc, componentsDocs);

console.log(
  `Generated ui-meta.json: ${styles.length} styles, ${presets.length} presets (${marketplacePresets.length} marketplace)`
);
console.log("Synced src/ui/components.css → docs/components.css");
