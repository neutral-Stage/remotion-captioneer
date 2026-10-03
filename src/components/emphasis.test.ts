import { describe, expect, it } from "vitest";
import { emphasisVisual } from "./emphasis.js";

describe("emphasisVisual", () => {
  it("returns nothing for unflagged words or when disabled", () => {
    expect(emphasisVisual({ emphasis: false }, { emphasisStyle: "color" })).toEqual({
      scaleBoost: 1,
    });
    expect(emphasisVisual({ emphasis: true }, {})).toEqual({ scaleBoost: 1 });
  });

  it("color mode recolors and shadows", () => {
    const v = emphasisVisual(
      { emphasis: true },
      { emphasisStyle: "color", emphasisColor: "#00FF88" }
    );
    expect(v.color).toBe("#00FF88");
    expect(v.textShadow).toContain("#00FF88");
    expect(v.scaleBoost).toBe(1);
  });

  it("glow mode shadows without recoloring", () => {
    const v = emphasisVisual(
      { emphasis: true },
      { emphasisStyle: "glow", highlightColor: "#A855F7" }
    );
    expect(v.color).toBeUndefined();
    expect(v.textShadow).toContain("#A855F7");
  });

  it("scale mode boosts scale only", () => {
    const v = emphasisVisual({ emphasis: true }, { emphasisStyle: "scale" });
    expect(v.scaleBoost).toBeGreaterThan(1);
    expect(v.color).toBeUndefined();
    expect(v.textShadow).toBeUndefined();
  });

  it("falls back to highlightColor when emphasisColor is absent", () => {
    const v = emphasisVisual(
      { emphasis: true },
      { emphasisStyle: "color", highlightColor: "#FE2C55" }
    );
    expect(v.color).toBe("#FE2C55");
  });
});
