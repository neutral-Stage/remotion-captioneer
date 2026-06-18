import { describe, expect, it } from "vitest";
import { join } from "path";
import {
  resolvePreviewStaticPath,
  staticFileExists,
} from "./static-path.js";

const PREVIEW_DIR = join(process.cwd(), "dist", "preview");

describe("resolvePreviewStaticPath", () => {
  it("resolves index.html for root", () => {
    const resolved = resolvePreviewStaticPath(PREVIEW_DIR, "/");
    expect(resolved).toBe(join(PREVIEW_DIR, "index.html"));
  });

  it("blocks path traversal", () => {
    expect(resolvePreviewStaticPath(PREVIEW_DIR, "/../package.json")).toBeNull();
    expect(resolvePreviewStaticPath(PREVIEW_DIR, "/..%2fpackage.json")).toBeNull();
  });

  it("rejects null bytes", () => {
    expect(resolvePreviewStaticPath(PREVIEW_DIR, "/index.html\0.txt")).toBeNull();
  });

  it("checks existence helper", () => {
    expect(staticFileExists(PREVIEW_DIR, "/not-a-real-file-xyz.html")).toBe(false);
  });
});
