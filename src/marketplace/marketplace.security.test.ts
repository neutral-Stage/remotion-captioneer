import { describe, expect, it } from "vitest";
import { assertValidPackageId } from "./id.js";
import { assertAllowedStylePackageUrl } from "./loader.js";
import { validateStylePackage } from "./schema.js";

describe("marketplace security", () => {
  it("rejects unsafe package ids", () => {
    expect(() => assertValidPackageId("../evil")).toThrow(/meta.id/);
    expect(() => assertValidPackageId("UPPER")).toThrow(/meta.id/);
    expect(assertValidPackageId("sample-neon-pulse")).toBe("sample-neon-pulse");
  });

  it("rejects disallowed remote hosts", () => {
    expect(() =>
      assertAllowedStylePackageUrl("https://example.com/style.json")
    ).toThrow(/not allowed/);
    expect(() =>
      assertAllowedStylePackageUrl("http://raw.githubusercontent.com/x/y.json")
    ).toThrow(/https/);
    expect(
      assertAllowedStylePackageUrl(
        "https://raw.githubusercontent.com/org/repo/main/style.json"
      ).hostname
    ).toBe("raw.githubusercontent.com");
  });

  it("validates package id during schema parse", () => {
    expect(() =>
      validateStylePackage({
        schemaVersion: 1,
        meta: {
          id: "../bad",
          name: "Bad",
          description: "Bad",
          version: "1.0.0",
        },
        preset: {
          name: "Bad",
          description: "Bad",
          style: "glow",
          fontFamily: "Inter",
          fontSize: 48,
          fontColor: "#fff",
          highlightColor: "#000",
          position: "bottom",
        },
      })
    ).toThrow(/meta.id/);
  });
});
