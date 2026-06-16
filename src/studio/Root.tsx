/**
 * Remotion Root — registers all caption style demo compositions
 */

import React from "react";
import { Composition, Folder } from "remotion";
import { CaptionShowcase } from "./CaptionShowcase.js";
import { WelcomeComposition } from "./WelcomeComposition.js";
import { StyleGallery } from "./StyleGallery.js";
import { PresetShowcase } from "./PresetShowcase.js";
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
      <Composition
        id="Welcome"
        component={WelcomeComposition}
        durationInFrames={150}
        fps={DEMO_FPS}
        width={DEMO_WIDTH}
        height={DEMO_HEIGHT}
      />

      <Folder name="Gallery">
        <Composition
          id="StyleGallery"
          component={StyleGallery}
          durationInFrames={CAPTION_STYLES.length * 60}
          fps={DEMO_FPS}
          width={DEMO_WIDTH}
          height={DEMO_HEIGHT}
        />
        <Composition
          id="PresetShowcase"
          component={PresetShowcase}
          durationInFrames={8 * 75}
          fps={DEMO_FPS}
          width={DEMO_WIDTH}
          height={DEMO_HEIGHT}
        />
      </Folder>

      <Folder name="Styles">
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
      </Folder>
    </>
  );
};
