/**
 * Real-time Preview Server — serves dist/preview/ + STT API
 *
 * Dev-only: binds localhost by default. Do not expose on untrusted networks.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { existsSync, readFileSync } from "fs";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type { CaptionPreset } from "./presets/index.js";
import { getAllPresets, getMarketplacePresets } from "./marketplace/registry.js";
import { transcribeMediaFile } from "./transcribe-media.js";
import { analyzeAudio } from "./sync/audio-analysis.js";
import { loadConfig, resolveDefaultStyle } from "./config.js";
import { resolveVideoUrl } from "./hosting/index.js";
import { parseProcessHeaders } from "./preview/headers.js";
import { createTempUploadPath } from "./preview/temp-path.js";
import {
  readRequestBody,
  RequestBodyTooLargeError,
} from "./preview/request-body.js";
import {
  getStaticMime,
  resolvePreviewStaticPath,
} from "./preview/static-path.js";

const DEFAULT_PORT = 3456;
const DEFAULT_HOST = "127.0.0.1";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = join(__dirname, "preview");

export interface PreviewServerOptions {
  port?: number;
  host?: string;
}

function readUiMeta(): string {
  const paths = [
    join(PREVIEW_DIR, "ui-meta.json"),
    join(__dirname, "../docs/ui-meta.json"),
    join(__dirname, "../src/generated/ui-meta.json"),
  ];
  for (const p of paths) {
    if (existsSync(p)) return readFileSync(p, "utf8");
  }
  return JSON.stringify({ styles: [], presets: [] });
}

interface UiMetaPreset {
  key: string;
  name: string;
  description: string;
  style: string;
  highlightColor: string;
  fontColor: string;
  fontSize: number;
  position: string;
  category: string;
  marketplace?: boolean;
}

function buildMetaWithMarketplace(): string {
  const base = JSON.parse(readUiMeta()) as {
    styles: unknown[];
    presets: UiMetaPreset[];
    presetCount?: number;
    styleCount?: number;
    categories?: Record<string, string[]>;
    generatedAt?: string;
    marketplacePresetCount?: number;
  };

  const existingKeys = new Set((base.presets ?? []).map((p) => p.key));
  const marketplacePresets: UiMetaPreset[] = Object.entries(
    getMarketplacePresets()
  )
    .filter(([key]) => !existingKeys.has(key))
    .map(([key, p]: [string, CaptionPreset]) => ({
    key,
    name: `${p.name} (installed)`,
    description: p.description,
    style: p.style,
    highlightColor: p.highlightColor,
    fontColor: p.fontColor,
    fontSize: p.fontSize,
    position: p.position,
    category: "Marketplace",
    marketplace: true,
  }));

  const allPresets = [...(base.presets ?? []), ...marketplacePresets];
  const marketplacePresetCount = allPresets.filter(
    (p) => p.marketplace === true || p.key.startsWith("marketplace:")
  ).length;

  return JSON.stringify({
    ...base,
    presets: allPresets,
    presetCount: allPresets.length,
    marketplacePresetCount,
  });
}

function buildPresetPayload(): Record<
  string,
  { name: string; style: string; highlightColor: string }
> {
  const out: Record<string, { name: string; style: string; highlightColor: string }> = {};
  for (const [key, p] of Object.entries(getAllPresets())) {
    out[key] = { name: p.name, style: p.style, highlightColor: p.highlightColor };
  }
  return out;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  if (!res.headersSent) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  }
}

function logApiError(route: string, e: unknown): void {
  console.error(`Preview ${route} failed:`, e);
}

async function handleAnalyze(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readRequestBody(req);
    const tmpPath = createTempUploadPath("captioneer-analyze");
    await writeFile(tmpPath, body);
    try {
      const analysis = await analyzeAudio(tmpPath);
      sendJson(res, 200, analysis);
    } finally {
      await unlink(tmpPath).catch(() => undefined);
    }
  } catch (e: unknown) {
    if (e instanceof RequestBodyTooLargeError) {
      sendJson(res, 413, { error: "Upload too large" });
      return;
    }
    logApiError("/api/analyze", e);
    sendJson(res, 500, { error: "Audio analysis failed" });
  }
}

async function handleProcess(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readRequestBody(req);
    const { diarize, numSpeakers, language } = parseProcessHeaders(req.headers);
    const tmpPath = createTempUploadPath();
    await writeFile(tmpPath, body);
    try {
      const captions = await transcribeMediaFile(tmpPath, {
        onProgress: (m) => console.log(`   ${m}`),
        diarize,
        numSpeakers,
        language,
      });
      sendJson(res, 200, captions);
    } finally {
      await unlink(tmpPath).catch(() => undefined);
    }
  } catch (e: unknown) {
    if (e instanceof RequestBodyTooLargeError) {
      sendJson(res, 413, { error: "Upload too large" });
      return;
    }
    logApiError("/api/process", e);
    sendJson(res, 500, { error: "Transcription failed" });
  }
}

function serveStatic(path: string, res: ServerResponse): boolean {
  const filePath = resolvePreviewStaticPath(PREVIEW_DIR, path);
  if (!filePath || !existsSync(filePath)) return false;
  res.writeHead(200, { "Content-Type": getStaticMime(filePath) });
  res.end(readFileSync(filePath));
  return true;
}

/**
 * Start the preview server (localhost by default).
 */
export function startPreviewServer(options: PreviewServerOptions = {}): void {
  const port = options.port ?? DEFAULT_PORT;
  const host = options.host ?? DEFAULT_HOST;

  if (!existsSync(PREVIEW_DIR)) {
    console.warn(
      `Preview bundle not found at ${PREVIEW_DIR}. Run: npm run build:preview`
    );
  }

  const server = createServer((req, res) => {
    const url = req.url?.split("?")[0] ?? "/";

    if (req.method === "POST" && url === "/api/process") {
      handleProcess(req, res).catch((e: unknown) => {
        logApiError("/api/process (unhandled)", e);
        sendJson(res, 500, { error: "Transcription failed" });
      });
      return;
    }

    if (req.method === "POST" && url === "/api/analyze") {
      handleAnalyze(req, res).catch((e: unknown) => {
        logApiError("/api/analyze (unhandled)", e);
        sendJson(res, 500, { error: "Audio analysis failed" });
      });
      return;
    }

    if (req.method === "GET" && url === "/api/presets") {
      sendJson(res, 200, buildPresetPayload());
      return;
    }

    if (req.method === "GET" && url === "/api/styles") {
      sendJson(res, 200, buildPresetPayload());
      return;
    }

    if (req.method === "GET" && url.startsWith("/api/hosting/resolve")) {
      const query = new URL(req.url ?? "", "http://localhost").searchParams;
      const videoUrl = query.get("url");
      if (!videoUrl) {
        sendJson(res, 400, { error: "Missing url query parameter" });
        return;
      }
      resolveVideoUrl(videoUrl)
        .then((info) => {
          sendJson(res, 200, info);
        })
        .catch((e: unknown) => {
          logApiError("/api/hosting/resolve", e);
          sendJson(res, 400, { error: "Failed to resolve video URL" });
        });
      return;
    }

    if (req.method === "GET" && url === "/api/meta") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(buildMetaWithMarketplace());
      return;
    }

    if (req.method === "GET" && url === "/api/config") {
      loadConfig()
        .then((config) => {
          sendJson(res, 200, {
            defaultStyle: resolveDefaultStyle(config),
            defaultProvider: config?.defaultProvider ?? null,
            defaultLanguage: config?.defaultLanguage ?? null,
          });
        })
        .catch((e: unknown) => {
          logApiError("/api/config", e);
          sendJson(res, 500, { error: "Config load failed" });
        });
      return;
    }

    if (req.method === "GET") {
      const staticPath = url === "/" ? "/" : url.replace(/^\//, "");
      if (serveStatic(staticPath, res)) return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  server.listen(port, host, () => {
    console.log(`\nCaptioneer preview server (dev only)`);
    console.log(`   Local: http://${host}:${port}\n`);
    console.log(`   Upload audio (STT) or caption JSON.\n`);
    if (host !== "127.0.0.1" && host !== "localhost") {
      console.warn(`   Warning: listening on ${host} — do not expose on untrusted networks.\n`);
    }
  });
}

// Re-export for tests
export { resolvePreviewStaticPath } from "./preview/static-path.js";
