#!/usr/bin/env node

/**
 * remotion-captioneer CLI
 *
 * Usage:
 *   npx captioneer process <audio-file> [options]
 *   npx captioneer demo
 */

import { Command } from "commander";
import { existsSync, writeFileSync } from "fs";
import { resolve, basename, extname } from "path";

const program = new Command();

program
  .name("captioneer")
  .description("Drop-in animated captions for Remotion")
  .version("0.1.0");

program
  .command("process")
  .description("Process an audio file and generate caption data")
  .argument("<audio>", "Path to audio or video file")
  .option("-m, --model <model>", "Whisper model size", "base")
  .option("-l, --language <lang>", "Language code (e.g. en, es, fr)")
  .option("-o, --output <path>", "Output JSON path")
  .option("-v, --verbose", "Verbose output", false)
  .action(async (audioPath: string, opts: any) => {
    const resolved = resolve(audioPath);
    if (!existsSync(resolved)) {
      console.error(`❌ File not found: ${resolved}`);
      process.exit(1);
    }

    console.log(`🎙️ Processing: ${basename(resolved)}`);
    console.log(`📦 Model: ${opts.model}`);
    if (opts.language) console.log(`🌐 Language: ${opts.language}`);

    try {
      // Dynamic import to avoid loading heavy deps at startup
      const { processAudio } = await import("./whisper.js");
      const { loadConfig } = await import("./config.js");

      const config = await loadConfig();

      const captions = await processAudio(resolved, {
        model: opts.model,
        language: opts.language,
        whisperPath: config?.whisperPath,
        modelPath: config?.modelPath,
      });

      const outputPath =
        opts.output ??
        resolve(
          process.cwd(),
          `${basename(resolved, extname(resolved))}-captions.json`
        );

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
  .command("demo")
  .description("Open Remotion studio with demo captions")
  .action(async () => {
    console.log("🎬 Opening Remotion Studio with demo captions...");
    const { execSync } = await import("child_process");
    execSync("npx remotion studio", { stdio: "inherit", cwd: process.cwd() });
  });

program
  .command("styles")
  .description("List available caption styles")
  .action(() => {
    console.log("\n🎨 Available Caption Styles:\n");
    console.log("  word-highlight  — Each word lights up as spoken");
    console.log("  karaoke         — Progressive left-to-right fill");
    console.log("  typewriter      — Character-by-character reveal");
    console.log("  bounce          — Active word bounces with spring\n");
  });

program.parse();
