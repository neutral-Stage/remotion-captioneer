/**
 * Registry of video hosting providers.
 */

import type { HostingProvider, HostingProviderName, VideoHostingInfo } from "./base.js";
import { YouTubeHostingProvider } from "./youtube.js";
import { VimeoHostingProvider } from "./vimeo.js";

const providers: HostingProvider[] = [
  new YouTubeHostingProvider(),
  new VimeoHostingProvider(),
];

export function listHostingProviders(): HostingProviderName[] {
  return providers.map((p) => p.name);
}

export function detectHostingProvider(url: string): HostingProvider | null {
  return providers.find((p) => p.canResolve(url)) ?? null;
}

export async function resolveVideoUrl(url: string): Promise<VideoHostingInfo> {
  const provider = detectHostingProvider(url);
  if (!provider) {
    throw new Error(
      "Unsupported video URL. Supported hosts: YouTube, Vimeo."
    );
  }
  return provider.resolve(url);
}
