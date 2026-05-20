/**
 * Real-time Preview Server
 *
 * Starts a local HTTP server that previews caption styles in real-time.
 * Upload audio and see captions render instantly.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { existsSync } from "fs";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { basename, join } from "path";
import { presets } from "./presets/index.js";
import { transcribeMediaFile } from "./transcribe-media.js";
import { CAPTION_STYLES, styleToCompositionId } from "./caption-styles.js";
import type { CaptionStyle } from "./types.js";

const PORT = 3456;

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Captioneer Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    :root {
      --bg: #09090b;
      --surface: #111113;
      --surface-2: #18181b;
      --border: #27272a;
      --text: #fafafa;
      --muted: #a1a1aa;
      --accent: #3b82f6;
      --accent-muted: rgba(59, 130, 246, 0.15);
    }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
    }
    .header {
      padding: 20px 28px;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--surface);
    }
    .header h1 { font-size: 1.125rem; font-weight: 600; letter-spacing: -0.02em; }
    .header h1 span { color: var(--muted); font-weight: 500; }
    .controls {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .controls select, .controls button {
      padding: 8px 14px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      font-family: inherit;
      font-size: 0.875rem;
      cursor: pointer;
    }
    .controls button.primary {
      background: var(--accent);
      color: #fff;
      border-color: transparent;
      font-weight: 500;
    }
    .controls button:hover { border-color: #3f3f46; }
    .controls button.primary:hover { background: #2563eb; }
    .main {
      display: grid;
      grid-template-columns: 1fr 300px;
      height: calc(100vh - 65px);
    }
    .preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      background: var(--bg);
    }
    .video-frame {
      width: 80%;
      max-width: 960px;
      aspect-ratio: 16/9;
      background: #000;
      border-radius: 12px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .caption-line {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 10px;
      justify-content: center;
      align-items: baseline;
      padding: 20px;
      max-width: 90%;
    }
    .word {
      font-size: 2.5rem;
      font-weight: 700;
      display: inline-block;
      transition: all 0.15s ease;
    }
    .word-inactive { color: rgba(255,255,255,0.38); }
    .word-active { color: #fafafa; transform: scale(1.02); }
    .word-past { color: rgba(255,255,255,0.72); }
    .sidebar {
      border-left: 1px solid var(--border);
      padding: 20px;
      overflow-y: auto;
      background: var(--surface);
    }
    .sidebar h3 {
      font-size: 0.75rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      color: var(--muted);
      margin-bottom: 12px;
    }
    .json-output {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      font-family: ui-monospace, "Cascadia Code", Menlo, monospace;
      font-size: 0.75rem;
      color: var(--muted);
      max-height: 300px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 20px;
    }
    .stat {
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
    }
    .stat-label { font-size: 0.75rem; color: var(--muted); }
    .stat-value { font-size: 1.125rem; font-weight: 600; color: var(--text); }
    .upload-zone {
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      margin-bottom: 20px;
    }
    .upload-zone:hover { border-color: #52525b; background: var(--surface-2); }
    .upload-zone p { color: var(--muted); margin-top: 8px; font-size: 0.875rem; }
    .upload-zone .upload-title { font-size: 0.9375rem; font-weight: 500; }
    .timeline {
      margin-top: 20px;
      height: 40px;
      background: #111;
      border-radius: 8px;
      position: relative;
      overflow: hidden;
    }
    .timeline-progress {
      height: 100%;
      background: var(--accent);
      border-radius: 8px;
      transition: width 0.1s linear;
      opacity: 0.85;
    }
    .timeline-beats {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
    .beat-mark {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: rgba(255,255,255,0.2);
    }
    .audio-controls {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }
    .audio-controls button {
      flex: 1;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #333;
      background: #111;
      color: #e0e0e0;
      cursor: pointer;
      font-family: inherit;
    }
    .audio-controls button.active {
      background: var(--accent-muted);
      border-color: var(--accent);
      color: var(--text);
    }
    .link-studio {
      padding: 8px 14px;
      border-radius: 6px;
      border: 1px solid var(--border);
      color: var(--muted);
      text-decoration: none;
      font-size: 0.875rem;
    }
    .link-studio:hover { color: var(--text); border-color: #3f3f46; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Captioneer <span>Preview</span></h1>
    <div class="controls">
      <select id="style-select">
        <option value="word-highlight">Word Highlight</option>
        <option value="karaoke">Karaoke</option>
        <option value="typewriter">Typewriter</option>
        <option value="bounce">Bounce</option>
        <option value="wave">Wave</option>
        <option value="glow">Glow</option>
        <option value="typewriter-erase">Typewriter Erase</option>
        <option value="pill">Pill</option>
        <option value="flicker">Flicker</option>
        <option value="highlighter">Highlighter</option>
        <option value="blur">Blur</option>
        <option value="rainbow">Rainbow</option>
        <option value="scale">Scale</option>
        <option value="spotlight">Spotlight</option>
      </select>
      <button id="presets-btn" class="primary" title="Cycle presets">Presets</button>
      <a id="studio-link" class="link-studio" href="#" target="_blank" rel="noopener" style="display:none">Open in Studio</a>
    </div>
  </div>
  <div class="main">
    <div class="preview">
      <div class="video-frame" id="video-frame">
        <div class="upload-zone" id="upload-zone">
          <p class="upload-title">Drop audio or caption JSON</p>
          <p>MP3, WAV, M4A, MP4, or caption JSON</p>
          <input type="file" id="file-input" accept="audio/*,video/*,application/json,.json" style="display:none">
        </div>
        <div class="caption-line" id="caption-line" style="display:none"></div>
      </div>
      <div class="timeline" id="timeline-container" style="display:none">
        <div class="timeline-progress" id="timeline-progress"></div>
        <div class="timeline-beats" id="timeline-beats"></div>
      </div>
      <div class="audio-controls" id="audio-controls" style="display:none">
        <button id="play-btn">▶ Play</button>
        <button id="restart-btn">⟲ Restart</button>
        <button id="speed-btn">1x</button>
      </div>
    </div>
    <div class="sidebar">
      <h3>Upload</h3>
      <div class="upload-zone" id="sidebar-upload" style="padding: 20px; margin-bottom: 20px;">
        <p class="upload-title">Upload audio or JSON</p>
        <input type="file" id="sidebar-file-input" accept="audio/*,video/*,application/json,.json" style="display:none">
      </div>
      <h3>Stats</h3>
      <div class="stats">
        <div class="stat">
          <div class="stat-label">Segments</div>
          <div class="stat-value" id="stat-segments">0</div>
        </div>
        <div class="stat">
          <div class="stat-label">Duration</div>
          <div class="stat-value" id="stat-duration">0s</div>
        </div>
        <div class="stat">
          <div class="stat-label">Style</div>
          <div class="stat-value" id="stat-style" style="font-size: 0.9rem">highlight</div>
        </div>
        <div class="stat">
          <div class="stat-label">FPS</div>
          <div class="stat-value">30</div>
        </div>
      </div>
      <h3>Caption Data</h3>
      <div class="json-output" id="json-output">Upload an audio file to generate captions...</div>
    </div>
  </div>
  <audio id="audio-player" style="display:none"></audio>
  <script>
    const uploadZone = document.getElementById('upload-zone');
    const sidebarUpload = document.getElementById('sidebar-upload');
    const fileInput = document.getElementById('file-input');
    const sidebarFileInput = document.getElementById('sidebar-file-input');
    const captionLine = document.getElementById('caption-line');
    const styleSelect = document.getElementById('style-select');
    const audioPlayer = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-btn');
    const restartBtn = document.getElementById('restart-btn');
    const speedBtn = document.getElementById('speed-btn');

    let captions = null;
    let currentStyle = 'word-highlight';
    let animFrame = null;
    const PRESET_LIST = __PRESETS_JSON__;
    const STUDIO_MAP = __STUDIO_MAP__;
    let presetIdx = 0;
    let activeAccent = '#e4e4e7';

    document.getElementById('presets-btn').addEventListener('click', () => {
      const keys = Object.keys(PRESET_LIST);
      if (!keys.length) return;
      presetIdx = (presetIdx + 1) % keys.length;
      const p = PRESET_LIST[keys[presetIdx]];
      activeAccent = p.highlightColor || '#e4e4e7';
      currentStyle = p.style || currentStyle;
      styleSelect.value = currentStyle;
      document.getElementById('stat-style').textContent = keys[presetIdx];
      document.getElementById('presets-btn').textContent = p.name || keys[presetIdx];
      renderCaptions();
    });

    // Upload handlers
    [uploadZone, sidebarUpload].forEach(zone => {
      zone.addEventListener('click', () => {
        const input = zone.querySelector('input[type=file]') || fileInput;
        input.click();
      });
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = '#3b82f6'; });
      zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.style.borderColor = '';
        if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
      });
    });

    fileInput.addEventListener('change', e => { if (e.target.files.length) processFile(e.target.files[0]); });
    sidebarFileInput.addEventListener('change', e => { if (e.target.files.length) processFile(e.target.files[0]); });

    async function processFile(file) {
      document.getElementById('json-output').textContent = 'Processing...';

      const isJson =
        file.name.toLowerCase().endsWith('.json') ||
        file.type === 'application/json';

      if (isJson) {
        try {
          const text = await file.text();
          captions = JSON.parse(text);
          if (!captions || !Array.isArray(captions.segments)) {
            throw new Error('Expected { segments: [...] }');
          }
          audioPlayer.removeAttribute('src');
        } catch (err) {
          document.getElementById('json-output').textContent =
            'Invalid caption JSON. Check file format.';
          return;
        }
      } else {
        const url = URL.createObjectURL(file);
        audioPlayer.src = url;
        document.getElementById('json-output').textContent = 'Transcribing via STT (set API keys or use local whisper)...';
        try {
          const res = await fetch('/api/process', {
            method: 'POST',
            headers: {
              'X-Filename': file.name,
              'Content-Type': file.type || 'application/octet-stream'
            },
            body: file
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || res.statusText);
          captions = data;
        } catch (err) {
          document.getElementById('json-output').textContent =
            'Transcribe failed: ' + (err.message || err) + ' — using demo timings.';
          captions = generateDemoCaptions(file.name);
        }
      }

      // Update UI
      uploadZone.style.display = 'none';
      captionLine.style.display = 'flex';
      document.getElementById('timeline-container').style.display = 'block';
      document.getElementById('audio-controls').style.display = 'flex';

      document.getElementById('stat-segments').textContent = captions.segments.length;
      document.getElementById('stat-duration').textContent = (captions.durationMs / 1000).toFixed(1) + 's';
      document.getElementById('json-output').textContent = JSON.stringify(captions, null, 2);

      renderCaptions();
    }

    function generateDemoCaptions(filename) {
      const words = "Welcome to Captioneer Preview this is a demo of the word highlight style".split(' ');
      const segments = [];
      let time = 0;
      for (let i = 0; i < words.length; i += 5) {
        const chunk = words.slice(i, i + 5);
        const segWords = chunk.map((w, j) => ({
          word: w,
          startMs: time + j * 600,
          endMs: time + (j + 1) * 600,
          confidence: 0.95
        }));
        segments.push({
          text: chunk.join(' '),
          startMs: segWords[0].startMs,
          endMs: segWords[segWords.length - 1].endMs,
          words: segWords
        });
        time += chunk.length * 600 + 200;
      }
      return { segments, language: 'en', durationMs: time };
    }

    styleSelect.addEventListener('change', e => {
      currentStyle = e.target.value;
      document.getElementById('stat-style').textContent = currentStyle;
      const studio = document.getElementById('studio-link');
      studio.style.display = 'inline-block';
      studio.href = 'http://localhost:3000/' + (STUDIO_MAP[currentStyle] || 'WordHighlightDemo');
      renderCaptions();
    });

    function renderCaptions() {
      if (!captions) return;
      captionLine.innerHTML = '';

      const allWords = captions.segments.flatMap(s => s.words);
      allWords.forEach((word, i) => {
        const span = document.createElement('span');
        span.className = 'word word-inactive';
        span.textContent = word.word;
        span.dataset.index = i;
        span.dataset.start = word.startMs;
        span.dataset.end = word.endMs;
        captionLine.appendChild(span);
      });
    }

    // Playback
    playBtn.addEventListener('click', () => {
      if (audioPlayer.paused) {
        audioPlayer.play();
        playBtn.textContent = '⏸ Pause';
        playBtn.classList.add('active');
        startAnimation();
      } else {
        audioPlayer.pause();
        playBtn.textContent = '▶ Play';
        playBtn.classList.remove('active');
        cancelAnimationFrame(animFrame);
      }
    });

    restartBtn.addEventListener('click', () => {
      audioPlayer.currentTime = 0;
      if (audioPlayer.paused) {
        audioPlayer.play();
        playBtn.textContent = '⏸ Pause';
        playBtn.classList.add('active');
        startAnimation();
      }
    });

    let playbackRate = 1;
    speedBtn.addEventListener('click', () => {
      playbackRate = playbackRate === 1 ? 0.5 : playbackRate === 0.5 ? 2 : 1;
      audioPlayer.playbackRate = playbackRate;
      speedBtn.textContent = playbackRate + 'x';
    });

    function startAnimation() {
      function update() {
        if (!captions) return;
        const currentTimeMs = audioPlayer.currentTime * 1000;
        const durationMs = captions.durationMs;

        // Update timeline
        document.getElementById('timeline-progress').style.width =
          (currentTimeMs / durationMs * 100) + '%';

        // Update word styles
        const words = captionLine.querySelectorAll('.word');
        words.forEach(span => {
          const start = parseFloat(span.dataset.start);
          const end = parseFloat(span.dataset.end);
          const isActive = currentTimeMs >= start && currentTimeMs <= end;
          const isPast = currentTimeMs > end;

          span.className = 'word ' + (isActive ? 'word-active' : isPast ? 'word-past' : 'word-inactive');
          if (isActive) {
            span.style.color = activeAccent;
            span.style.textShadow = '0 0 20px ' + activeAccent + '80';
          } else {
            span.style.color = '';
            span.style.textShadow = '';
          }

          if (isActive && currentStyle === 'bounce') {
            span.style.animation = 'none';
            span.offsetHeight;
            span.style.animation = 'bounce 0.5s ease';
          }
        });

        animFrame = requestAnimationFrame(update);
      }
      update();
    }

    audioPlayer.addEventListener('ended', () => {
      playBtn.textContent = '▶ Play';
      playBtn.classList.remove('active');
    });
  </script>
</body>
</html>`;

const STUDIO_COMPOSITION_MAP = Object.fromEntries(
  CAPTION_STYLES.map((s) => [s, styleToCompositionId(s as CaptionStyle)])
) as Record<string, string>;

function buildPresetPayload(): Record<
  string,
  { name: string; style: string; highlightColor: string }
> {
  const out: Record<string, { name: string; style: string; highlightColor: string }> =
    {};
  for (const [key, p] of Object.entries(presets)) {
    out[key] = {
      name: p.name,
      style: p.style,
      highlightColor: p.highlightColor,
    };
  }
  return out;
}

function buildHtml(): string {
  const presetJson = JSON.stringify(buildPresetPayload());
  const studioMap = JSON.stringify(STUDIO_COMPOSITION_MAP);
  return HTML_TEMPLATE.replace("__PRESETS_JSON__", presetJson).replace(
    "__STUDIO_MAP__",
    studioMap
  );
}

async function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function handleProcess(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readRequestBody(req);
    const filename =
      (typeof req.headers["x-filename"] === "string"
        ? req.headers["x-filename"]
        : "upload.bin") || "upload.bin";
    const tmpPath = join(tmpdir(), `captioneer-${Date.now()}-${basename(filename)}`);
    await writeFile(tmpPath, body);
    try {
      const captions = await transcribeMediaFile(tmpPath, {
        onProgress: (m) => console.log(`   ${m}`),
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(captions));
    } finally {
      await unlink(tmpPath).catch(() => undefined);
    }
  } catch (e: unknown) {
    console.error("Preview /api/process failed:", e);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Transcription failed" }));
  }
}

/**
 * Start the preview server
 */
export function startPreviewServer(port: number = PORT): void {
  const html = buildHtml();

  const server = createServer((req, res) => {
    const url = req.url?.split("?")[0] ?? "/";

    if (req.method === "POST" && url === "/api/process") {
      void handleProcess(req, res);
      return;
    }

    if (req.method === "GET" && url === "/api/presets") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(buildPresetPayload()));
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  });

  server.listen(port, () => {
    console.log(`\nCaptioneer preview server`);
    console.log(`   Local: http://localhost:${port}\n`);
    console.log(`   Upload audio (STT) or caption JSON. POST /api/process for transcription.\n`);
  });
}
