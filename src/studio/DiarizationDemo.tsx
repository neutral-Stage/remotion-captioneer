/**
 * DiarizationDemo — multi-speaker captions with speaker labels
 */
import React from "react";
import { AbsoluteFill } from "remotion";
import { AnimatedCaptions } from "../components/AnimatedCaptions.js";
import { diarizedCaptions } from "./demo/captions-diarized.js";

export const DiarizationDemo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
    <AnimatedCaptions
      showSpeakerLabels
      captions={diarizedCaptions}
      style={"word-highlight" as const}
      highlightColor="#3b82f6"
    />
  </AbsoluteFill>
);
