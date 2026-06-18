/**
 * Load and install style packages from disk or remote URLs.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { homedir } from "os";
import { join, resolve, basename } from "path";
import { validateStylePackage, type StylePackage } from "./schema.js";

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
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download style package (${res.status})`);
  }
  const raw = (await res.json()) as unknown;
  return validateStylePackage(raw);
}

export function installStylePackage(
  pkg: StylePackage,
  options: { target?: "user" | "project"; cwd?: string } = {}
): string {
  const targetDir =
    options.target === "project"
      ? getProjectStylesDir(options.cwd)
      : getUserStylesDir();
  ensureDir(targetDir);
  const fileName = `${pkg.meta.id}.json`;
  const dest = join(targetDir, fileName);
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
