// Example 5: Layout Primitives
// Use composable layout components for custom designs

import { AbsoluteFill } from "remotion";
import {
  AnimatedCaptions,
  Stack,
  Row,
  Center,
  FadeIn,
  SlideUp,
  GradientBg,
  Positioned,
} from "remotion-captioneer";
import captions from "./captions.json";

export const CustomLayout = () => (
  <GradientBg from="#0a0a0a" to="#1a1a2e">
    {/* Top section — logo and title */}
    <Positioned top={40} left={40}>
      <FadeIn delayMs={0}>
        <Row gap={12}>
          <img src="/logo.png" style={{ width: 40, height: 40 }} />
          <span style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}>
            My Channel
          </span>
        </Row>
      </FadeIn>
    </Positioned>

    {/* Center content */}
    <Center>
      <Stack gap={24}>
        <FadeIn delayMs={200}>
          <div style={{ color: "#888", fontSize: 18 }}>NOW PLAYING</div>
        </FadeIn>
        <SlideUp delayMs={400}>
          <div style={{ color: "#fff", fontSize: 42, fontWeight: 700 }}>
            Episode Title
          </div>
        </SlideUp>
      </Stack>
    </Center>

    {/* Captions at bottom */}
    <AnimatedCaptions
      captions={captions}
      style="karaoke"
      highlightColor="#FF6B6B"
      position="bottom"
    />

    {/* Bottom bar */}
    <Positioned bottom={20} left={40} right={40}>
      <FadeIn delayMs={600}>
        <Row justify="space-between">
          <span style={{ color: "#666", fontSize: 14 }}>Season 1 · Episode 1</span>
          <span style={{ color: "#666", fontSize: 14 }}>@mychannel</span>
        </Row>
      </FadeIn>
    </Positioned>
  </GradientBg>
);
