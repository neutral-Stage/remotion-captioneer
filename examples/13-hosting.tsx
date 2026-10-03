// Example 13: Resolve YouTube / Vimeo URLs to metadata (Node)
// Use remotion-captioneer/node — optional YOUTUBE_API_KEY enriches title/duration.

import { resolveVideoUrl, listHostingProviders } from "remotion-captioneer/node";

export async function resolveHostingExample(url: string) {
  const providers = listHostingProviders();
  console.log(
    "Supported:",
    providers.map((p) => p.name).join(", ")
  );

  const info = await resolveVideoUrl(url);
  return {
    provider: info.provider,
    videoId: info.videoId,
    title: info.title,
    thumbnailUrl: info.thumbnailUrl,
    canonicalUrl: info.canonicalUrl,
    embedUrl: info.embedUrl,
  };
}

// CLI: npx captioneer hosting resolve "https://youtu.be/dQw4w9WgXcQ"
