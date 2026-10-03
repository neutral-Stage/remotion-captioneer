/**
 * Shared emphasis treatment for caption style components.
 *
 * Style components spread `emphasisVisual()` output into their word spans so
 * `word.emphasis` words pop consistently: recolored, glowing, or scaled up.
 */

import type { CaptionComponentProps } from "../types.js";
import type { Word } from "../types.js";

export interface EmphasisVisual {
  /** Overrides the word's normal color when present */
  color?: string;
  /** Overrides the word's normal text shadow when present */
  textShadow?: string;
  /** Multiplier merged into the component's scale computation (1 = none) */
  scaleBoost: number;
}

export interface EmphasisStyleProps {
  readonly emphasisStyle?: CaptionComponentProps["emphasisStyle"];
  readonly emphasisColor?: string;
  readonly highlightColor?: string;
}

const NO_EMPHASIS: EmphasisVisual = { scaleBoost: 1 };

export function emphasisVisual(
  word: Pick<Word, "emphasis">,
  props: EmphasisStyleProps
): EmphasisVisual {
  if (!word.emphasis || !props.emphasisStyle) return NO_EMPHASIS;
  const color = props.emphasisColor ?? props.highlightColor ?? "#FFD700";
  switch (props.emphasisStyle) {
    case "color":
      return { color, textShadow: `0 0 14px ${color}66`, scaleBoost: 1 };
    case "glow":
      return {
        textShadow: `0 0 16px ${color}, 0 0 34px ${color}88`,
        scaleBoost: 1,
      };
    case "scale":
      return { scaleBoost: 1.15 };
    default:
      return NO_EMPHASIS;
  }
}
