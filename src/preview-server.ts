/**
 * Real-time Preview Server — serves dist/preview/ + STT API
 */

import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { existsSync, readFileSync } from "fs";
import { writeFile, unlink } from "fs/promises";
import { join, extname, resolve, relative } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getAllPresets } from "./marketplace/registry.js";
import { transcribeMediaFile } from "./transcribe-media.js";
import { analyzeAudio } from "./sync/audio-analysis.js";
import { loadConfig, resolveDefaultStyle } from "./config.js";
import { resolveVideoUrl } from "./hosting/index.js";
import { parseProcessHeaders } from "./preview/headers.js";
import { createTempUploadPath } from "./preview/temp-path.js";

const PORT = 3456;

const __dirname = dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = join(__dirname, "preview");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

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

async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function handleAnalyze(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readRequestBody(req);
    const tmpPath = createTempUploadPath("captioneer-analyze");
    await writeFile(tmpPath, body);
    try {
      const analysis = await analyzeAudio(tmpPath);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(analysis));
    } finally {
      await unlink(tmpPath).catch(() => undefined);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Audio analysis failed";
    console.error("Preview /api/analyze failed:", e);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: msg }));
  }
}

async function handleProcess(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readRequestBody(req);
    const { diarize, numSpeakers } = parseProcessHeaders(req.headers);
    const tmpPath = createTempUploadPath();
    await writeFile(tmpPath, body);
    try {
      const captions = await transcribeMediaFile(tmpPath, {
        onProgress: (m) => console.log(`   ${m}`),
        diarize,
        numSpeakers,
        language: typeof req.headers["x-language"] === "string" ? req.headers["x-language"] : undefined,
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(captions));
    } finally {
      await unlink(tmpPath).catch(() => undefined);
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Transcription failed";
    console.error("Preview /api/process failed:", e);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: msg }));
  }
}

function resolvePreviewStaticPath(requestPath: string): string | null {
  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\//, "");
  if (!relativePath || relativePath.includes("\0")) return null;
  const resolvedRoot = resolve(PREVIEW_DIR);
  const resolvedFile = resolve(PREVIEW_DIR, relativePath);
  const rel = relative(resolvedRoot, resolvedFile);
  if (rel.startsWith("..") || resolve(resolvedRoot, rel) !== resolvedFile) {
    return null;
  }
  return resolvedFile;
}

function serveStatic(path: string, res: ServerResponse): boolean {
  const filePath = resolvePreviewStaticPath(path);
  if (!filePath || !existsSync(filePath)) return false;
  const ext = extname(filePath);
  const type = MIME[ext] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  res.end(readFileSync(filePath));
  return true;
}

/**
 * Start the preview server
 */
export function startPreviewServer(port: number = PORT): void {
  if (!existsSync(PREVIEW_DIR)) {
    console.warn(
      `Preview bundle not found at ${PREVIEW_DIR}. Run: npm run build:preview`
    );
  }

  const server = createServer((req, res) => {
    const url = req.url?.split("?")[0] ?? "/";

    if (req.method === "POST" && url === "/api/process") {
      handleProcess(req, res).catch((e: unknown) => {
        console.error("Unhandled /api/process error:", e);
      });
      return;
    }

    if (req.method === "POST" && url === "/api/analyze") {
      handleAnalyze(req, res).catch((e: unknown) => {
        console.error("Unhandled /api/analyze error:", e);
      });
      return;
    }

    if (req.method === "GET" && url === "/api/presets") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(buildPresetPayload()));
      return;
    }

    if (req.method === "GET" && url === "/api/styles") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(buildPresetPayload()));
      return;
    }

    if (req.method === "GET" && url.startsWith("/api/hosting/resolve")) {
      const query = new URL(req.url ?? "", "http://localhost").searchParams;
      const videoUrl = query.get("url");
      if (!videoUrl) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing url query parameter" }));
        return;
      }
      resolveVideoUrl(videoUrl)
        .then((info) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(info));
        })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : "Failed to resolve video URL";
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: msg }));
        });
      return;
    }

    if (req.method === "GET" && url === "/api/meta") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(readUiMeta());
      return;
    }

    if (req.method === "GET" && url === "/api/config") {
      loadConfig()
        .then((config) => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              defaultStyle: resolveDefaultStyle(config),
              defaultProvider: config?.defaultProvider ?? null,
              defaultLanguage: config?.defaultLanguage ?? null,
            })
          );
        })
        .catch((e: unknown) => {
          console.error("Preview /api/config failed:", e);
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Config load failed" }));
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

  server.listen(port, () => {
    console.log(`\nCaptioneer preview server`);
    console.log(`   Local: http://localhost:${port}\n`);
    console.log(`   Upload audio (STT) or caption JSON.\n`);
  });
}
