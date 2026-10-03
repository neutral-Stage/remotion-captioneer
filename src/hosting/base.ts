/**
 * Video hosting provider interface — resolve public video URLs to metadata.
 */

export type HostingProviderName = "youtube" | "vimeo";

export interface VideoHostingInfo {
  provider: HostingProviderName | "unknown";
  videoId: string;
  canonicalUrl: string;
  title?: string;
  description?: string;
  durationMs?: number;
  thumbnailUrl?: string;
  embedUrl?: string;
  author?: string;
}

export interface HostingProvider {
  readonly name: HostingProviderName;
  canResolve(url: string): boolean;
  resolve(url: string): Promise<VideoHostingInfo>;
}
