// Example 14 — Smart captions: auto-emphasis, per-speaker colors, beat snapping
//
// CLI:
//   npx captioneer process clip.mp3 --provider assemblyai --diarize
//   npx captioneer emphasize captions.json --in-place          # auto-flag emphasis words
//
// Library:
//   import { markEmphasis, snapCaptionsToBeats, analyzeAudio } from "remotion-captioneer";
//
// - `emphasisStyle` renders flagged words bigger / recolored / glowing
//   (supported by word-highlight, karaoke, bounce, pill, and glow)
// - `speakerHighlight` recolors the whole animation to the active speaker
// - `snapCaptionsToBeats(captions, analysis.beats)` nudges word starts onto
//   detected beats so word pops land with the music

import { AbsoluteFill } from "remotion";
import { AnimatedCaptions, markEmphasis } from "remotion-captioneer";
import captions from "./captions-diarized.json";

const emphasized = markEmphasis(captions, { maxPerSegment: 1 });

export const EmphasisExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
    <AnimatedCaptions
      captions={emphasized}
      style="word-highlight"
      highlightColor="#3b82f6"
      emphasisStyle="scale"
      emphasisColor="#f59e0b"
      speakerHighlight
      showSpeakerLabels
    />
  </AbsoluteFill>
);
