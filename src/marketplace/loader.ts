/**
 * Load and install style packages from disk or remote URLs.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { homedir } from "os";
import { join, resolve, basename } from "path";
import { validateStylePackage, type StylePackage } from "./schema.js";
import { assertValidPackageId } from "./id.js";

export const STYLE_PACKAGE_MAX_BYTES = 512 * 1024;
export const STYLE_PACKAGE_FETCH_TIMEOUT_MS = 15_000;

/** Hosts allowed for remote style package installs (extend as needed). */
const ALLOWED_REMOTE_HOSTS = new Set([
  "raw.githubusercontent.com",
  "gist.githubusercontent.com",
  "gist.github.com",
]);

export function assertAllowedStylePackageUrl(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid style package URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Remote style packages must use https:// URLs");
  }
  if (!ALLOWED_REMOTE_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `Remote style host not allowed: ${parsed.hostname}. Allowed: ${[...ALLOWED_REMOTE_HOSTS].join(", ")}`
    );
  }
  return parsed;
}

export function getUserStylesDir(): string {
  return join(homedir(), ".captioneer", "styles");
}

export function getProjectStylesDir(cwd: string = process.cwd()): string {
  return join(cwd, ".captioneer", "styles");
}

export function listStyleInstallDirs(cwd?: string): string[] {
  const dirs = [getUserStylesDir(), getProjectStylesDir(cwd)];
  return dirs.filter((d) => existsSync(d));
}

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

export function loadStylePackageFromFile(filePath: string): StylePackage {
  const resolved = resolve(filePath);
  if (!existsSync(resolved)) {
    throw new Error(`Style package not found: ${resolved}`);
  }
  const raw = JSON.parse(readFileSync(resolved, "utf-8")) as unknown;
  return validateStylePackage(raw);
}

export async function loadStylePackageFromUrl(url: string): Promise<StylePackage> {
  assertAllowedStylePackageUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STYLE_PACKAGE_FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Failed to download style package (${res.status})`);
    }

    const contentLength = res.headers.get("content-length");
    if (contentLength && Number.parseInt(contentLength, 10) > STYLE_PACKAGE_MAX_BYTES) {
      throw new Error(`Style package exceeds ${STYLE_PACKAGE_MAX_BYTES} bytes`);
    }

    const text = await res.text();
    if (text.length > STYLE_PACKAGE_MAX_BYTES) {
      throw new Error(`Style package exceeds ${STYLE_PACKAGE_MAX_BYTES} bytes`);
    }

    const raw = JSON.parse(text) as unknown;
    return validateStylePackage(raw);
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Style package download timed out");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

export function installStylePackage(
  pkg: StylePackage,
  options: { target?: "user" | "project"; cwd?: string } = {}
): string {
  const packageId = assertValidPackageId(pkg.meta.id);
  const targetDir =
    options.target === "project"
      ? getProjectStylesDir(options.cwd)
      : getUserStylesDir();
  ensureDir(targetDir);
  const fileName = `${packageId}.json`;
  const dest = resolve(targetDir, fileName);
  if (!dest.startsWith(resolve(targetDir))) {
    throw new Error("Invalid style package install path");
  }
  writeFileSync(dest, JSON.stringify(pkg, null, 2), "utf-8");
  return dest;
}

export function loadInstalledStylePackages(cwd?: string): StylePackage[] {
  const packages: StylePackage[] = [];
  const seen = new Set<string>();

  for (const dir of listStyleInstallDirs(cwd)) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      const filePath = join(dir, entry.name);
      try {
        const pkg = loadStylePackageFromFile(filePath);
        if (seen.has(pkg.meta.id)) continue;
        seen.add(pkg.meta.id);
        packages.push(pkg);
      } catch (e) {
        console.warn(`Skipping invalid style package ${basename(filePath)}:`, e);
      }
    }
  }

  return packages;
}
