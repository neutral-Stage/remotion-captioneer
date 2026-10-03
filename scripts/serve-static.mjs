#!/usr/bin/env node
/**
 * Minimal static file server for Playwright docs smoke tests.
 * Usage: node scripts/serve-static.mjs <directory> <port>
 */
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname, resolve, relative } from "path";

const root = resolve(process.argv[2] ?? "docs");
const port = Number(process.argv[3] ?? 3460);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = createServer((req, res) => {
  const url = req.url?.split("?")[0] ?? "/";
  const rel = url === "/" ? "index.html" : url.replace(/^\//, "");
  const filePath = resolve(root, rel);
  const relPath = relative(root, filePath);
  if (relPath.startsWith("..") || !existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const ext = extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
  res.end(readFileSync(filePath));
});

server.listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}`);
});
