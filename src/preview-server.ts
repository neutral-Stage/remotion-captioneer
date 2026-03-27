/**
 * Real-time Preview Server
 *
 * Starts a local HTTP server that previews caption styles in real-time.
 * Upload audio and see captions render instantly.
 */

import { createServer, IncomingMessage, ServerResponse } from "http";
import { readFileSync, existsSync } from "fs";
import { resolve, extname, join } from "path";

const PORT = 3456;

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Captioneer Preview</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      min-height: 100vh;
    }
    .header {
      padding: 24px 32px;
      border-bottom: 1px solid #222;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 { font-size: 1.5rem; font-weight: 700; }
    .header h1 span { color: #FFD700; }
    .controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .controls select, .controls button {
      padding: 8px 16px;
      border-radius: 8px;
      border: 1px solid #333;
      background: #111;
      color: #e0e0e0;
      font-family: inherit;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .controls button { background: #FFD700; color: #000; font-weight: 600; border: none; }
    .controls button:hover { opacity: 0.9; }
    .main {
      display: grid;
      grid-template-columns: 1fr 300px;
      height: calc(100vh - 73px);
    }
    .preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
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
    .word-inactive { color: rgba(255,255,255,0.35); }
    .word-active { color: #FFD700; text-shadow: 0 0 20px rgba(255,215,0,0.4); transform: scale(1.05); }
    .word-past { color: white; }
    .sidebar {
      border-left: 1px solid #222;
      padding: 20px;
      overflow-y: auto;
      background: #0d0d0d;
    }
    .sidebar h3 {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #666;
      margin-bottom: 12px;
    }
    .json-output {
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      padding: 12px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #888;
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
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      padding: 12px;
    }
    .stat-label { font-size: 0.75rem; color: #666; }
    .stat-value { font-size: 1.25rem; font-weight: 700; color: #FFD700; }
    .upload-zone {
      border: 2px dashed #333;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s;
      margin-bottom: 20px;
    }
    .upload-zone:hover { border-color: #FFD700; }
    .upload-zone p { color: #666; margin-top: 8px; }
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
      background: linear-gradient(90deg, #FFD700, #FF6B6B);
      border-radius: 8px;
      transition: width 0.1s linear;
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
    .audio-controls button.active { background: #FFD700; color: #000; border: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1><span>Captioneer</span> Preview</h1>
    <div class="controls">
      <select id="style-select">
        <option value="word-highlight">Word Highlight</option>
        <option value="karaoke">Karaoke</option>
        <option value="typewriter">Typewriter</option>
        <option value="bounce">Bounce</option>
        <option value="wave">Wave</option>
        <option value="glow">Glow</option>
        <option value="pill">Pill</option>
        <option value="flicker">Flicker</option>
        <option value="highlighter">Highlighter</option>
        <option value="blur">Blur</option>
        <option value="rainbow">Rainbow</option>
        <option value="scale">Scale</option>
        <option value="spotlight">Spotlight</option>
      </select>
      <button id="presets-btn">Presets</button>
    </div>
  </div>
  <div class="main">
    <div class="preview">
      <div class="video-frame" id="video-frame">
        <div class="upload-zone" id="upload-zone">
          <div style="font-size: 3rem; margin-bottom: 8px;">🎙️</div>
          <strong>Drop audio file or click to upload</strong>
          <p>MP3, WAV, M4A, MP4, OGG</p>
          <input type="file" id="file-input" accept="audio/*,video/*" style="display:none">
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
        <strong>Upload Audio</strong>
        <input type="file" id="sidebar-file-input" accept="audio/*,video/*" style="display:none">
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

    // Upload handlers
    [uploadZone, sidebarUpload].forEach(zone => {
      zone.addEventListener('click', () => {
        const input = zone.querySelector('input[type=file]') || fileInput;
        input.click();
      });
      zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = '#FFD700'; });
      zone.addEventListener('dragleave', () => { zone.style.borderColor = '#333'; });
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.style.borderColor = '#333';
        if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
      });
    });

    fileInput.addEventListener('change', e => { if (e.target.files.length) processFile(e.target.files[0]); });
    sidebarFileInput.addEventListener('change', e => { if (e.target.files.length) processFile(e.target.files[0]); });

    async function processFile(file) {
      document.getElementById('json-output').textContent = 'Processing...';

      // Create object URL for playback
      const url = URL.createObjectURL(file);
      audioPlayer.src = url;

      // Generate demo captions (in real usage, this calls the API)
      captions = generateDemoCaptions(file.name);

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

/**
 * Start the preview server
 */
export function startPreviewServer(port: number = PORT): void {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML_TEMPLATE);
  });

  server.listen(port, () => {
    console.log(`\n🎬 Captioneer Preview Server`);
    console.log(`   Local: http://localhost:${port}\n`);
    console.log(`   Upload audio to preview captions in real-time.\n`);
  });
}
