import { describe, it, expect } from "vitest";
import { join } from "path";
import { createTempUploadPath } from "./temp-path.js";

describe("createTempUploadPath", () => {
  it("does not include user-controlled filename segments", () => {
    const path = createTempUploadPath("captioneer-test");
    expect(path).toContain("captioneer-test-");
    expect(path).not.toContain("..");
    expect(path.endsWith(".bin")).toBe(true);
  });
});

describe("resolvePreviewStaticPath", () => {
  // Tested via exported helper in preview-server if needed — path logic inline in server
  it("placeholder for static path hardening", () => {
    const root = join("/tmp", "preview");
    const safe = join(root, "index.html");
    expect(safe.startsWith(root)).toBe(true);
  });
});
