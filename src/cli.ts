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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, resolve, basename } from "path";
import { fileURLToPath } from "url";

/** Commander action options (subset used across subcommands). */
type ProcessOpts = {
  provider?: string;
  model?: string;
  apiKey?: string;
  language?: string;
  output?: string;
  diarize?: boolean;
  speakers?: number;
  verbose?: boolean;
};

type ExportOpts = { format?: string; output?: string };
type TranslateOpts = { target: string; output?: string; apiKey?: string; model?: string; glossary?: string };
type BatchOpts = ProcessOpts & {
  outputDir?: string;
  extensions?: string;
};
type PreviewOpts = { port?: string; host?: string };
type AnalyzeOpts = { output?: string };

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
  .option("--diarize", "Enable speaker diarization (AssemblyAI, ElevenLabs)", false)
  .option("--speakers <n>", "Expected number of speakers (with --diarize)", parseInt)
  .option("-v, --verbose", "Verbose output", false)
  .action(async (audioPath: string, opts: ProcessOpts) => {
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
        diarize: opts.diarize,
        numSpeakers: opts.speakers,
      });

      const outputPath = opts.output ?? defaultCaptionOutputPath(resolved);

      writeFileSync(outputPath, JSON.stringify(captions, null, 2));
      console.log(`\n✅ Captions saved to: ${outputPath}`);
      console.log(`📊 ${captions.segments.length} segments, ${captions.durationMs}ms duration`);
      if (opts.diarize) {
        const { listSpeakers } = await import("./providers/diarization.js");
        const speakers = listSpeakers(captions.segments);
        if (speakers.length > 0) {
          console.log(`🗣️  Speakers: ${speakers.join(", ")}`);
        }
      }
      console.log(`\n💡 Use in your Remotion project:`);
      const { resolveDefaultStyle } = await import("./config.js");
      const style = resolveDefaultStyle(config);
      console.log(`   import { AnimatedCaptions } from "remotion-captioneer";`);
      console.log(`   import captions from "./${basename(outputPath)}";`);
      console.log(`   <AnimatedCaptions captions={captions} style="${style}" />`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error: ${message}`);
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
  .description("Caption styles and marketplace packages")
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
    console.log("  spotlight         — Radial spotlight behind word");
    console.log("\nCreate your own: captioneer styles create \"My Style\" --style glow --color \"#00FF88\"");
    console.log("Validate a package: captioneer styles validate <file>");
    console.log("Install marketplace presets: captioneer styles install <path|url>\n");
    console.log("List installed packages: captioneer styles list\n");
  })
  .addCommand(
    new Command("list")
      .description("List installed marketplace style packages")
      .action(async () => {
        const { getMarketplacePresets } = await import("./marketplace/registry.js");
        const installed = getMarketplacePresets();
        const keys = Object.keys(installed);
        console.log("\n📦 Installed marketplace presets:\n");
        if (keys.length === 0) {
          console.log("  (none — run: captioneer styles install <path|url>)\n");
          return;
        }
        for (const key of keys) {
          const p = installed[key]!;
          console.log(`  ${key}`);
          console.log(`    ${p.name} — ${p.style} · ${p.highlightColor}`);
        }
        console.log("");
      })
  )
  .addCommand(
    new Command("install")
      .description("Install a style package from a JSON file or URL")
      .argument("<source>", "Path or URL to style package JSON")
      .option("--project", "Install into .captioneer/styles in the current project")
      .action(async (source: string, opts: { project?: boolean }) => {
        const {
          loadStylePackageFromFile,
          loadStylePackageFromUrl,
          installStylePackage,
          invalidateMarketplaceCache,
        } = await import("./marketplace/index.js");

        try {
          const pkg = source.startsWith("http://") || source.startsWith("https://")
            ? await loadStylePackageFromUrl(source)
            : loadStylePackageFromFile(resolve(source));

          const dest = installStylePackage(pkg, {
            target: opts.project ? "project" : "user",
          });
          invalidateMarketplaceCache();
          console.log(`✅ Installed style "${pkg.meta.name}" → ${dest}`);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`❌ ${message}`);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command("create")
      .description("Scaffold a new marketplace style package")
      .argument("<name>", "Display name, e.g. \"Sunday Gold\"")
      .option("--style <style>", "Built-in animation (word-highlight, karaoke, glow, ...)")
      .option("--color <color>", "Highlight color (default #FE2C55)")
      .option("--font-color <color>", "Idle text color (default rgba(255,255,255,0.4))")
      .option("--font <family>", "CSS font-family (default \"Inter, sans-serif\")")
      .option("--size <pixels>", "Font size in px (default 56)")
      .option("--position <position>", "top | center | bottom (default bottom)")
      .option("--author <name>", "Your name for the package metadata")
      .option("--description <text>", "Short package description")
      .option("--out <dir>", "Output directory (default current directory)")
      .action(async (name: string, opts: Record<string, string | undefined>) => {
        const { createStylePackageDraft } = await import("./marketplace/scaffold.js");
        try {
          const { pkg, fileName } = createStylePackageDraft({
            name,
            style: opts.style,
            highlightColor: opts.color,
            fontColor: opts.fontColor,
            fontFamily: opts.font,
            fontSize: opts.size !== undefined ? Number(opts.size) : undefined,
            position: opts.position,
            author: opts.author,
            description: opts.description,
          });

          const outDir = opts.out ? resolve(opts.out) : process.cwd();
          const target = join(outDir, fileName);
          if (existsSync(target)) {
            console.error(`❌ ${fileName} already exists in ${outDir} — move it or pass --out`);
            process.exit(1);
          }
          mkdirSync(outDir, { recursive: true });
          writeFileSync(target, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");

          console.log(`✨ Created ${target}\n`);
          console.log(`   id:     ${pkg.meta.id}`);
          console.log(`   style:  ${pkg.preset.style}`);
          console.log(`   color:  ${pkg.preset.highlightColor}\n`);
          console.log("Next steps:");
          console.log(`  1. captioneer styles validate ${fileName}`);
          console.log(`  2. captioneer styles install ${fileName} --project`);
          console.log("  3. captioneer preview   # your style appears under marketplace presets");
          console.log("  4. share the JSON file — anyone can install it from a raw URL");
          console.log("");
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`❌ ${message}`);
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command("validate")
      .description("Validate a style package JSON against the marketplace schema")
      .argument("<file>", "Path to style package JSON")
      .action(async (file: string) => {
        const { loadStylePackageFromFile } = await import("./marketplace/index.js");
        try {
          const pkg = loadStylePackageFromFile(resolve(file));
          console.log("✅ Valid style package\n");
          console.log(`   id:      ${pkg.meta.id}`);
          console.log(`   name:    ${pkg.meta.name}`);
          console.log(`   version: ${pkg.meta.version}`);
          console.log(`   style:   ${pkg.preset.style}`);
          console.log(`   install: captioneer styles install ${resolve(file)}\n`);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`❌ ${message}`);
          process.exit(1);
        }
      })
  );

program
  .command("init")
  .description("Scaffold a new Remotion caption project")
  .argument("[name]", "Project name", "my-captioned-video")
  .action(async (name: string) => {
    try {
      const { loadConfig, resolveDefaultStyle } = await import("./config.js");
      const config = await loadConfig();
      const { scaffoldProject } = await import("./scaffold.js");
      scaffoldProject(name, ".", resolveDefaultStyle(config));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${message}`);
      process.exit(1);
    }
  });

program
  .command("analyze")
  .description("Analyze audio for beats, BPM, and volume envelope")
  .argument("<audio>", "Path to audio or video file")
  .option("-o, --output <path>", "Output JSON path (default: <audio>-analysis.json)")
  .action(async (audioPath: string, opts: AnalyzeOpts) => {
    const { resolve, basename, extname } = await import("path");
    const resolved = resolve(audioPath);
    if (!existsSync(resolved)) {
      console.error(`❌ File not found: ${resolved}`);
      process.exit(1);
    }

    console.log(`🎵 Analyzing: ${basename(resolved)}`);

    try {
      const { analyzeAudio } = await import("./sync/audio-analysis.js");
      const analysis = await analyzeAudio(resolved);
      const outputPath =
        opts.output ??
        resolve(process.cwd(), `${basename(resolved, extname(resolved))}-analysis.json`);

      writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
      console.log(`\n✅ Analysis saved to: ${outputPath}`);
      console.log(`📊 BPM: ${analysis.bpm ?? "—"}, beats: ${analysis.beats?.length ?? 0}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error: ${message}`);
      process.exit(1);
    }
  });

program
  .command("preview")
  .description("Start a real-time preview server (dev only, localhost by default)")
  .option("-p, --port <port>", "Port number", "3456")
  .option("--host <host>", "Bind host (default 127.0.0.1)", "127.0.0.1")
  .action(async (opts: PreviewOpts) => {
    const { startPreviewServer } = await import("./preview-server.js");
    const port = Number.parseInt(opts.port ?? "3456", 10);
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      console.error("❌ Invalid port number");
      process.exit(1);
    }
    startPreviewServer({ port, host: opts.host ?? "127.0.0.1" });
  });

program
  .command("presets")
  .description("List available caption presets")
  .action(async () => {
    const { getPresetCategories, presets } = await import("./presets/index.js");
    const { getMarketplacePresets } = await import("./marketplace/registry.js");
    const categories = getPresetCategories();
    const marketplace = getMarketplacePresets();

    console.log("\n🎨 Available Caption Presets:\n");
    for (const [category, names] of Object.entries(categories)) {
      console.log(`  ${category}:`);
      for (const name of names) {
        const p = presets[name];
        console.log(`    ${name.padEnd(22)} ${p.style.padEnd(18)} ${p.description}`);
      }
      console.log();
    }

    if (Object.keys(marketplace).length > 0) {
      console.log("  Marketplace:");
      for (const [key, p] of Object.entries(marketplace)) {
        console.log(`    ${key.padEnd(22)} ${p.style.padEnd(18)} ${p.description}`);
      }
      console.log();
    }
  });

program
  .command("export")
  .description("Export captions to different formats")
  .argument("<caption-file>", "Path to caption JSON file")
  .option("-f, --format <format>", "Output format: srt, vtt, ass, txt, json, srt-words, vtt-words", "srt")
  .option("-o, --output <path>", "Output file path")
  .action(async (captionFile: string, opts: ExportOpts) => {
    const { readFileSync, writeFileSync: wfs } = await import("fs");
    const { resolve, basename, extname } = await import("path");

    const filePath = resolve(captionFile);
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    let captions: import("./types.js").CaptionData;
    try {
      const raw = JSON.parse(readFileSync(filePath, "utf-8")) as unknown;
      const { assertCaptionDataShape } = await import("./translate.js");
      captions = assertCaptionDataShape(raw);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Invalid caption JSON";
      console.error(`❌ ${message}`);
      process.exit(1);
    }

    const { toSRT, toVTT, toASS, toPlainText, toJSON, toWordLevelSRT, toWordLevelVTT } = await import("./exporters.js");

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
      case "json":
        output = toJSON(captions);
        ext = ".json";
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
        console.error(`   Available: srt, vtt, ass, txt, json, srt-words, vtt-words`);
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
  .option("--glossary <pairs>", 'Keep terms verbatim: "Voxily:Voxily,New Term:Neuer Begriff"')
  .action(async (captionFile: string, opts: TranslateOpts) => {
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

      let glossary: Record<string, string> | undefined;
      if (opts.glossary) {
        glossary = {};
        for (const pair of opts.glossary.split(",")) {
          const separator = pair.indexOf(":");
          if (separator <= 0 || separator === pair.length - 1) {
            throw new Error(
              `Invalid glossary pair "${pair.trim()}" — use "from:to" separated by commas`
            );
          }
          glossary[pair.slice(0, separator).trim()] = pair
            .slice(separator + 1)
            .trim();
        }
      }

      const translated = await translateCaptionData(captions, {
        targetLanguage: opts.target,
        apiKey: opts.apiKey,
        model: opts.model,
        glossary,
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
  .option("--diarize", "Enable speaker diarization (AssemblyAI, ElevenLabs)", false)
  .option("--speakers <n>", "Expected number of speakers", parseInt)
  .action(async (directory: string, opts: BatchOpts) => {
    const { readdirSync } = await import("fs");
    const { join, resolve, basename, extname } = await import("path");

    const dirPath = resolve(directory);
    if (!existsSync(dirPath)) {
      console.error(`❌ Directory not found: ${dirPath}`);
      process.exit(1);
    }

    const extensions = (opts.extensions ?? "mp3,wav,m4a,mp4,ogg,flac")
      .split(",")
      .map((e: string) => `.${e.trim().toLowerCase()}`);

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
          diarize: opts.diarize,
          numSpeakers: opts.speakers,
        });

        const outputPath = join(
          outputDir,
          `${basename(file, extname(file))}-captions.json`
        );

        const { writeFileSync: wfs } = await import("fs");
        wfs(outputPath, JSON.stringify(captions, null, 2));
        console.log(`  ✅ ${captions.segments.length} segments → ${basename(outputPath)}`);
        success++;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`  ❌ Failed: ${message}`);
        failed++;
      }
    }

    console.log(`\n${"─".repeat(40)}`);
    console.log(`📊 Done: ${success} succeeded, ${failed} failed out of ${files.length} files`);
  });

const hosting = program.command("hosting").description("Resolve video hosting URLs");

hosting
  .command("providers")
  .description("List supported video hosting providers")
  .action(async () => {
    const { listHostingProviders } = await import("./hosting/index.js");
    console.log("\n📺 Video hosting providers:\n");
    for (const name of listHostingProviders()) {
      console.log(`  • ${name}`);
    }
    console.log("\nSet YOUTUBE_API_KEY or VIMEO_ACCESS_TOKEN for richer metadata.\n");
  });

hosting
  .command("info")
  .description("Resolve a YouTube or Vimeo URL to metadata")
  .argument("<url>", "Public video URL")
  .action(async (url: string) => {
    const { resolveVideoUrl } = await import("./hosting/index.js");
    try {
      const info = await resolveVideoUrl(url);
      console.log(JSON.stringify(info, null, 2));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${message}`);
      process.exit(1);
    }
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

program
  .command("emphasize")
  .description("Auto-detect emphasis words (stretched / ALL-CAPS) in a captions JSON")
  .argument("<caption-file>", "Path to caption JSON file")
  .option("--in-place", "Rewrite the file in place (default: print to stdout)")
  .option("--stretch-factor <n>", "Duration multiplier over median that counts as stretched", "1.8")
  .option("--max-per-segment <n>", "Max auto-detected emphasis words per segment", "2")
  .option("--no-caps", "Skip ALL-CAPS detection")
  .action(async (captionFile: string, opts: Record<string, string | boolean | undefined>) => {
    const filePath = resolve(captionFile);
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    try {
      const parsed: unknown = JSON.parse(readFileSync(filePath, "utf-8"));
      const { assertCaptionDataShape } = await import("./translate.js");
      const captions = assertCaptionDataShape(parsed);
      const { markEmphasis, detectEmphasis } = await import("./emphasis.js");

      const options = {
        stretchFactor: Number(opts.stretchFactor ?? 1.8),
        maxPerSegment: Number(opts.maxPerSegment ?? 2),
        detectCaps: opts.caps !== false,
      };
      const detections = detectEmphasis(captions, options);
      const emphasized = markEmphasis(captions, options);

      const out = `${JSON.stringify(emphasized, null, 2)}\n`;
      if (opts.inPlace) {
        writeFileSync(filePath, out, "utf8");
        console.log(`✅ Wrote ${filePath} with ${detections.length} emphasized word(s)\n`);
      } else {
        process.stdout.write(out);
        console.error(`(${detections.length} emphasized word(s))`);
      }

      const counts = detections.reduce<Record<string, number>>((acc, d) => {
        acc[d.reason] = (acc[d.reason] ?? 0) + 1;
        return acc;
      }, {});
      console.error(
        `   stretched: ${counts.stretched ?? 0} · caps: ${counts.caps ?? 0} · manual: ${counts.manual ?? 0}`
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${message}`);
      process.exit(1);
    }
  });

program
  .command("pacing")
  .description("Analyze caption reading speed (broadcast CPS / WPM QA report)")
  .argument("<caption-file>", "Path to caption JSON file")
  .option("--max-cps <n>", "CPS at or above which segments are flagged", "20")
  .option("--fast-cps <n>", "CPS at or above which segments are marked fast", "17")
  .option("--strict", "Exit non-zero when any segment is flagged")
  .action(async (captionFile: string, opts: Record<string, string | boolean | undefined>) => {
    const filePath = resolve(captionFile);
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    try {
      const parsed: unknown = JSON.parse(readFileSync(filePath, "utf-8"));
      const { assertCaptionDataShape } = await import("./translate.js");
      const captions = assertCaptionDataShape(parsed);
      const { analyzePacing } = await import("./pacing.js");

      const report = analyzePacing(captions, {
        maxCps: Number(opts.maxCps ?? 20),
        fastCps: Number(opts.fastCps ?? 17),
      });

      console.log(`\n📊 Pacing report (${filePath})\n`);
      console.log(
        `   average ${report.averageCps.toFixed(1)} CPS · ${Math.round(report.averageWpm)} WPM · readability ${report.readabilityScore}%\n`
      );
      for (const s of report.segments) {
        const flag =
          s.status === "too-fast" ? "🚨 too-fast" : s.status === "fast" ? "⚠️  fast" : "  ok";
        console.log(
          `   [${String(s.segmentIndex).padStart(2)}] ${s.cps.toFixed(1).padStart(5)} CPS ${flag}  ${s.text.slice(0, 60)}`
        );
      }
      console.log("");

      if (report.flaggedCount > 0) {
        console.log(
          `   ${report.flaggedCount} segment(s) exceed ${opts.maxCps} CPS — split them or trim words\n`
        );
        if (opts.strict) process.exit(1);
      } else {
        console.log("   ✅ all segments within reading-speed limits\n");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${message}`);
      process.exit(1);
    }
  });

program
  .command("clean")
  .description("Filter profanity from a captions JSON (mask, remove, or flag)")
  .argument("<caption-file>", "Path to caption JSON file")
  .option("--mode <mode>", "mask | remove | flag", "mask")
  .option("--keep-first-letter", "Mask as d*** instead of ****")
  .option("--extra <words>", "Comma-separated extra words to flag")
  .option("--allow <words>", "Comma-separated words to never flag")
  .option("--in-place", "Rewrite the file in place (default: print to stdout)")
  .action(async (captionFile: string, opts: Record<string, string | boolean | undefined>) => {
    const filePath = resolve(captionFile);
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    try {
      const parsed: unknown = JSON.parse(readFileSync(filePath, "utf-8"));
      const { assertCaptionDataShape } = await import("./translate.js");
      const captions = assertCaptionDataShape(parsed);
      const { filterProfanity } = await import("./profanity.js");

      const list = (v: string | boolean | undefined): string[] | undefined =>
        typeof v === "string" && v.trim().length > 0
          ? v.split(",").map((w) => w.trim()).filter(Boolean)
          : undefined;

      const mode =
        opts.mode === "mask" || opts.mode === "remove" || opts.mode === "flag"
          ? opts.mode
          : undefined;
      if (!mode) {
        throw new Error(`Invalid mode "${opts.mode}" — use mask, remove, or flag`);
      }

      const { captions: cleaned, matches } = filterProfanity(captions, {
        mode,
        keepFirstLetter: opts.keepFirstLetter === true,
        extraWords: list(opts.extra),
        allowWords: list(opts.allow),
      });

      if (opts.inPlace) {
        writeFileSync(filePath, `${JSON.stringify(cleaned, null, 2)}\n`, "utf8");
        console.log(`✅ Wrote ${filePath} (${matches.length} word(s) ${mode}ed)\n`);
      } else {
        process.stdout.write(`${JSON.stringify(cleaned, null, 2)}\n`);
        console.error(`(${matches.length} word(s) ${mode}ed)`);
      }
      for (const m of matches) {
        console.error(`   [seg ${m.segmentIndex}] ${m.word} → ${m.maskedTo}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${message}`);
      process.exit(1);
    }
  });

program
  .command("render")
  .description("Render a captioned MP4 from captions JSON — no React project needed")
  .argument("<caption-file>", "Path to caption JSON file")
  .option("--audio <path>", "Audio file to render with the captions")
  .option("--video <path>", "Background video to caption (instead of --audio)")
  .option("--animation <path>", "Custom keyframe animation JSON (overrides --style)")
  .option("--duration <seconds>", "Output duration override (video longer than captions)")
  .option("--style <style>", "Built-in caption style (word-highlight, karaoke, glow, ...)")
  .option("--preset <preset>", "Built-in preset (tiktok, cinematic-gold, ...)")
  .option("--color <color>", "Highlight color")
  .option("--emphasis <mode>", "Emphasis rendering: scale | color | glow")
  .option("--fps <n>", "Frames per second", "30")
  .option("--width <n>", "Output width", "1080")
  .option("--height <n>", "Output height", "1920")
  .option("-o, --out <path>", "Output MP4 path", "captioneer-output.mp4")
  .action(async (captionFile: string, opts: Record<string, string | undefined>) => {
    const filePath = resolve(captionFile);
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }
    const mediaPath = opts.video ? resolve(opts.video) : opts.audio ? resolve(opts.audio) : null;
    if (!mediaPath) {
      console.error("❌ Provide --audio <file> or --video <file>");
      process.exit(1);
    }
    if (opts.video && opts.audio) {
      console.error("❌ Use either --audio or --video, not both");
      process.exit(1);
    }
    if (!existsSync(mediaPath)) {
      console.error(`❌ Media file not found: ${mediaPath}`);
      process.exit(1);
    }
    let animationJson: unknown;
    if (opts.animation) {
      const animationPath = resolve(opts.animation);
      if (!existsSync(animationPath)) {
        console.error(`❌ Animation file not found: ${animationPath}`);
        process.exit(1);
      }
      animationJson = JSON.parse(readFileSync(animationPath, "utf-8"));
    }

    let bundleFn: typeof import("@remotion/bundler").bundle;
    let renderer: typeof import("@remotion/renderer");
    try {
      ({ bundle: bundleFn } = await import("@remotion/bundler"));
      renderer = await import("@remotion/renderer");
    } catch {
      console.error(
        "❌ captioneer render needs the Remotion renderer packages.\n" +
          "   Install them next to remotion-captioneer:\n" +
          "   npm i -D @remotion/bundler@4 @remotion/renderer@4"
      );
      process.exit(1);
    }

    try {
      const parsed: unknown = JSON.parse(readFileSync(filePath, "utf-8"));
      const { assertCaptionDataShape } = await import("./translate.js");
      const captions = assertCaptionDataShape(parsed);
      const { assertRenderableCaptions, computeRenderMetadata, RENDER_COMPOSITION_ID } =
        await import("./render/pipeline.js");
      assertRenderableCaptions(captions);

      // Remotion serves media from the bundle's public dir, so stage the
      // audio/video there under a fixed name and reference via staticFile().
      const { copyFileSync, mkdtempSync, rmSync } = await import("fs");
      const { tmpdir } = await import("os");
      const { basename: bn, extname: ext } = await import("path");
      const mediaExt = (ext(mediaPath).toLowerCase().match(/^\.[a-z0-9]+$/)?.[0] ?? ".mp4");
      const mediaFile = `captioneer-media${mediaExt}`;
      const publicDir = mkdtempSync(join(tmpdir(), "captioneer-render-"));
      copyFileSync(mediaPath, join(publicDir, mediaFile));

      let animation: import("./animation.js").AnimationSpec | undefined;
      if (animationJson !== undefined) {
        const { validateAnimationSpec } = await import("./animation.js");
        animation = validateAnimationSpec(animationJson);
      }

      type RenderProps = import("./render/pipeline.js").RenderInputProps;
      const inputProps: RenderProps = {
        captions,
        ...(opts.video ? { videoFile: mediaFile } : { audioFile: mediaFile }),
        ...(animation ? { animation } : {}),
        ...(opts.style ? { style: opts.style as RenderProps["style"] } : {}),
        ...(opts.preset ? { preset: opts.preset } : {}),
        ...(opts.color ? { highlightColor: opts.color } : {}),
        ...(opts.emphasis
          ? { emphasisStyle: opts.emphasis as RenderProps["emphasisStyle"] }
          : {}),
        ...(opts.duration ? { durationSeconds: Number(opts.duration) } : {}),
        fps: Number(opts.fps ?? 30),
        width: Number(opts.width ?? 1080),
        height: Number(opts.height ?? 1920),
      };
      // Fail fast on invalid fps/resolution before the slow bundling step.
      computeRenderMetadata(inputProps);

      const entryPoint = join(__dirname, "render", "render-entry.js");
      console.log("🎬 Bundling render entry...");
      const serveUrl = await bundleFn({
        entryPoint,
        publicDir,
        onProgress: (progress: number) => {
          if (progress % 25 === 0) process.stderr.write(`   bundle ${progress}%\n`);
        },
      });

      console.log("🎞  Selecting composition...");
      const composition = await renderer.selectComposition({
        serveUrl,
        id: RENDER_COMPOSITION_ID,
        inputProps,
      });

      const outPath = resolve(opts.out ?? "captioneer-output.mp4");
      console.log(`🎥 Rendering ${composition.durationInFrames} frames → ${outPath}`);
      try {
        await renderer.renderMedia({
          composition,
          serveUrl,
          codec: "h264",
          outputLocation: outPath,
          inputProps,
        });
      } finally {
        rmSync(publicDir, { recursive: true, force: true });
      }
      console.log(`\n✅ Rendered ${outPath} (${bn(outPath)})`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${message}`);
      process.exit(1);
    }
  });

program
  .command("tighten")
  .description("Remove filler words (um, uh, you know...) from a captions JSON")
  .argument("<caption-file>", "Path to caption JSON file")
  .option("--report", "Report matches without changing the captions")
  .option("--no-close-gaps", "Keep original word timing instead of shifting words earlier")
  .option("--extra <words>", "Comma-separated extra fillers (single words or phrases)")
  .option("--keep <words>", "Comma-separated fillers to keep")
  .option("--in-place", "Rewrite the file in place (default: print to stdout)")
  .action(async (captionFile: string, opts: Record<string, string | boolean | undefined>) => {
    const filePath = resolve(captionFile);
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    try {
      const parsed: unknown = JSON.parse(readFileSync(filePath, "utf-8"));
      const { assertCaptionDataShape } = await import("./translate.js");
      const captions = assertCaptionDataShape(parsed);
      const { filterFillers } = await import("./fillers.js");

      const list = (v: string | boolean | undefined): string[] | undefined =>
        typeof v === "string" && v.trim().length > 0
          ? v.split(",").map((w) => w.trim()).filter(Boolean)
          : undefined;

      const { captions: tightened, matches } = filterFillers(captions, {
        remove: opts.report !== true,
        closeGaps: opts.closeGaps !== false,
        extraFillers: list(opts.extra),
        keepFillers: list(opts.keep),
      });

      const savedMs = matches.reduce((acc, m) => acc + m.durationMs, 0);
      if (opts.inPlace) {
        writeFileSync(filePath, `${JSON.stringify(tightened, null, 2)}\n`, "utf8");
        console.log(`✅ Wrote ${filePath}\n`);
      } else if (opts.report !== true) {
        process.stdout.write(`${JSON.stringify(tightened, null, 2)}\n`);
      }
      console.error(`   ${matches.length} filler(s) removed · ${(savedMs / 1000).toFixed(1)}s tighter`);
      for (const m of matches.slice(0, 20)) {
        console.error(`   [seg ${m.segmentIndex}] ${m.words.join(" ")}`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${message}`);
      process.exit(1);
    }
  });

program.parse();
