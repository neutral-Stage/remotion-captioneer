// Example 08 — Compare caption styles (use Studio StyleGallery or cycle styles)
import { AbsoluteFill, Sequence } from "remotion";
import { AnimatedCaptions } from "remotion-captioneer";
import type { CaptionStyle } from "remotion-captioneer";
import captions from "./captions.json";

const STYLES: CaptionStyle[] = ["word-highlight", "karaoke", "bounce", "glow"];
const FRAMES = 60;

export const StyleGalleryExample = () => (
  <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
    {STYLES.map((style, i) => (
      <Sequence key={style} from={i * FRAMES} durationInFrames={FRAMES}>
        <AnimatedCaptions captions={captions} style={style} highlightColor="#3b82f6" />
      </Sequence>
    ))}
  </AbsoluteFill>
);
