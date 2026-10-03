/**
 * YouTube URL parsing and optional Data API enrichment.
 */

import type { HostingProvider, VideoHostingInfo } from "./base.js";

const YOUTUBE_ID =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function parseYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      return id && id.length === 11 ? id : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const fromQuery = parsed.searchParams.get("v");
      if (fromQuery && fromQuery.length === 11) return fromQuery;
      const parts = parsed.pathname.split("/").filter(Boolean);
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1]!;
      const shortsIdx = parts.indexOf("shorts");
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1]!;
    }
    const match = url.match(YOUTUBE_ID);
    return match?.[1] ?? null;
  } catch {
    const match = url.match(YOUTUBE_ID);
    return match?.[1] ?? null;
  }
}

function baseInfo(videoId: string): VideoHostingInfo {
  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  return {
    provider: "youtube",
    videoId,
    canonicalUrl,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
  };
}

async function enrichWithApi(
  info: VideoHostingInfo,
  apiKey: string
): Promise<VideoHostingInfo> {
  const params = new URLSearchParams({
    id: info.videoId,
    key: apiKey,
    part: "snippet,contentDetails",
  });
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params}`
  );
  if (!res.ok) return info;

  const data = (await res.json()) as {
    items?: Array<{
      snippet?: { title?: string; description?: string; channelTitle?: string };
      contentDetails?: { duration?: string };
    }>;
  };
  const item = data.items?.[0];
  if (!item) return info;

  return {
    ...info,
    title: item.snippet?.title,
    description: item.snippet?.description,
    author: item.snippet?.channelTitle,
    durationMs: parseIso8601Duration(item.contentDetails?.duration),
  };
}

function parseIso8601Duration(iso?: string): number | undefined {
  if (!iso) return undefined;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

export class YouTubeHostingProvider implements HostingProvider {
  readonly name = "youtube" as const;

  canResolve(url: string): boolean {
    return parseYouTubeId(url) !== null;
  }

  async resolve(url: string): Promise<VideoHostingInfo> {
    const videoId = parseYouTubeId(url);
    if (!videoId) {
      throw new Error("Not a valid YouTube URL");
    }

    let info = baseInfo(videoId);
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      info = await enrichWithApi(info, apiKey);
    }
    return info;
  }
}
