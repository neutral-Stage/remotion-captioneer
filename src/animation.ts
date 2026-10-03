/**
 * Custom word animations — installable motion as data.
 *
 * A style package can ship an `animation` spec: a handful of keyframes
 * (scale / opacity / yOffset / color over the word's spoken progress).
 * Everything is numeric or a strict hex color, so packages stay inert data —
 * no code execution, no CSS injection surface.
 */

const HEX_COLOR = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
const MAX_KEYFRAMES = 32;

export interface WordKeyframe {
  /** Word progress (0 = word start, 1 = word end) at which this applies */
  at: number;
  /** Uniform scale multiplier (0.05–10) */
  scale?: number;
  /** Opacity 0–1 */
  opacity?: number;
  /** Vertical pixel offset (-500–500) */
  yOffset?: number;
  /** Text color, #RRGGBB or #RRGGBBAA only */
  color?: string;
}

export type AnimationEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out";

export interface AnimationSpec {
  /** Share of the word's spoken duration the keyframes span (0.05–1, default 1) */
  duration?: number;
  easing?: AnimationEasing;
  keyframes: WordKeyframe[];
}

const EASINGS: Record<AnimationEasing, (t: number) => number> = {
  linear: (t) => t,
  "ease-in": (t) => t * t,
  "ease-out": (t) => 1 - (1 - t) * (1 - t),
  "ease-in-out": (t) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)),
};

function boundedNumber(
  value: unknown,
  min: number,
  max: number,
  field: string
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Animation keyframe ${field} must be a finite number`);
  }
  if (value < min || value > max) {
    throw new Error(`Animation keyframe ${field} must be between ${min} and ${max}`);
  }
  return value;
}

/**
 * Validate an untrusted animation spec. Throws with a precise message on any
 * violation; returns a normalized copy.
 */
export function validateAnimationSpec(raw: unknown): AnimationSpec {
  if (!raw || typeof raw !== "object") {
    throw new Error("Animation must be an object");
  }
  const spec = raw as Record<string, unknown>;

  const frames = spec.keyframes;
  if (!Array.isArray(frames) || frames.length < 1 || frames.length > MAX_KEYFRAMES) {
    throw new Error(`Animation keyframes must contain 1–${MAX_KEYFRAMES} entries`);
  }

  let previousAt = -1;
  const keyframes = frames.map((frame, i) => {
    if (!frame || typeof frame !== "object") {
      throw new Error(`Animation keyframe ${i} must be an object`);
    }
    const f = frame as Record<string, unknown>;
    if (typeof f.at !== "number" || !Number.isFinite(f.at)) {
      throw new Error(`Animation keyframe ${i} "at" must be a number (0–1)`);
    }
    const at = boundedNumber(f.at, 0, 1, `${i}.at`);
    if (at <= previousAt) {
      throw new Error(`Animation keyframe ${i} "at" must be greater than the previous`);
    }
    previousAt = at;

    const out: WordKeyframe = { at };
    if (f.scale !== undefined) out.scale = boundedNumber(f.scale, 0.05, 10, `${i}.scale`);
    if (f.opacity !== undefined) out.opacity = boundedNumber(f.opacity, 0, 1, `${i}.opacity`);
    if (f.yOffset !== undefined) out.yOffset = boundedNumber(f.yOffset, -500, 500, `${i}.yOffset`);
    if (f.color !== undefined) {
      if (typeof f.color !== "string" || !HEX_COLOR.test(f.color)) {
        throw new Error(
          `Animation keyframe ${i} "color" must be #RRGGBB or #RRGGBBAA`
        );
      }
      out.color = f.color.toLowerCase();
    }
    if (out.scale === undefined && out.opacity === undefined && out.yOffset === undefined && out.color === undefined) {
      throw new Error(`Animation keyframe ${i} must set scale, opacity, yOffset, or color`);
    }
    return out;
  });

  let duration = 1;
  if (spec.duration !== undefined) {
    duration = boundedNumber(spec.duration, 0.05, 1, "duration");
  }

  let easing: AnimationEasing = "linear";
  if (spec.easing !== undefined) {
    if (
      spec.easing !== "linear" &&
      spec.easing !== "ease-in" &&
      spec.easing !== "ease-out" &&
      spec.easing !== "ease-in-out"
    ) {
      throw new Error('Animation easing must be linear, ease-in, ease-out, or ease-in-out');
    }
    easing = spec.easing;
  }

  return { duration, easing, keyframes };
}

export interface ResolvedKeyframe {
  scale: number;
  opacity: number;
  yOffset: number;
  color?: string;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpHex = (a: string, b: string, t: number): string => {
  const parse = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const mix = (x: number, y: number): string =>
    Math.round(lerp(x, y, t)).toString(16).padStart(2, "0");
  return `#${mix(r1, r2)}${mix(g1, g2)}${mix(b1, b2)}`;
};

const keyframeState = (frame: WordKeyframe): ResolvedKeyframe => ({
  scale: frame.scale ?? 1,
  opacity: frame.opacity ?? 1,
  yOffset: frame.yOffset ?? 0,
  color: frame.color,
});

/**
 * Sample the animation at word progress `p` (0–1). Clamps outside the
 * keyframe range: before the first keyframe holds its state, after the last
 * holds the final state. Easing is applied between neighboring keyframes.
 */
export function sampleAnimation(spec: AnimationSpec, p: number): ResolvedKeyframe {
  const span = spec.duration ?? 1;
  const frames = spec.keyframes;
  const first = frames[0]!;
  const last = frames[frames.length - 1]!;

  // Map word progress onto the animated window, then clamp.
  const t = Math.min(1, Math.max(0, p / span));
  if (t <= first.at) return keyframeState(first);
  if (t >= last.at) return keyframeState(last);

  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i]!;
    const b = frames[i + 1]!;
    if (t >= a.at && t <= b.at) {
      const raw = b.at === a.at ? 1 : (t - a.at) / (b.at - a.at);
      const eased = EASINGS[spec.easing ?? "linear"](raw);
      const stateA = keyframeState(a);
      const stateB = keyframeState(b);
      return {
        scale: lerp(stateA.scale, stateB.scale, eased),
        opacity: lerp(stateA.opacity, stateB.opacity, eased),
        yOffset: lerp(stateA.yOffset, stateB.yOffset, eased),
        color:
          stateA.color && stateB.color
            ? lerpHex(stateA.color, stateB.color, eased)
            : stateB.color ?? stateA.color,
      };
    }
  }
  return keyframeState(last);
}
