import { describe, expect, it } from "vitest";
import { sampleAnimation, validateAnimationSpec } from "./animation.js";

describe("validateAnimationSpec", () => {
  it("accepts a valid spec and normalizes hex colors", () => {
    const spec = validateAnimationSpec({
      duration: 0.5,
      easing: "ease-out",
      keyframes: [
        { at: 0, opacity: 0, scale: 0.8, color: "#FFD700" },
        { at: 1, opacity: 1, scale: 1.15, color: "#FF8800" },
      ],
    });
    expect(spec.duration).toBe(0.5);
    expect(spec.easing).toBe("ease-out");
    expect(spec.keyframes[0]!.color).toBe("#ffd700");
  });

  it("rejects empty or oversized keyframe lists", () => {
    expect(() => validateAnimationSpec({ keyframes: [] })).toThrow(/1–32/);
    expect(() =>
      validateAnimationSpec({
        keyframes: Array.from({ length: 33 }, (_, i) => ({ at: i / 33, scale: 1 })),
      })
    ).toThrow(/1–32/);
  });

  it("rejects out-of-range and non-hex values", () => {
    expect(() => validateAnimationSpec({ keyframes: [{ at: 1.5, scale: 1 }] })).toThrow(/0.*1/);
    expect(() => validateAnimationSpec({ keyframes: [{ at: 0, scale: 99 }] })).toThrow(/scale/);
    expect(() => validateAnimationSpec({ keyframes: [{ at: 0, opacity: 2 }] })).toThrow(/opacity/);
    expect(() => validateAnimationSpec({ keyframes: [{ at: 0, yOffset: -900 }] })).toThrow(
      /yOffset/
    );
    expect(() =>
      validateAnimationSpec({ keyframes: [{ at: 0, color: "red" }] })
    ).toThrow(/#RRGGBB/);
    expect(() =>
      validateAnimationSpec({ keyframes: [{ at: 0, color: "expression(alert(1))" }] })
    ).toThrow(/#RRGGBB/);
  });

  it("rejects non-monotonic keyframes and empty keyframes", () => {
    expect(() =>
      validateAnimationSpec({
        keyframes: [
          { at: 0.5, scale: 1 },
          { at: 0.5, scale: 2 },
        ],
      })
    ).toThrow(/greater than the previous/);
    expect(() => validateAnimationSpec({ keyframes: [{ at: 0 }] })).toThrow(
      /must set scale, opacity, yOffset, or color/
    );
  });

  it("rejects bad duration and easing", () => {
    expect(() =>
      validateAnimationSpec({ duration: 2, keyframes: [{ at: 0, scale: 1 }] })
    ).toThrow(/duration/);
    expect(() =>
      validateAnimationSpec({ easing: "bounce", keyframes: [{ at: 0, scale: 1 }] })
    ).toThrow(/easing/);
  });
});

describe("sampleAnimation", () => {
  const spec = validateAnimationSpec({
    keyframes: [
      { at: 0, scale: 0.5, opacity: 0, yOffset: 20, color: "#000000" },
      { at: 1, scale: 1.5, opacity: 1, yOffset: -20, color: "#ffffff" },
    ],
  });

  it("holds the first state before the range and last after", () => {
    expect(sampleAnimation(spec, 0)).toMatchObject({ scale: 0.5, opacity: 0, yOffset: 20 });
    expect(sampleAnimation(spec, 1)).toMatchObject({ scale: 1.5, opacity: 1, yOffset: -20 });
  });

  it("interpolates linearly by default", () => {
    const mid = sampleAnimation(spec, 0.5);
    expect(mid.scale).toBeCloseTo(1);
    expect(mid.opacity).toBeCloseTo(0.5);
    expect(mid.yOffset).toBeCloseTo(0);
    expect(mid.color).toBe("#808080");
  });

  it("applies easing between keyframes", () => {
    const eased = validateAnimationSpec({
      easing: "ease-in",
      keyframes: [
        { at: 0, opacity: 0 },
        { at: 1, opacity: 1 },
      ],
    });
    // ease-in at raw 0.5 → 0.25 progress
    expect(sampleAnimation(eased, 0.5).opacity).toBeCloseTo(0.25);
  });

  it("maps progress onto a partial duration window", () => {
    const half = validateAnimationSpec({
      duration: 0.5,
      keyframes: [
        { at: 0, opacity: 0 },
        { at: 1, opacity: 1 },
      ],
    });
    // word progress 0.25 = halfway through the 0.5 window
    expect(sampleAnimation(half, 0.25).opacity).toBeCloseTo(0.5);
    expect(sampleAnimation(half, 0.5).opacity).toBeCloseTo(1);
  });

  it("falls back to the nearest solid color when only one end sets color", () => {
    const oneColor = validateAnimationSpec({
      keyframes: [
        { at: 0, opacity: 1 },
        { at: 1, opacity: 1, color: "#ff0000" },
      ],
    });
    expect(sampleAnimation(oneColor, 0).color).toBeUndefined();
    expect(sampleAnimation(oneColor, 0.5).color).toBe("#ff0000");
  });
});
