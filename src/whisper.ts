/**
 * Whisper integration — converts audio to word-level timestamped captions
 */

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, resolve, basename, extname } from "path";
import type { CaptionData, CaptionSegment, Word, WhisperOptions } from "./types.js";

const DEFAULT_WHISPER_PATH = join(process.cwd(), "whisper.cpp");
const DEFAULT_MODEL_PATH = join(DEFAULT_WHISPER_PATH, "models", "ggml-base.bin");

/**
 * Install whisper.cpp locally
 */
export async function installWhisper(
  whisperPath: string = DEFAULT_WHISPER_PATH
): Promise<void> {
  if (existsSync(join(whisperPath, "main"))) {
    console.log("✅ whisper.cpp already installed");
    return;
  }

  console.log("📥 Installing whisper.cpp...");
  mkdirSync(whisperPath, { recursive: true });

  try {
    execSync(
      `git clone https://github.com/ggerganov/whisper.cpp.git "${whisperPath}"`,
      { stdio: "inherit" }
    );
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
 * Parse whisper.cpp JSON output into CaptionData
 */
function parseWhisperOutput(jsonPath: string): CaptionData {
  const raw = readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);

  const segments: CaptionSegment[] = (data.transcription || []).map(
    (seg: any) => {
      const words: Word[] = (seg.tokens || [])
        .filter((t: any) => t.text && t.text.trim() && t.text.trim() !== "[BLANK_AUDIO]")
        .map((t: any) => ({
          word: t.text.trim(),
          startMs: Math.round((t.t0 / 100) * 1000),
          endMs: Math.round((t.t1 / 100) * 1000),
          confidence: t.p ?? 1.0,
        }));

      return {
        text: seg.text?.trim() ?? "",
        startMs: Math.round((seg.t0 / 100) * 1000),
        endMs: Math.round((seg.t1 / 100) * 1000),
        words,
      };
    }
  );

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
  const modelPath = options.modelPath ?? DEFAULT_MODEL_PATH;
  const mainBinary = join(whisperPath, "build", "bin", "main");

  if (!existsSync(mainBinary)) {
    throw new Error(
      `whisper.cpp binary not found at ${mainBinary}. Run installWhisper() first.`
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

  const langFlag = options.language ? `-l ${options.language}` : "";

  console.log(`🎙️ Transcribing: ${basename(resolvedAudio)}...`);

  try {
    execSync(
      `"${mainBinary}" -m "${modelPath}" -f "${resolvedAudio}" -oj "${outputDir}" -of "${baseName}" --output-csv false --output-srt false --output-txt false --word-thold 0.5 ${langFlag}`,
      { stdio: "inherit" }
    );
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
