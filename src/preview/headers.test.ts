import { describe, it, expect } from "vitest";
import { parseProcessHeaders } from "./headers.js";

describe("parseProcessHeaders", () => {
  it("parses diarize flag", () => {
    expect(parseProcessHeaders({ "x-diarize": "true" }).diarize).toBe(true);
    expect(parseProcessHeaders({}).diarize).toBe(false);
  });

  it("parses speaker count", () => {
    expect(parseProcessHeaders({ "x-speakers": "3" }).numSpeakers).toBe(3);
    expect(parseProcessHeaders({ "x-speakers": "x" }).numSpeakers).toBeUndefined();
    expect(parseProcessHeaders({}).numSpeakers).toBeUndefined();
  });

  it("parses combined headers", () => {
    const result = parseProcessHeaders({
      "x-diarize": "true",
      "x-speakers": "2",
      "x-filename": "call.mp3",
    });
    expect(result).toEqual({ diarize: true, numSpeakers: 2 });
  });
});
