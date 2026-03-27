/**
 * Configuration loader
 * Reads .captioneerrc or captioneer field from package.json
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

export interface CaptioneerConfig {
  whisperPath?: string;
  modelPath?: string;
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
