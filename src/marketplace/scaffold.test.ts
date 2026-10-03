import { describe, expect, it } from "vitest";
import { createStylePackageDraft, slugifyPackageId } from "./scaffold.js";
import { validateStylePackage } from "./schema.js";

describe("slugifyPackageId", () => {
  it("slugifies display names", () => {
    expect(slugifyPackageId("Neon Pulse")).toBe("neon-pulse");
    expect(slugifyPackageId("  Midnight  Blue  ")).toBe("midnight-blue");
    expect(slugifyPackageId("Shuvo's Cinematic Gold")).toBe("shuvos-cinematic-gold");
    expect(slugifyPackageId("podcast.bold_v2")).toBe("podcast.bold_v2");
  });

  it("caps length at 64", () => {
    expect(slugifyPackageId("a".repeat(100))).toHaveLength(64);
  });

  it("returns null when nothing usable remains", () => {
    expect(slugifyPackageId("!!!")).toBeNull();
    expect(slugifyPackageId("   ")).toBeNull();
    expect(slugifyPackageId("---")).toBeNull();
  });
});

describe("createStylePackageDraft", () => {
  it("produces a schema-valid package with defaults", () => {
    const { pkg, fileName } = createStylePackageDraft({ name: "Neon Pulse" });
    expect(pkg.meta.id).toBe("neon-pulse");
    expect(pkg.preset.style).toBe("word-highlight");
    expect(pkg.preset.position).toBe("bottom");
    expect(pkg.preset.fontSize).toBeGreaterThan(0);
    expect(fileName).toBe("neon-pulse.captioneer-style.json");

    // round-trips through the marketplace validator untouched
    expect(validateStylePackage(JSON.parse(JSON.stringify(pkg)))).toEqual(pkg);
  });

  it("applies contributor overrides", () => {
    const { pkg } = createStylePackageDraft({
      name: "Sunday Gold",
      style: "glow",
      highlightColor: "#D4AF37",
      fontColor: "rgba(255,255,255,0.3)",
      fontFamily: "Playfair Display, serif",
      fontSize: 52,
      position: "center",
      author: "Shuvo",
    });
    expect(pkg.preset.style).toBe("glow");
    expect(pkg.preset.highlightColor).toBe("#D4AF37");
    expect(pkg.preset.fontFamily).toBe("Playfair Display, serif");
    expect(pkg.preset.fontSize).toBe(52);
    expect(pkg.preset.position).toBe("center");
    expect(pkg.meta.author).toBe("Shuvo");
  });

  it("rejects unknown animation styles", () => {
    expect(() =>
      createStylePackageDraft({ name: "Broken", style: "matrix-rain" })
    ).toThrow(/Unknown style/);
  });

  it("rejects names that slugify to nothing", () => {
    expect(() => createStylePackageDraft({ name: "???" })).toThrow(/package id/);
  });

  it("falls back to a safe font size", () => {
    const { pkg } = createStylePackageDraft({ name: "Tiny", fontSize: Number.NaN });
    expect(pkg.preset.fontSize).toBe(56);
  });
});
