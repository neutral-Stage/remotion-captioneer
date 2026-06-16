// Example 10 — Speaker diarization (AssemblyAI or ElevenLabs)
//
// CLI:
//   npx captioneer process interview.mp3 --provider assemblyai --diarize
//   npx captioneer process call.mp3 --provider elevenlabs --diarize --speakers 2
//
// Caption JSON segments include optional `speaker` labels when diarization is enabled.

import { AbsoluteFill } from "remotion";
import { AnimatedCaptions, listSpeakers, formatSpeakerLabel } from "remotion-captioneer";
import captions from "./captions-diarized.json";

export const DiarizationExample = () => {
  const speakers = listSpeakers(captions.segments);
  return (
    <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
      <AnimatedCaptions captions={captions} style="word-highlight" highlightColor="#3b82f6" showSpeakerLabels />
      {speakers.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {speakers.map(formatSpeakerLabel).join(" · ")}
        </div>
      )}
    </AbsoluteFill>
  );
};
