/**
 * Remotion Root — registers all caption style demo compositions
 */

import React from "react";
import { Composition } from "remotion";
import { CaptionShowcase } from "./CaptionShowcase.js";
import { CAPTION_STYLES, styleToCompositionId } from "../caption-styles.js";
import { demoCaptions } from "./demo/captions.js";
import type { CaptionStyle } from "../types.js";

const DEMO_FPS = 30;
const DEMO_DURATION_FRAMES = 240;
const DEMO_WIDTH = 1920;
const DEMO_HEIGHT = 1080;

function createStyleDemo(style: CaptionStyle): React.FC<Record<string, unknown>> {
  const Demo: React.FC<Record<string, unknown>> = (props) => (
    <CaptionShowcase captions={demoCaptions} style={style} {...props} />
  );
  Demo.displayName = styleToCompositionId(style);
  return Demo;
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {CAPTION_STYLES.map((style) => (
        <Composition
          key={style}
          id={styleToCompositionId(style)}
          component={createStyleDemo(style)}
          durationInFrames={DEMO_DURATION_FRAMES}
          fps={DEMO_FPS}
          width={DEMO_WIDTH}
          height={DEMO_HEIGHT}
        />
      ))}
    </>
  );
};
