/**
 * Remotion Player bundle for Captioneer preview.
 */
import React, { useRef, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Player, type PlayerRef } from "@remotion/player";
import { AbsoluteFill } from "remotion";
import { AnimatedCaptions } from "../components/AnimatedCaptions.js";
import type { CaptionData, CaptionStyle } from "../types.js";

const FPS = 30;

interface PreviewProps {
  readonly captions: CaptionData;
  readonly style: CaptionStyle;
  readonly fontSize?: number;
  readonly fontColor?: string;
  readonly highlightColor?: string;
  readonly position?: "top" | "center" | "bottom";
  readonly wordsPerLine?: number;
  readonly useSmartWrap?: boolean;
}

const PreviewComposition: React.FC<PreviewProps> = ({
  captions,
  style,
  fontSize = 56,
  fontColor = "rgba(255,255,255,0.5)",
  highlightColor = "#3b82f6",
  position = "bottom",
  wordsPerLine,
  useSmartWrap = false,
}) => (
  <AbsoluteFill style={{ backgroundColor: "#09090b" }}>
    <AnimatedCaptions
      captions={captions}
      style={style}
      fontSize={fontSize}
      fontColor={fontColor}
      highlightColor={highlightColor}
      position={position}
      wordsPerLine={wordsPerLine || undefined}
      useSmartWrap={useSmartWrap}
    />
  </AbsoluteFill>
);

function durationFrames(captions: CaptionData | null | undefined): number {
  const ms = captions?.durationMs ?? 8000;
  return Math.max(30, Math.ceil((ms / 1000) * FPS));
}

let root: ReturnType<typeof createRoot> | null = null;
let playerRef: PlayerRef | null = null;

const PlayerShell: React.FC<{ readonly options: PreviewProps }> = ({ options }) => {
  const ref = useRef<PlayerRef>(null);
  useEffect(() => {
    playerRef = ref.current;
  }, []);
  return (
    <Player
      ref={ref}
      acknowledgeRemotionLicense
      autoPlay={false}
      clickToPlay={false}
      component={PreviewComposition as unknown as React.FC<Record<string, unknown>>}
      compositionHeight={1080}
      compositionWidth={1920}
      controls={false}
      durationInFrames={durationFrames(options.captions)}
      fps={FPS}
      inputProps={options as unknown as Record<string, unknown>}
      loop={false}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

declare global {
  interface Window {
    mountCaptioneerPlayer: (
      _mountEl: HTMLElement,
      _options: PreviewProps
    ) => void;
    captioneerSeekTo: (_ms: number) => void;
    captioneerPlay: () => void;
    captioneerPause: () => void;
    unmountCaptioneerPlayer: () => void;
  }
}

window.mountCaptioneerPlayer = (mountEl, options) => {
  if (!options.captions?.segments?.length) return;
  if (!root) root = createRoot(mountEl);
  root.render(<PlayerShell options={options} />);
};

window.captioneerSeekTo = (ms: number) => {
  const frame = Math.floor((ms / 1000) * FPS);
  playerRef?.seekTo(frame);
};

window.captioneerPlay = () => {
  playerRef?.play();
};

window.captioneerPause = () => {
  playerRef?.pause();
};

window.unmountCaptioneerPlayer = () => {
  if (root) {
    root.unmount();
    root = null;
    playerRef = null;
  }
};
