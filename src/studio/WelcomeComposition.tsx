/**
 * Welcome composition — Studio entry point
 */
import React from "react";
import { AbsoluteFill } from "remotion";

export const WelcomeComposition: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#09090b",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        color: "#fafafa",
        padding: 80,
        justifyContent: "center",
      }}
    >
      <h1 style={{ fontSize: 56, fontWeight: 600, letterSpacing: "-0.03em", marginBottom: 24 }}>
        Captioneer
      </h1>
      <p style={{ fontSize: 24, color: "#a1a1aa", maxWidth: 720, lineHeight: 1.5, marginBottom: 32 }}>
        14 animated caption styles for Remotion. Start with <strong style={{ color: "#3b82f6" }}>StyleGallery</strong>{" "}
        or pick any style composition in the sidebar.
      </p>
      <ul style={{ fontSize: 18, color: "#71717a", lineHeight: 2, listStyle: "none" }}>
        <li>→ StyleGallery — all 14 styles in one timeline</li>
        <li>→ PresetShowcase — curated platform presets</li>
        <li>→ Run <code style={{ color: "#86efac" }}>npx captioneer preview</code> for upload + STT</li>
      </ul>
    </AbsoluteFill>
  );
};
