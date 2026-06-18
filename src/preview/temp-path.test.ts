import { describe, it, expect } from "vitest";
import { createTempUploadPath } from "./temp-path.js";

describe("createTempUploadPath", () => {
  it("does not include user-controlled filename segments", () => {
    const path = createTempUploadPath("captioneer-test");
    expect(path).toContain("captioneer-test-");
    expect(path).not.toContain("..");
    expect(path.endsWith(".bin")).toBe(true);
  });
});
