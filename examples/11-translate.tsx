// Example 11 — Caption translation (Node)
//
// Requires OPENAI_API_KEY:
//   npx captioneer translate captions.json --target es -o captions-es.json
//
// Or programmatically:

import { translateCaptionData } from "remotion-captioneer/node";
import captions from "./captions.json";

export async function translateExample() {
  const translated = await translateCaptionData(captions, {
    targetLanguage: "es",
    onProgress: (msg) => console.log(msg),
  });
  return translated;
}

// Use translated segments in Remotion:
// <AnimatedCaptions captions={translated} style="word-highlight" />
