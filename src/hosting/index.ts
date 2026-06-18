export type {
  HostingProvider,
  HostingProviderName,
  VideoHostingInfo,
} from "./base.js";

export { YouTubeHostingProvider, parseYouTubeId } from "./youtube.js";
export { VimeoHostingProvider, parseVimeoId } from "./vimeo.js";
export {
  detectHostingProvider,
  listHostingProviders,
  resolveVideoUrl,
} from "./registry.js";
