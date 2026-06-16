/**
 * Captioneer preview app — upload, Remotion Player, configurator, editor.
 */

let meta = { styles: [], presets: [] };
let currentStyle = "word-highlight";
let currentPreset = "tiktok";
const playerProps = {
  fontSize: 56,
  fontColor: "rgba(255,255,255,0.5)",
  highlightColor: "#3b82f6",
  position: "bottom",
  wordsPerLine: 0,
  useSmartWrap: false,
};
let syntheticMode = false;
let syntheticStart = 0;
let syntheticPaused = true;
let syntheticRaf = null;
const SPEAKER_COLORS = [
  "var(--color-accent)",
  "var(--color-warning)",
  "var(--color-success)",
  "#f472b6",
  "#a78bfa",
  "#34d399",
];

let diarizeEnabled = false;

const $ = (id) => document.getElementById(id);

async function init() {
  const res = await fetch("/api/meta");
  meta = await res.json();
  populateSelects();
  bindEvents();
  applyUrlParams();
  loadLocalConfig();
  buildWaveformPlaceholder();
}

function populateSelects() {
  const styleSel = $("style-select");
  styleSel.innerHTML = meta.styles
    .map((s) => `<option value="${s.id}">${s.label}</option>`)
    .join("");

  const presetSel = $("preset-select");
  presetSel.innerHTML =
    `<option value="">— Preset —</option>` +
    meta.presets.map((p) => `<option value="${p.key}">${p.name}</option>`).join("");

  updateStudioLink();
}

function bindEvents() {
  const zone = $("upload-zone");
  const input = $("file-input");

  zone.addEventListener("click", () => input.click());
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("dragover");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("dragover");
    if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
  });
  input.addEventListener("change", (e) => {
    if (e.target.files.length) processFile(e.target.files[0]);
  });

  $("style-select").addEventListener("change", (e) => {
    currentStyle = e.target.value;
    $("stat-style").textContent = currentStyle;
    updateStudioLink();
    remountPlayer();
    saveLocalConfig();
  });

  $("preset-select").addEventListener("change", (e) => {
    if (!e.target.value) return;
    applyPreset(e.target.value);
  });

  $("copy-jsx-btn").addEventListener("click", copyJsx);

  ["cfg-font-size", "cfg-position", "cfg-highlight", "cfg-words-per-line", "cfg-smart-wrap", "cfg-diarize"].forEach(
    (id) => {
      $(id).addEventListener("change", onConfigChange);
      $(id).addEventListener("input", onConfigChange);
    }
  );

  $("play-btn").addEventListener("click", togglePlay);
  $("restart-btn").addEventListener("click", restart);
  $("speed-btn").addEventListener("click", cycleSpeed);
  $("export-json-btn").addEventListener("click", exportJson);

  $("timeline").addEventListener("click", onTimelineClick);
  $("timeline").addEventListener("keydown", onTimelineKey);

  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input,select,textarea")) return;
    if (e.code === "Space") {
      e.preventDefault();
      togglePlay();
    } else if (e.code === "ArrowLeft") {
      seekBy(-1000);
    } else if (e.code === "ArrowRight") {
      seekBy(1000);
    }
  });
}

function applyPreset(key) {
  const p = meta.presets.find((x) => x.key === key);
  if (!p) return;
  currentPreset = key;
  currentStyle = p.style;
  playerProps.highlightColor = p.highlightColor;
  playerProps.fontColor = p.fontColor;
  playerProps.fontSize = p.fontSize;
  playerProps.position = p.position;
  $("style-select").value = p.style;
  $("preset-select").value = key;
  $("cfg-highlight").value = p.highlightColor;
  $("cfg-font-size").value = p.fontSize;
  $("cfg-position").value = p.position;
  $("stat-style").textContent = p.name;
  updateStudioLink();
  remountPlayer();
  saveLocalConfig();
}

function onConfigChange() {
  playerProps.fontSize = Number($("cfg-font-size").value) || 56;
  playerProps.position = $("cfg-position").value;
  playerProps.highlightColor = $("cfg-highlight").value;
  playerProps.wordsPerLine = Number($("cfg-words-per-line").value) || 0;
  playerProps.useSmartWrap = $("cfg-smart-wrap").checked;
  diarizeEnabled = $("cfg-diarize").checked;
  remountPlayer();
  saveLocalConfig();
}

function setStatus(msg, type = "loading") {
  const el = $("status-banner");
  el.textContent = msg;
  el.className = "status-banner show " + type;
}

function clearStatus() {
  $("status-banner").className = "status-banner";
}

async function processFile(file) {
  setStatus("Processing…", "loading");
  $("json-output").textContent = "Processing…";

  const isJson =
    file.name.toLowerCase().endsWith(".json") || file.type === "application/json";

  if (isJson) {
    try {
      const text = await file.text();
      captions = JSON.parse(text);
      if (!captions?.segments) throw new Error("Expected { segments: [...] }");
      syntheticMode = true;
      $("audio-player").removeAttribute("src");
    } catch (err) {
      setStatus("Invalid caption JSON: " + err.message, "error");
      $("json-output").textContent = "Invalid JSON.";
      return;
    }
  } else {
    syntheticMode = false;
    const url = URL.createObjectURL(file);
    $("audio-player").src = url;
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: {
          "X-Filename": file.name,
          "Content-Type": file.type || "application/octet-stream",
          ...(diarizeEnabled ? { "X-Diarize": "true" } : {}),
        },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      captions = data;
      setStatus("Transcription complete", "success");
    } catch (err) {
      setStatus("Transcribe failed: " + (err.message || err), "error");
      captions = demoCaptions();
    }
  }

  $("upload-zone").classList.add("hidden");
  $("remotion-mount").classList.add("active");
  $("timeline").style.display = "block";
  $("audio-controls").style.display = "flex";
  $("waveform").style.display = "flex";

  $("stat-segments").textContent = String(captions.segments.length);
  $("stat-duration").textContent = (captions.durationMs / 1000).toFixed(1) + "s";
  $("json-output").textContent = JSON.stringify(captions, null, 2);

  buildEditor();
  renderSpeakersSummary();
  remountPlayer();
  setTimeout(clearStatus, 2500);
}

function demoCaptions() {
  return {
    language: "en",
    durationMs: 6000,
    segments: [
      {
        text: "Welcome to Captioneer preview",
        startMs: 0,
        endMs: 3000,
        words: [
          { word: "Welcome", startMs: 0, endMs: 500, confidence: 0.95 },
          { word: "to", startMs: 500, endMs: 800, confidence: 0.95 },
          { word: "Captioneer", startMs: 800, endMs: 1500, confidence: 0.95 },
          { word: "preview", startMs: 1500, endMs: 3000, confidence: 0.95 },
        ],
      },
    ],
  };
}

function remountPlayer() {
  if (!captions || typeof window.mountCaptioneerPlayer !== "function") return;
  window.mountCaptioneerPlayer($("remotion-mount"), {
    captions,
    style: currentStyle,
    ...playerProps,
  });
}

function syncPlayerFrame() {
  if (typeof window.captioneerSeekTo === "function") {
    window.captioneerSeekTo(getCurrentTimeMs());
  }
}

function getCurrentTimeMs() {
  if (syntheticMode) {
    if (syntheticPaused) return Math.max(0, performance.now() - syntheticStart) * 0;
    return (performance.now() - syntheticStart) * playbackRate;
  }
  return $("audio-player").currentTime * 1000;
}

function togglePlay() {
  if (!captions) return;
  if (syntheticMode) {
    if (syntheticPaused) {
      syntheticStart = performance.now() - getCurrentTimeMs() / playbackRate;
      syntheticPaused = false;
      $("play-btn").textContent = "⏸ Pause";
      $("play-btn").classList.add("active");
      startSyntheticLoop();
    } else {
      syntheticPaused = true;
      $("play-btn").textContent = "▶ Play";
      $("play-btn").classList.remove("active");
      if (syntheticRaf) cancelAnimationFrame(syntheticRaf);
    }
    return;
  }
  const audio = $("audio-player");
  if (audio.paused) {
    void audio.play();
    $("play-btn").textContent = "⏸ Pause";
    $("play-btn").classList.add("active");
    startAudioLoop();
  } else {
    audio.pause();
    $("play-btn").textContent = "▶ Play";
    $("play-btn").classList.remove("active");
  }
}

function restart() {
  if (syntheticMode) {
    syntheticStart = performance.now();
    syntheticPaused = false;
    $("play-btn").textContent = "⏸ Pause";
    startSyntheticLoop();
  } else {
    $("audio-player").currentTime = 0;
    if ($("audio-player").paused) togglePlay();
  }
  updateProgress();
}

function cycleSpeed() {
  playbackRate = playbackRate === 1 ? 0.5 : playbackRate === 0.5 ? 2 : 1;
  $("audio-player").playbackRate = playbackRate;
  $("speed-btn").textContent = playbackRate + "x";
}

function startSyntheticLoop() {
  function loop() {
    if (!syntheticPaused) {
      updateProgress();
      syncPlayerFrame();
      if (getCurrentTimeMs() >= captions.durationMs) {
        syntheticPaused = true;
        $("play-btn").textContent = "▶ Play";
        $("play-btn").classList.remove("active");
        return;
      }
      syntheticRaf = requestAnimationFrame(loop);
    }
  }
  loop();
}

function startAudioLoop() {
  function loop() {
    if (!$("audio-player").paused) {
      updateProgress();
      syncPlayerFrame();
      requestAnimationFrame(loop);
    }
  }
  loop();
}

function updateProgress() {
  if (!captions) return;
  const p = Math.min(100, (getCurrentTimeMs() / captions.durationMs) * 100);
  $("timeline-progress").style.width = p + "%";
}

function onTimelineClick(e) {
  if (!captions) return;
  const rect = $("timeline").getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  seekTo(ratio * captions.durationMs);
}

function onTimelineKey(e) {
  if (e.key === "ArrowLeft") seekBy(-500);
  if (e.key === "ArrowRight") seekBy(500);
}

function seekBy(deltaMs) {
  seekTo(Math.max(0, getCurrentTimeMs() + deltaMs));
}

function seekTo(ms) {
  if (!captions) return;
  const clamped = Math.min(captions.durationMs, Math.max(0, ms));
  if (syntheticMode) {
    syntheticStart = performance.now() - clamped / playbackRate;
  } else {
    $("audio-player").currentTime = clamped / 1000;
  }
  updateProgress();
  syncPlayerFrame();
}

function speakerChipClass(speaker) {
  if (!speaker) return "";
  const idx = hashSpeaker(speaker) % SPEAKER_COLORS.length;
  return ` speaker-chip speaker-${idx}`;
}

function hashSpeaker(speaker) {
  let h = 0;
  for (let i = 0; i < speaker.length; i++) h = (h * 31 + speaker.charCodeAt(i)) >>> 0;
  return h;
}

function formatSpeaker(speaker) {
  const numbered = speaker.match(/^speaker_(\d+)$/);
  if (numbered) return `Speaker ${Number(numbered[1]) + 1}`;
  if (/^[A-Z]$/.test(speaker)) return `Speaker ${speaker}`;
  return speaker.replace(/_/g, " ");
}

function renderSpeakersSummary() {
  const speakers = [...new Set(captions.segments.map((s) => s.speaker).filter(Boolean))].sort();
  const heading = $("speakers-heading");
  const panel = $("speakers-panel");
  if (!speakers.length) {
    heading.style.display = "none";
    panel.style.display = "none";
    return;
  }
  heading.style.display = "block";
  panel.style.display = "block";
  panel.innerHTML = speakers
    .map(
      (sp, i) =>
        `<span class="word-chip speaker-chip speaker-${i % SPEAKER_COLORS.length}" style="border-left:3px solid ${SPEAKER_COLORS[i % SPEAKER_COLORS.length]}">${formatSpeaker(sp)}</span>`
    )
    .join("");
}

function buildEditor() {
  const panel = $("editor-panel");
  panel.innerHTML = "";
  captions.segments.forEach((seg) => {
    const row = document.createElement("div");
    row.className = "seg-row";
    if (seg.speaker) {
      const sp = document.createElement("div");
      sp.style.color = "var(--color-text-dim)";
      sp.style.fontSize = "var(--text-xs)";
      sp.textContent = formatSpeaker(seg.speaker);
      row.appendChild(sp);
    }
    seg.words.forEach((w) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "word-chip" + speakerChipClass(seg.speaker);
      if (seg.speaker) {
        const idx = hashSpeaker(seg.speaker) % SPEAKER_COLORS.length;
        chip.style.borderLeftColor = SPEAKER_COLORS[idx];
      }
      chip.textContent = w.word;
      chip.title = `${w.startMs}–${w.endMs}ms`;
      chip.onclick = () => seekTo(w.startMs);
      row.appendChild(chip);
    });
    panel.appendChild(row);
  });
}

function buildWaveformPlaceholder() {
  const wf = $("waveform");
  for (let i = 0; i < 80; i++) {
    const bar = document.createElement("div");
    bar.className = "wave-bar";
    bar.style.height = 4 + (i % 7) * 3 + "px";
    wf.appendChild(bar);
  }
}

function copyJsx() {
  const presetPart = currentPreset
    ? `{...applyPreset('${currentPreset}')}`
    : `style="${currentStyle}" highlightColor="${playerProps.highlightColor}"`;
  const snippet = `<AnimatedCaptions captions={captions} ${presetPart} fontSize={${playerProps.fontSize}} position="${playerProps.position}" />`;
  navigator.clipboard.writeText(snippet);
  setStatus("Copied JSX to clipboard", "success");
  setTimeout(clearStatus, 2000);
}

function exportJson() {
  if (!captions) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(captions, null, 2)], { type: "application/json" }));
  a.download = "captions.json";
  a.click();
}

function updateStudioLink() {
  const style = meta.styles.find((s) => s.id === currentStyle);
  const comp = style?.compositionId ?? "WordHighlightDemo";
  $("studio-link").href = "http://localhost:3000/" + comp;
}

function saveLocalConfig() {
  try {
    localStorage.setItem(
      "captioneer-preview-config",
      JSON.stringify({ style: currentStyle, preset: currentPreset, diarize: diarizeEnabled, ...playerProps })
    );
  } catch (_) {}
}

function loadLocalConfig() {
  try {
    const raw = localStorage.getItem("captioneer-preview-config");
    if (!raw) return;
    const c = JSON.parse(raw);
    if (c.style) {
      currentStyle = c.style;
      $("style-select").value = c.style;
    }
    if (c.preset) applyPreset(c.preset);
    if (c.fontSize) $("cfg-font-size").value = c.fontSize;
    if (c.position) $("cfg-position").value = c.position;
    if (c.highlightColor) $("cfg-highlight").value = c.highlightColor;
    if (typeof c.diarize === "boolean") {
      $("cfg-diarize").checked = c.diarize;
      diarizeEnabled = c.diarize;
    }
    onConfigChange();
  } catch (_) {}
}

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  if (params.get("style")) {
    currentStyle = params.get("style");
    $("style-select").value = currentStyle;
  }
  if (params.get("preset")) applyPreset(params.get("preset"));
}

init();
