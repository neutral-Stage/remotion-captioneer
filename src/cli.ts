#!/usr/bin/env node

/**
 * remotion-captioneer CLI
 *
 * Usage:
 *   npx captioneer process <audio-file> [options]
 *   npx captioneer providers
 *   npx captioneer demo
 *   npx captioneer styles
 */

import { Command } from "commander";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve, basename, extname } from "path";
import { fileURLToPath } from "url";

const program = new Command();

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgVersion = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
).version as string;

program
  .name("captioneer")
  .description("Drop-in animated captions for Remotion — supports local Whisper, OpenAI, Groq, Deepgram, AssemblyAI, ElevenLabs")
  .version(pkgVersion);

program
  .command("process")
  .description("Process an audio file and generate caption data")
  .argument("<audio>", "Path to audio or video file")
  .option("-p, --provider <provider>", "STT provider: local, openai, groq, deepgram, assemblyai, elevenlabs")
  .option("-m, --model <model>", "Model name (provider-specific)")
  .option("-k, --api-key <key>", "API key (or use env vars)")
  .option("-l, --language <lang>", "Language code (e.g. en, es, fr)")
  .option("-o, --output <path>", "Output JSON path")
  .option("-v, --verbose", "Verbose output", false)
  .action(async (audioPath: string, opts: any) => {
    const resolved = resolve(audioPath);
    if (!existsSync(resolved)) {
      console.error(`❌ File not found: ${resolved}`);
      process.exit(1);
    }

    const { loadConfig } = await import("./config.js");
    const config = await loadConfig();

    // Determine provider
    const providerName = opts.provider ?? config?.defaultProvider ?? detectDefaultProvider();

    if (!providerName) {
      console.error("❌ No STT provider available.");
      console.error("   Set one of: OPENAI_API_KEY, GROQ_API_KEY, DEEPGRAM_API_KEY, ASSEMBLYAI_API_KEY, ELEVENLABS_API_KEY");
      console.error("   Or use --provider local with whisper.cpp installed");
      process.exit(1);
    }

    console.log(`🎙️ Processing: ${basename(resolved)}`);
    console.log(`📡 Provider: ${providerName}`);

    try {
      const { transcribeMediaFile, defaultCaptionOutputPath } = await import(
        "./transcribe-media.js"
      );

      if (opts.model) {
        console.log(`📦 Model: ${opts.model}`);
      }

      const captions = await transcribeMediaFile(resolved, {
        provider: providerName,
        model: opts.model,
        apiKey: opts.apiKey ?? getApiKeyForProvider(providerName),
        language: opts.language ?? config?.defaultLanguage,
        whisperPath: config?.whisperPath,
        modelPath: config?.modelPath,
      });

      const outputPath = opts.output ?? defaultCaptionOutputPath(resolved);

      writeFileSync(outputPath, JSON.stringify(captions, null, 2));
      console.log(`\n✅ Captions saved to: ${outputPath}`);
      console.log(`📊 ${captions.segments.length} segments, ${captions.durationMs}ms duration`);
      console.log(`\n💡 Use in your Remotion project:`);
      console.log(`   import { AnimatedCaptions } from "remotion-captioneer";`);
      console.log(`   import captions from "./${basename(outputPath)}";`);
    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command("providers")
  .description("List available STT providers and their status")
  .action(async () => {
    const { listProviders } = await import("./providers/registry.js");

    console.log("\n📡 Available STT Providers:\n");

    const providers = listProviders();
    for (const p of providers) {
      const status = p.ready ? "✅ ready" : "⚪ not configured";
      console.log(`  ${p.name.padEnd(14)} ${status}`);
      console.log(`  ${"".padEnd(14)} models: ${p.models.join(", ")}`);
      console.log();
    }

    console.log("Set API keys via environment variables:");
    console.log("  OPENAI_API_KEY     — OpenAI Whisper API");
    console.log("  GROQ_API_KEY       — Groq (ultra-fast inference)");
    console.log("  DEEPGRAM_API_KEY   — Deepgram Nova");
    console.log("  ASSEMBLYAI_API_KEY — AssemblyAI");
    console.log("  ELEVENLABS_API_KEY — ElevenLabs Scribe");
    console.log();
  });

program
  .command("demo")
  .description("Open Remotion studio with demo captions")
  .action(async () => {
    console.log("🎬 Opening Remotion Studio with demo captions...");
    const { execSync } = await import("child_process");
    const packageRoot = join(__dirname, "..");
    execSync("npx remotion studio", { stdio: "inherit", cwd: packageRoot });
  });

program
  .command("styles")
  .description("List available caption styles")
  .action(() => {
    console.log("\n🎨 Available Caption Styles (14):\n");
    console.log("  word-highlight    — Each word lights up as spoken");
    console.log("  karaoke           — Progressive left-to-right fill");
    console.log("  typewriter        — Character-by-character reveal");
    console.log("  bounce            — Active word bounces with spring");
    console.log("  wave              — Words animate in a wave pattern");
    console.log("  glow              — Neon glow on active word");
    console.log("  typewriter-erase  — Type then erase word-by-word");
    console.log("  pill              — Active word in a pill/badge");
    console.log("  flicker           — Flickers in like a neon sign");
    console.log("  highlighter       — Yellow highlighter behind word");
    console.log("  blur              — Words come into focus from blur");
    console.log("  rainbow           — Cycling rainbow colors");
    console.log("  scale             — Words grow from small to full");
    console.log("  spotlight         — Radial spotlight behind word\n");
  });

program
  .command("init")
  .description("Scaffold a new Remotion caption project")
  .argument("[name]", "Project name", "my-captioned-video")
  .action(async (name: string) => {
    const { scaffoldProject } = await import("./scaffold.js");
    scaffoldProject(name);
  });

program
  .command("preview")
  .description("Start a real-time preview server")
  .option("-p, --port <port>", "Port number", "3456")
  .action(async (opts: any) => {
    const { startPreviewServer } = await import("./preview-server.js");
    startPreviewServer(parseInt(opts.port));
  });

program
  .command("presets")
  .description("List available caption presets")
  .action(async () => {
    const { getPresetCategories, presets } = await import("./presets/index.js");
    const categories = getPresetCategories();

    console.log("\n🎨 Available Caption Presets:\n");
    for (const [category, names] of Object.entries(categories)) {
      console.log(`  ${category}:`);
      for (const name of names) {
        const p = presets[name];
        console.log(`    ${name.padEnd(22)} ${p.style.padEnd(18)} ${p.description}`);
      }
      console.log();
    }
  });

program
  .command("export")
  .description("Export captions to different formats")
  .argument("<caption-file>", "Path to caption JSON file")
  .option("-f, --format <format>", "Output format: srt, vtt, ass, txt, srt-words, vtt-words", "srt")
  .option("-o, --output <path>", "Output file path")
  .action(async (captionFile: string, opts: any) => {
    const { readFileSync, writeFileSync: wfs } = await import("fs");
    const { resolve, basename, extname } = await import("path");

    const filePath = resolve(captionFile);
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    const captions = JSON.parse(readFileSync(filePath, "utf-8"));

    const { toSRT, toVTT, toASS, toPlainText, toWordLevelSRT, toWordLevelVTT } = await import("./exporters.js");

    let output: string;
    let ext: string;

    switch (opts.format) {
      case "srt":
        output = toSRT(captions);
        ext = ".srt";
        break;
      case "vtt":
        output = toVTT(captions);
        ext = ".vtt";
        break;
      case "ass":
        output = toASS(captions);
        ext = ".ass";
        break;
      case "txt":
        output = toPlainText(captions);
        ext = ".txt";
        break;
      case "srt-words":
        output = toWordLevelSRT(captions);
        ext = ".srt";
        break;
      case "vtt-words":
        output = toWordLevelVTT(captions);
        ext = ".vtt";
        break;
      default:
        console.error(`❌ Unknown format: ${opts.format}`);
        console.error(`   Available: srt, vtt, ass, txt, srt-words, vtt-words`);
        process.exit(1);
    }

    const outputPath = opts.output ?? resolve(
      process.cwd(),
      `${basename(filePath, extname(filePath))}${ext}`
    );

    wfs(outputPath, output);
    console.log(`✅ Exported to ${opts.format.toUpperCase()}: ${outputPath}`);
    console.log(`📊 ${captions.segments.length} segments`);
  });

program
  .command("translate")
  .description("Translate caption JSON to another language via OpenAI (preserves word timings)")
  .argument("<caption-file>", "Path to caption JSON file")
  .requiredOption("-t, --target <lang>", "Target language code (e.g. es, fr, de, ar, he)")
  .option("-o, --output <path>", "Output JSON path")
  .option("-k, --api-key <key>", "OpenAI API key (defaults to OPENAI_API_KEY)")
  .option("-m, --model <model>", "OpenAI chat model", "gpt-4o-mini")
  .action(async (captionFile: string, opts: any) => {
    const { resolve: res, basename: bn, extname: ext } = await import("path");

    const filePath = res(captionFile);
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    console.log(`🌐 Translating to ${opts.target}...`);

    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(readFileSync(filePath, "utf-8"));
      } catch (e: unknown) {
        const hint =
          e instanceof SyntaxError
            ? `Invalid JSON (${e.message})`
            : e instanceof Error
              ? e.message
              : String(e);
        throw new Error(hint);
      }

      const { translateCaptionData, assertCaptionDataShape } = await import(
        "./translate.js"
      );
      const captions = assertCaptionDataShape(parsed);

      const translated = await translateCaptionData(captions, {
        targetLanguage: opts.target,
        apiKey: opts.apiKey,
        model: opts.model,
        onProgress: (msg) => console.log(`   ${msg}`),
      });

      const outputPath =
        opts.output ??
        res(
          process.cwd(),
          `${bn(filePath, ext(filePath))}-${opts.target}.json`
        );

      writeFileSync(outputPath, JSON.stringify(translated, null, 2));
      console.log(`\n✅ Translated captions saved to: ${outputPath}`);
      console.log(`📊 ${translated.segments.length} segments`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);
      console.error(`❌ Error: ${message}`);
      process.exit(1);
    }
  });

program
  .command("batch")
  .description("Process multiple audio files at once")
  .argument("<directory>", "Directory containing audio files")
  .option("-p, --provider <provider>", "STT provider")
  .option("-m, --model <model>", "Model name")
  .option("-k, --api-key <key>", "API key")
  .option("-l, --language <lang>", "Language code")
  .option("-o, --output-dir <dir>", "Output directory")
  .option("-e, --extensions <exts>", "File extensions (comma-separated)", "mp3,wav,m4a,mp4,ogg,flac")
  .action(async (directory: string, opts: any) => {
    const { readdirSync, statSync } = await import("fs");
    const { join, resolve, basename, extname } = await import("path");

    const dirPath = resolve(directory);
    if (!existsSync(dirPath)) {
      console.error(`❌ Directory not found: ${dirPath}`);
      process.exit(1);
    }

    const extensions = opts.extensions.split(",").map((e: string) => `.${e.trim().toLowerCase()}`);

    const files = readdirSync(dirPath)
      .filter((f) => extensions.includes(extname(f).toLowerCase()))
      .map((f) => join(dirPath, f));

    if (files.length === 0) {
      console.error(`❌ No audio files found in ${dirPath}`);
      console.error(`   Looking for: ${extensions.join(", ")}`);
      process.exit(1);
    }

    console.log(`📁 Found ${files.length} audio file(s) in ${dirPath}\n`);

    const { loadConfig } = await import("./config.js");
    const config = await loadConfig();

    const providerName = opts.provider ?? config?.defaultProvider ?? detectDefaultProvider();
    const outputDir = resolve(opts.outputDir ?? dirPath);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileName = basename(file);
      console.log(`\n[${i + 1}/${files.length}] Processing: ${fileName}`);

      try {
        if (!providerName) {
          console.error(`  ❌ No STT provider configured. Set API keys or use --provider local`);
          failed++;
          continue;
        }

        const { transcribeMediaFile } = await import("./transcribe-media.js");
        const captions = await transcribeMediaFile(file, {
          provider: providerName,
          model: opts.model,
          apiKey: opts.apiKey ?? getApiKeyForProvider(providerName),
          language: opts.language ?? config?.defaultLanguage,
          whisperPath: config?.whisperPath,
          modelPath: config?.modelPath,
        });

        const outputPath = join(
          outputDir,
          `${basename(file, extname(file))}-captions.json`
        );

        const { writeFileSync: wfs } = await import("fs");
        wfs(outputPath, JSON.stringify(captions, null, 2));
        console.log(`  ✅ ${captions.segments.length} segments → ${basename(outputPath)}`);
        success++;
      } catch (error: any) {
        console.error(`  ❌ Failed: ${error.message}`);
        failed++;
      }
    }

    console.log(`\n${"─".repeat(40)}`);
    console.log(`📊 Done: ${success} succeeded, ${failed} failed out of ${files.length} files`);
  });

// Helpers
function detectDefaultProvider(): string | null {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.DEEPGRAM_API_KEY) return "deepgram";
  if (process.env.ASSEMBLYAI_API_KEY) return "assemblyai";
  if (process.env.ELEVENLABS_API_KEY) return "elevenlabs";
  return null;
}

function getApiKeyForProvider(provider: string): string | undefined {
  const envMap: Record<string, string> = {
    openai: "OPENAI_API_KEY",
    groq: "GROQ_API_KEY",
    deepgram: "DEEPGRAM_API_KEY",
    assemblyai: "ASSEMBLYAI_API_KEY",
    elevenlabs: "ELEVENLABS_API_KEY",
  };
  return process.env[envMap[provider]];
}

program.parse();
