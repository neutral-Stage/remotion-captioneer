/**
 * Configuration loader
 * Reads .captioneerrc or captioneer field from package.json
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import type { ProviderName } from "./providers/base.js";

export interface CaptioneerConfig {
  // Local whisper settings
  whisperPath?: string;
  modelPath?: string;

  // Provider settings
  defaultProvider?: ProviderName;
  defaultModel?: string;
  defaultLanguage?: string;
  defaultStyle?: string;
}

export async function loadConfig(): Promise<CaptioneerConfig | null> {
  // Check .captioneerrc
  const rcPath = resolve(process.cwd(), ".captioneerrc");
  if (existsSync(rcPath)) {
    const raw = readFileSync(rcPath, "utf-8");
    return JSON.parse(raw) as CaptioneerConfig;
  }

  // Check package.json
  const pkgPath = resolve(process.cwd(), "package.json");
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    if (pkg.captioneer) {
      return pkg.captioneer as CaptioneerConfig;
    }
  }

  return null;
}
