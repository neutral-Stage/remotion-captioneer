import { describe, expect, it } from "vitest";
import {
  clampNumSpeakers,
  parseLanguageHeader,
  parseProcessHeaders,
} from "./headers.js";

describe("parseProcessHeaders", () => {
  it("clamps speaker count", () => {
    expect(parseProcessHeaders({ "x-speakers": "99" }).numSpeakers).toBe(20);
    expect(parseProcessHeaders({ "x-speakers": "0" }).numSpeakers).toBe(1);
    expect(parseProcessHeaders({ "x-speakers": "3" }).numSpeakers).toBe(3);
  });

  it("validates language header", () => {
    expect(parseProcessHeaders({ "x-language": "es" }).language).toBe("es");
    expect(() => parseLanguageHeader('es"; DROP TABLE')).toThrow(/Invalid target language/);
  });
});

describe("clampNumSpeakers", () => {
  it("returns undefined for invalid input", () => {
    expect(clampNumSpeakers(undefined)).toBeUndefined();
    expect(clampNumSpeakers(Number.NaN)).toBeUndefined();
  });
});
