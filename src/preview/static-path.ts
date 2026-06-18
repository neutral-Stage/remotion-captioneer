/**
 * Safe static file resolution for the preview server bundle.
 */

import { existsSync } from "fs";
import { extname, resolve, relative } from "path";

export function resolvePreviewStaticPath(
  previewDir: string,
  requestPath: string
): string | null {
  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\//, "");
  if (!relativePath || relativePath.includes("\0")) return null;
  const resolvedRoot = resolve(previewDir);
  const resolvedFile = resolve(previewDir, relativePath);
  const rel = relative(resolvedRoot, resolvedFile);
  if (rel.startsWith("..") || resolve(resolvedRoot, rel) !== resolvedFile) {
    return null;
  }
  return resolvedFile;
}

export function getStaticMime(filePath: string): string {
  const ext = extname(filePath);
  const MIME: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
  };
  return MIME[ext] ?? "application/octet-stream";
}

export function staticFileExists(previewDir: string, requestPath: string): boolean {
  const filePath = resolvePreviewStaticPath(previewDir, requestPath);
  return filePath !== null && existsSync(filePath);
}
