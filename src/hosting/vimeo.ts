/**
 * Vimeo URL parsing and optional API enrichment.
 */

import type { HostingProvider, VideoHostingInfo } from "./base.js";

const VIMEO_ID = /vimeo\.com\/(?:video\/)?(\d+)/;

export function parseVimeoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("vimeo.com")) return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const videoIdx = parts.indexOf("video");
    const id =
      videoIdx >= 0 ? parts[videoIdx + 1] : parts[parts.length - 1];
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    const match = url.match(VIMEO_ID);
    return match?.[1] ?? null;
  }
}

function baseInfo(videoId: string): VideoHostingInfo {
  const canonicalUrl = `https://vimeo.com/${videoId}`;
  return {
    provider: "vimeo",
    videoId,
    canonicalUrl,
    embedUrl: `https://player.vimeo.com/video/${videoId}`,
  };
}

async function enrichWithApi(
  info: VideoHostingInfo,
  accessToken: string
): Promise<VideoHostingInfo> {
  const res = await fetch(`https://api.vimeo.com/videos/${info.videoId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return info;

  const data = (await res.json()) as {
    name?: string;
    description?: string;
    duration?: number;
    link?: string;
    pictures?: { sizes?: Array<{ link?: string; width?: number }> };
    user?: { name?: string };
  };

  const thumb = data.pictures?.sizes
    ?.filter((s) => (s.width ?? 0) >= 640)
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.link;

  return {
    ...info,
    title: data.name,
    description: data.description,
    author: data.user?.name,
    durationMs: data.duration ? data.duration * 1000 : undefined,
    canonicalUrl: data.link ?? info.canonicalUrl,
    thumbnailUrl: thumb,
  };
}

export class VimeoHostingProvider implements HostingProvider {
  readonly name = "vimeo" as const;

  canResolve(url: string): boolean {
    return parseVimeoId(url) !== null;
  }

  async resolve(url: string): Promise<VideoHostingInfo> {
    const videoId = parseVimeoId(url);
    if (!videoId) {
      throw new Error("Not a valid Vimeo URL");
    }

    let info = baseInfo(videoId);
    const token = process.env.VIMEO_ACCESS_TOKEN;
    if (token) {
      info = await enrichWithApi(info, token);
    }
    return info;
  }
}
