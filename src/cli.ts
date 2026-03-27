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
import { existsSync, writeFileSync } from "fs";
import { resolve, basename, extname } from "path";

const program = new Command();

program
  .name("captioneer")
  .description("Drop-in animated captions for Remotion — supports local Whisper, OpenAI, Groq, Deepgram, AssemblyAI")
  .version("0.2.0");

program
  .command("process")
  .description("Process an audio file and generate caption data")
  .argument("<audio>", "Path to audio or video file")
  .option("-p, --provider <provider>", "STT provider: local, openai, groq, deepgram, assemblyai")
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
      console.error("   Set one of: OPENAI_API_KEY, GROQ_API_KEY, DEEPGRAM_API_KEY, ASSEMBLYAI_API_KEY");
      console.error("   Or use --provider local with whisper.cpp installed");
      process.exit(1);
    }

    console.log(`🎙️ Processing: ${basename(resolved)}`);
    console.log(`📡 Provider: ${providerName}`);

    try {
      let captions: any;

      if (providerName === "local") {
        const { processAudio } = await import("./whisper.js");
        captions = await processAudio(resolved, {
          model: opts.model ?? config?.defaultModel ?? "base",
          language: opts.language ?? config?.defaultLanguage,
          whisperPath: config?.whisperPath,
          modelPath: config?.modelPath,
        });
      } else {
        const { createProvider } = await import("./providers/registry.js");
        const apiKey = opts.apiKey ?? getApiKeyForProvider(providerName);
        const provider = createProvider(providerName as any, apiKey);

        if (!provider.isReady()) {
          console.error(`❌ ${providerName} API key not set.`);
          console.error(`   Use --api-key or set ${providerName.toUpperCase()}_API_KEY env var`);
          process.exit(1);
        }

        if (opts.model) {
          console.log(`📦 Model: ${opts.model}`);
        }

        captions = await provider.transcribe(resolved, {
          model: opts.model,
          language: opts.language,
        });
      }

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
    console.log();
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

// Helpers
function detectDefaultProvider(): string | null {
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.DEEPGRAM_API_KEY) return "deepgram";
  if (process.env.ASSEMBLYAI_API_KEY) return "assemblyai";
  return null;
}

function getApiKeyForProvider(provider: string): string | undefined {
  const envMap: Record<string, string> = {
    openai: "OPENAI_API_KEY",
    groq: "GROQ_API_KEY",
    deepgram: "DEEPGRAM_API_KEY",
    assemblyai: "ASSEMBLYAI_API_KEY",
  };
  return process.env[envMap[provider]];
}

program.parse();
