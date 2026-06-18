/**
 * StyleGallery — cycles through all 14 caption styles
 */
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { AnimatedCaptions } from "../components/AnimatedCaptions.js";
import { CAPTION_STYLES } from "../caption-styles.js";
import { STYLE_HIGHLIGHT } from "./style-highlights.js";
import { demoCaptions } from "./demo/captions.js";
import type { CaptionStyle } from "../types.js";

const FRAMES_PER_STYLE = 60;

export const StyleGallery: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
      {CAPTION_STYLES.map((style, i) => (
        <Sequence key={style} from={i * FRAMES_PER_STYLE} durationInFrames={FRAMES_PER_STYLE}>
          <StyleSlide style={style} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const StyleSlide: React.FC<{ readonly style: CaptionStyle }> = ({ style }) => (
  <AbsoluteFill>
    <AnimatedCaptions
      captions={demoCaptions}
      style={style}
      highlightColor={STYLE_HIGHLIGHT[style]}
      position="bottom"
    />
    <div
      style={{
        position: "absolute",
        top: 32,
        left: 32,
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: 14,
        fontWeight: 500,
        color: "rgba(255,255,255,0.4)",
        textTransform: "capitalize",
      }}
    >
      {style.replace(/-/g, " ")}
    </div>
  </AbsoluteFill>
);
