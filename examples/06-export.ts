// Example 6: Export Captions to Different Formats

import {
  toSRT,
  toVTT,
  toASS,
  toPlainText,
  toWordLevelSRT,
} from "remotion-captioneer";
import { readFileSync, writeFileSync } from "fs";

// Load caption data
const captions = JSON.parse(readFileSync("captions.json", "utf-8"));

// Export to SRT
writeFileSync("captions.srt", toSRT(captions));
console.log("✅ Exported SRT");

// Export to WebVTT
writeFileSync("captions.vtt", toVTT(captions));
console.log("✅ Exported VTT");

// Export to ASS (SubStation Alpha)
writeFileSync("captions.ass", toASS(captions, {
  fontName: "Arial",
  fontSize: 48,
}));
console.log("✅ Exported ASS");

// Export word-level SRT (for custom timing)
writeFileSync("captions-words.srt", toWordLevelSRT(captions));
console.log("✅ Exported word-level SRT");

// Export plain text
writeFileSync("captions.txt", toPlainText(captions));
console.log("✅ Exported plain text");
