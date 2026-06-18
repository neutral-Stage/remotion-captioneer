import { describe, expect, it } from "vitest";
import { assertSafeProjectName } from "./scaffold.js";

describe("assertSafeProjectName", () => {
  it("accepts safe names", () => {
    expect(assertSafeProjectName("my-captioned-video")).toBe("my-captioned-video");
  });

  it("rejects path traversal", () => {
    expect(() => assertSafeProjectName("../outside")).toThrow(/path separators/);
    expect(() => assertSafeProjectName("foo/bar")).toThrow(/path separators/);
  });
});
