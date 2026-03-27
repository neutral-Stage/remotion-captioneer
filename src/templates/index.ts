export {
  type VideoTemplate,
  type Scene,
  type Block,
  type BlockType,
  type DesignTokens,
  type ColorTokens,
  type TypographyTokens,
  type AnimationConfig,
  type TextBlock,
  type ImageBlock,
  type VideoBlock,
  type AudioBlock,
  type CaptionsBlock,
  type DividerBlock,
  type SpacerBlock,
  type ColumnsBlock,
  type GridBlock,
  type LogoBlock,
  // Presets
  createIntroScene,
  createCaptionScene,
  createOutroScene,
  createDividerScene,
  buildTemplate,
} from "./types.js";

export { TemplateComposition } from "./renderer.js";
