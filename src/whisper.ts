/**
 * Whisper integration — converts audio to word-level timestamped captions
 */

import { execFileSync, execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve, basename, extname } from "path";
import type { CaptionData, CaptionSegment, Word, WhisperOptions } from "./types.js";
import { chunkWordsIntoSegments } from "./providers/diarization.js";
import type { WhisperCppOutput } from "./providers/whisper-api-types.js";

const DEFAULT_WHISPER_PATH = join(process.cwd(), "whisper.cpp");
const DEFAULT_MODEL_PATH = join(DEFAULT_WHISPER_PATH, "models", "ggml-base.bin");

/**
 * Locate the whisper.cpp CLI binary. Upstream renamed `main` to
 * `whisper-cli`, so both names are probed (new name first).
 */
function findWhisperBinary(whisperPath: string): string | null {
  for (const name of ["whisper-cli", "main"]) {
    const candidate = join(whisperPath, "build", "bin", name);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Install whisper.cpp locally
 */
export async function installWhisper(
  whisperPath: string = DEFAULT_WHISPER_PATH
): Promise<void> {
  if (findWhisperBinary(whisperPath)) {
    console.log("✅ whisper.cpp already installed");
    return;
  }

  console.log("📥 Installing whisper.cpp...");
  mkdirSync(whisperPath, { recursive: true });

  try {
    // A previous clone without a completed build should not re-clone.
    if (!existsSync(join(whisperPath, "CMakeLists.txt"))) {
      execSync(
        `git clone https://github.com/ggerganov/whisper.cpp.git "${whisperPath}"`,
        { stdio: "inherit" }
      );
    }
    execSync(`cmake -B build`, {
      cwd: whisperPath,
      stdio: "inherit",
    });
    execSync(`cmake --build build -j --config Release`, {
      cwd: whisperPath,
      stdio: "inherit",
    });
    console.log("✅ whisper.cpp installed successfully");
  } catch (error) {
    throw new Error(
      "Failed to install whisper.cpp. Make sure git and cmake are installed."
    );
  }
}

/**
 * Download a whisper model
 */
export async function downloadModel(
  model: string = "base",
  whisperPath: string = DEFAULT_WHISPER_PATH
): Promise<string> {
  const modelPath = join(whisperPath, "models", `ggml-${model}.bin`);

  if (existsSync(modelPath)) {
    console.log(`✅ Model ${model} already downloaded`);
    return modelPath;
  }

  console.log(`📥 Downloading whisper model: ${model}...`);
  const modelsDir = join(whisperPath, "models");
  mkdirSync(modelsDir, { recursive: true });

  try {
    execSync(`bash ${join(whisperPath, "models", "download-ggml-model.sh")} ${model}`, {
      stdio: "inherit",
    });
    console.log(`✅ Model ${model} downloaded`);
    return modelPath;
  } catch (error) {
    throw new Error(`Failed to download model: ${model}`);
  }
}

/**
 * Parse whisper.cpp JSON output into CaptionData.
 *
 * Handles both output generations:
 * - Legacy `main`: per-segment `tokens` with centisecond timing
 * - Current `whisper-cli` (run with `--max-len 1`): one segment per word
 *   with millisecond `offsets`; words are re-chunked into readable segments
 */
function parseWhisperOutput(jsonPath: string): CaptionData {
  const raw = readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw) as WhisperCppOutput;
  const entries = data.transcription || [];

  const isSpecialToken = (text: string): boolean =>
    !text || text === "[BLANK_AUDIO]" || /^\[_[A-Z0-9_]*\]$/.test(text);

  const legacyTimedTokens = entries.some(
    (seg) => (seg.tokens ?? []).some((t) => typeof t.t0 === "number")
  );

  let segments: CaptionSegment[];

  if (legacyTimedTokens) {
    segments = entries.map((seg) => {
      const words: Word[] = (seg.tokens || [])
        .filter((t) => !isSpecialToken(t.text?.trim() ?? ""))
        .map((t) => ({
          word: t.text!.trim(),
          startMs: Math.round(((t.t0 ?? 0) / 100) * 1000),
          endMs: Math.round(((t.t1 ?? 0) / 100) * 1000),
          confidence: t.p ?? 1.0,
        }))
        .filter((w) => w.endMs > w.startMs);
      return {
        text: seg.text?.trim() ?? "",
        startMs: Math.round(((seg.t0 ?? 0) / 100) * 1000),
        endMs: Math.round(((seg.t1 ?? 0) / 100) * 1000),
        words,
      };
    }).filter((s) => s.words.length > 0);
  } else {
    // whisper-cli with --max-len 1: each segment is a single word with
    // millisecond offsets.
    const words: Word[] = [];
    for (const seg of entries) {
      const text = seg.text?.trim() ?? "";
      if (isSpecialToken(text)) continue;
      const from = seg.offsets?.from ?? 0;
      const to = seg.offsets?.to ?? from;
      if (to <= from) continue;
      words.push({ word: text, startMs: from, endMs: to, confidence: seg.probability ?? 1.0 });
    }
    segments = chunkWordsIntoSegments(words, 5);
  }

  const durationMs =
    segments.length > 0 ? segments[segments.length - 1].endMs : 0;

  return {
    segments,
    language: data.result?.language ?? "en",
    durationMs,
  };
}

/**
 * Process an audio file and return CaptionData
 */
export async function processAudio(
  audioPath: string,
  options: WhisperOptions = {}
): Promise<CaptionData> {
  const resolvedAudio = resolve(audioPath);

  if (!existsSync(resolvedAudio)) {
    throw new Error(`Audio file not found: ${resolvedAudio}`);
  }

  const whisperPath = options.whisperPath ?? DEFAULT_WHISPER_PATH;
  const modelPath =
    options.modelPath ??
    (options.model
      ? join(whisperPath, "models", `ggml-${options.model}.bin`)
      : DEFAULT_MODEL_PATH);
  const mainBinary = findWhisperBinary(whisperPath);

  if (!mainBinary) {
    throw new Error(
      `whisper.cpp binary not found in ${join(whisperPath, "build", "bin")} (looked for whisper-cli and main). Run installWhisper() first.`
    );
  }

  if (!existsSync(modelPath)) {
    throw new Error(
      `Model not found at ${modelPath}. Run downloadModel() first.`
    );
  }

  const outputDir = join(process.cwd(), ".captioneer-cache");
  mkdirSync(outputDir, { recursive: true });

  const baseName = basename(resolvedAudio, extname(resolvedAudio));
  const jsonOutput = join(outputDir, `${baseName}.json`);

  // Current whisper.cpp builds `whisper-cli`: full JSON (with per-word
  // tokens) is `-ojf`; `-of` takes the output path prefix. Legacy `main`
  // accepts the same forms. Boolean output formats are simply not
  // requested — no value args.
  const whisperArgs = [
    "-m",
    modelPath,
    "-f",
    resolvedAudio,
    "-ojf",
    "-of",
    join(outputDir, baseName),
    "--word-thold",
    "0.5",
    // One segment per word so the JSON carries per-word timing; the parser
    // re-chunks words into readable caption segments.
    "--max-len",
    "1",
  ];
  if (options.language) {
    whisperArgs.push("-l", options.language);
  }

  console.log(`🎙️ Transcribing: ${basename(resolvedAudio)}...`);

  try {
    execFileSync(mainBinary, whisperArgs, { stdio: "inherit" });
  } catch (error) {
    throw new Error("Whisper transcription failed");
  }

  if (!existsSync(jsonOutput)) {
    throw new Error("Whisper output not found. Transcription may have failed.");
  }

  const captionData = parseWhisperOutput(jsonOutput);

  // Cache the result
  const cachePath = join(outputDir, `${baseName}-captions.json`);
  writeFileSync(cachePath, JSON.stringify(captionData, null, 2));
  console.log(`✅ Captions saved to ${cachePath}`);

  return captionData;
}

/**
 * Load cached caption data
 */
export function loadCaptions(jsonPath: string): CaptionData {
  const raw = readFileSync(resolve(jsonPath), "utf-8");
  return JSON.parse(raw) as CaptionData;
}
