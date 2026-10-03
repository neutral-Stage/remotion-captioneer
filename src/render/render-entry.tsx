/**
 * Render entry — the composition `captioneer render` bundles and renders.
 *
 * This file is compiled to dist/render/render-entry.js and passed to
 * @remotion/bundler. All customization arrives via inputProps
 * (see RenderInputProps in ./pipeline.js).
 */

import React from "react";
import {
  AbsoluteFill,
  Audio,
  Composition,
  OffthreadVideo,
  registerRoot,
  staticFile,
} from "remotion";
import { AnimatedCaptions } from "../components/AnimatedCaptions.js";
import { applyPreset } from "../presets/index.js";
import {
  computeRenderMetadata,
  RENDER_COMPOSITION_ID,
  type RenderInputProps,
} from "./pipeline.js";

const PLACEHOLDER: RenderInputProps = {
  captions: { segments: [], language: "en", durationMs: 1000 },
};

const RenderedVideo: React.FC<RenderInputProps> = ({
  captions,
  audioFile,
  videoFile,
  style,
  preset,
  highlightColor,
  fontFamily,
  fontSize,
  position,
  backgroundColor,
  emphasisStyle,
  animation,
}) => {
  const presetProps = preset ? applyPreset(preset) : {};

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundColor ?? "#000000" }}>
      {videoFile ? (
        <OffthreadVideo src={staticFile(videoFile)} style={{ width: "100%", height: "100%" }} />
      ) : null}
      {audioFile ? <Audio src={staticFile(audioFile)} /> : null}
      <AnimatedCaptions
        captions={captions}
        style={style ?? (presetProps.style as RenderInputProps["style"])}
        highlightColor={highlightColor ?? presetProps.highlightColor}
        fontFamily={fontFamily ?? presetProps.fontFamily}
        fontSize={fontSize ?? presetProps.fontSize}
        position={position ?? presetProps.position}
        emphasisStyle={emphasisStyle}
        animation={animation ?? presetProps.animation}
      />
    </AbsoluteFill>
  );
};

export const RemotionRenderRoot: React.FC = () => (
  <Composition
    id={RENDER_COMPOSITION_ID}
    component={RenderedVideo}
    defaultProps={PLACEHOLDER}
    calculateMetadata={({ props }) => computeRenderMetadata(props)}
  />
);

registerRoot(RemotionRenderRoot);
