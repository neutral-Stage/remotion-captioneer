/**
 * Captioneer preview app — upload, Remotion Player, configurator, editor.
 */

let meta = { styles: [], presets: [] };
let currentStyle = "word-highlight";
let currentPreset = "tiktok";
let captions = null;
let playbackRate = 1;
let audioAnalysis = null;
let lastUploadedFile = null;
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
const MS_PER_DRAG_PX = 8;

const $ = (id) => document.getElementById(id);

/** Attach uploaded audio via blob URL (createObjectURL only yields blob: schemes). */
function attachAudioFile(audioEl, file) {
  if (!(audioEl instanceof HTMLAudioElement)) {
    throw new Error("Audio player element missing");
  }
  const previous = audioEl.src;
  const blobUrl = URL.createObjectURL(file);
  if (!blobUrl.startsWith("blob:")) {
    URL.revokeObjectURL(blobUrl);
    throw new Error("Unexpected audio URL scheme");
  }
  // codeql[js/xss-through-dom]: createObjectURL always returns a same-origin blob: URL
  audioEl.src = blobUrl;
  if (previous.startsWith("blob:")) {
    URL.revokeObjectURL(previous);
  }
}

async function init() {
  const res = await fetch("/api/meta");
  meta = await res.json();
  populateSelects();
  bindEvents();
  applyUrlParams();
  loadLocalConfig();
  clearWaveform();
}

function populateSelects() {
  const styleSel = $("style-select");
  styleSel.replaceChildren();
  for (const s of meta.styles) {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.label;
    styleSel.appendChild(opt);
  }

  const presetSel = $("preset-select");
  presetSel.replaceChildren();
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "— Preset —";
  presetSel.appendChild(blank);
  for (const p of meta.presets) {
    const opt = document.createElement("option");
    opt.value = p.key;
    opt.textContent = p.name;
    presetSel.appendChild(opt);
  }

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

  [
    "cfg-font-size",
    "cfg-position",
    "cfg-highlight",
    "cfg-font-color",
    "cfg-words-per-line",
    "cfg-smart-wrap",
    "cfg-diarize",
    "cfg-speakers",
  ].forEach((id) => {
    $(id).addEventListener("change", onConfigChange);
    $(id).addEventListener("input", onConfigChange);
  });

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
  if (p.fontColor) $("cfg-font-color").value = p.fontColor;
  $("stat-style").textContent = p.name;
  updateStudioLink();
  remountPlayer();
  saveLocalConfig();
}

function onConfigChange() {
  playerProps.fontSize = Number($("cfg-font-size").value) || 56;
  playerProps.position = $("cfg-position").value;
  playerProps.highlightColor = $("cfg-highlight").value;
  playerProps.fontColor = $("cfg-font-color").value || "rgba(255,255,255,0.5)";
  playerProps.wordsPerLine = Number($("cfg-words-per-line").value) || 0;
  playerProps.useSmartWrap = $("cfg-smart-wrap").checked;
  diarizeEnabled = $("cfg-diarize").checked;
  $("speakers-count-group").style.display = diarizeEnabled ? "block" : "none";
  remountPlayer();
  saveLocalConfig();
}

const STATUS_BANNER_TYPES = new Set(["loading", "error", "success"]);

function setStatus(msg, type = "loading") {
  const el = $("status-banner");
  el.textContent = msg;
  el.className = "status-banner show";
  el.classList.remove("loading", "error", "success");
  el.classList.add(STATUS_BANNER_TYPES.has(type) ? type : "loading");
}

function clearStatus() {
  $("status-banner").className = "status-banner";
}

function getSpeakersHeader() {
  const raw = $("cfg-speakers").value;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 2 ? String(n) : undefined;
}

async function processFile(file) {
  setStatus("Processing…", "loading");
  $("json-output").textContent = "Processing…";
  lastUploadedFile = file;
  audioAnalysis = null;

  const isJson =
    file.name.toLowerCase().endsWith(".json") || file.type === "application/json";

  if (isJson) {
    try {
      const text = await file.text();
      captions = JSON.parse(text);
      if (!captions?.segments) throw new Error("Expected { segments: [...] }");
      syntheticMode = true;
      $("audio-player").removeAttribute("src");
      clearWaveform();
    } catch (err) {
      setStatus("Invalid caption JSON: " + err.message, "error");
      $("json-output").textContent = "Invalid JSON.";
      return;
    }
  } else {
    syntheticMode = false;
    attachAudioFile($("audio-player"), file);
    void buildWaveformFromFile(file);
    try {
      const headers = {
        "X-Filename": file.name,
        "Content-Type": file.type || "application/octet-stream",
        ...(diarizeEnabled ? { "X-Diarize": "true" } : {}),
      };
      const speakers = getSpeakersHeader();
      if (speakers) headers["X-Speakers"] = speakers;

      const res = await fetch("/api/process", {
        method: "POST",
        headers,
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      captions = data;
      setStatus("Transcription complete", "success");
      void fetchAudioAnalysis(file);
    } catch (err) {
      setStatus("Transcribe failed: " + (err.message || err), "error");
      captions = demoCaptions();
    }
  }

  showPreviewUI();
}

function showPreviewUI() {
  $("upload-zone").classList.add("hidden");
  $("remotion-mount").classList.add("active");
  $("timeline").style.display = "block";
  $("audio-controls").style.display = "flex";
  $("waveform").style.display = "flex";

  $("stat-segments").textContent = String(captions.segments.length);
  $("stat-duration").textContent = (captions.durationMs / 1000).toFixed(1) + "s";
  syncJsonOutput();

  buildEditor();
  renderSpeakersSummary();
  renderBeatMarkers();
  remountPlayer();
  setTimeout(clearStatus, 2500);
}

async function fetchAudioAnalysis(file) {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "X-Filename": file.name,
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });
    const data = await res.json();
    if (!res.ok) return;
    audioAnalysis = data;
    renderBeatMarkers();
  } catch {
    // Beat analysis requires ffmpeg on the server — optional
  }
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
    if (syntheticPaused) return 0;
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
      window.captioneerPlay?.();
      startSyntheticLoop();
    } else {
      syntheticPaused = true;
      $("play-btn").textContent = "▶ Play";
      $("play-btn").classList.remove("active");
      window.captioneerPause?.();
      if (syntheticRaf) cancelAnimationFrame(syntheticRaf);
    }
    return;
  }
  const audio = $("audio-player");
  if (audio.paused) {
    void audio.play();
    window.captioneerPlay?.();
    $("play-btn").textContent = "⏸ Pause";
    $("play-btn").classList.add("active");
    startAudioLoop();
  } else {
    audio.pause();
    window.captioneerPause?.();
    $("play-btn").textContent = "▶ Play";
    $("play-btn").classList.remove("active");
  }
}

function restart() {
  if (syntheticMode) {
    syntheticStart = performance.now();
    syntheticPaused = false;
    $("play-btn").textContent = "⏸ Pause";
    window.captioneerPlay?.();
    startSyntheticLoop();
  } else {
    $("audio-player").currentTime = 0;
    window.captioneerSeekTo?.(0);
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
        window.captioneerPause?.();
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

function renderBeatMarkers() {
  const container = $("timeline-beats");
  container.innerHTML = "";
  if (!audioAnalysis?.beats?.length || !captions?.durationMs) return;
  for (const beat of audioAnalysis.beats) {
    const marker = document.createElement("div");
    marker.className = "beat-marker";
    marker.style.left = (beat.timeMs / captions.durationMs) * 100 + "%";
    marker.title = `Beat ${beat.timeMs}ms`;
    container.appendChild(marker);
  }
}

function onTimelineClick(e) {
  if (!captions || e.target.classList.contains("beat-marker")) return;
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
  panel.replaceChildren();
  speakers.forEach((sp, i) => {
    const chip = document.createElement("span");
    chip.className = `word-chip speaker-chip speaker-${i % SPEAKER_COLORS.length}`;
    chip.style.borderLeft = `3px solid ${SPEAKER_COLORS[i % SPEAKER_COLORS.length]}`;
    chip.textContent = formatSpeaker(sp);
    panel.appendChild(chip);
  });
}

function syncSegmentText(seg) {
  seg.text = seg.words.map((w) => w.word).join(" ").trim();
  if (seg.words.length) {
    seg.startMs = seg.words[0].startMs;
    seg.endMs = seg.words[seg.words.length - 1].endMs;
  }
}

function syncJsonOutput() {
  $("json-output").textContent = JSON.stringify(captions, null, 2);
}

function onWordTimingChange() {
  if (!captions) return;
  captions.durationMs = Math.max(
    captions.durationMs,
    ...captions.segments.flatMap((s) => s.words.map((w) => w.endMs))
  );
  syncJsonOutput();
  remountPlayer();
}

function setupWordDrag(handle, word, seg, edge) {
  let startX = 0;
  let origMs = 0;

  const onMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const deltaMs = Math.round((clientX - startX) * MS_PER_DRAG_PX);
    const minDur = 20;

    if (edge === "start") {
      const maxStart = word.endMs - minDur;
      word.startMs = Math.max(0, Math.min(maxStart, origMs + deltaMs));
    } else {
      const minEnd = word.startMs + minDur;
      word.endMs = Math.min(captions.durationMs, Math.max(minEnd, origMs + deltaMs));
    }
    syncSegmentText(seg);
    onWordTimingChange();
    handle.closest(".word-chip").querySelector(".word-chip-inner").title =
      `${word.startMs}–${word.endMs}ms`;
  };

  const onUp = () => {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("touchmove", onMove);
    document.removeEventListener("touchend", onUp);
    buildEditor();
  };

  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    startX = e.clientX;
    origMs = edge === "start" ? word.startMs : word.endMs;
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  handle.addEventListener(
    "touchstart",
    (e) => {
      e.stopPropagation();
      startX = e.touches[0].clientX;
      origMs = edge === "start" ? word.startMs : word.endMs;
      document.addEventListener("touchmove", onMove, { passive: true });
      document.addEventListener("touchend", onUp);
    },
    { passive: true }
  );
}

function buildEditor() {
  const panel = $("editor-panel");
  panel.innerHTML = "";
  const hint = document.createElement("p");
  hint.style.cssText = "color:var(--color-text-secondary);font-size:var(--text-xs);margin-bottom:8px";
  hint.textContent = "Drag word edges to adjust timing. Click a word to seek.";
  panel.appendChild(hint);

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
      const chip = document.createElement("span");
      chip.className = "word-chip" + speakerChipClass(seg.speaker);
      if (seg.speaker) {
        const idx = hashSpeaker(seg.speaker) % SPEAKER_COLORS.length;
        chip.style.borderLeftColor = SPEAKER_COLORS[idx];
      }

      const handleStart = document.createElement("span");
      handleStart.className = "word-handle word-handle-start";
      handleStart.setAttribute("aria-label", "Adjust start time");

      const inner = document.createElement("button");
      inner.type = "button";
      inner.className = "word-chip-inner";
      inner.textContent = w.word;
      inner.title = `${w.startMs}–${w.endMs}ms`;
      inner.onclick = () => seekTo(w.startMs);

      const handleEnd = document.createElement("span");
      handleEnd.className = "word-handle word-handle-end";
      handleEnd.setAttribute("aria-label", "Adjust end time");

      setupWordDrag(handleStart, w, seg, "start");
      setupWordDrag(handleEnd, w, seg, "end");

      chip.appendChild(handleStart);
      chip.appendChild(inner);
      chip.appendChild(handleEnd);
      row.appendChild(chip);
    });
    panel.appendChild(row);
  });
}

function clearWaveform() {
  const wf = $("waveform");
  wf.innerHTML = "";
}

async function buildWaveformFromFile(file) {
  clearWaveform();
  const wf = $("waveform");
  wf.style.display = "flex";
  const barCount = 80;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    await audioContext.close();

    const channel = audioBuffer.getChannelData(0);
    const samplesPerBar = Math.max(1, Math.floor(channel.length / barCount));
    let maxAmp = 0;
    const amps = [];

    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      const start = i * samplesPerBar;
      const end = Math.min(channel.length, start + samplesPerBar);
      for (let j = start; j < end; j++) sum += Math.abs(channel[j]);
      const amp = sum / (end - start || 1);
      amps.push(amp);
      if (amp > maxAmp) maxAmp = amp;
    }

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement("div");
      bar.className = "wave-bar";
      const h = maxAmp > 0 ? 4 + (amps[i] / maxAmp) * 40 : 4;
      bar.style.height = h + "px";
      wf.appendChild(bar);
    }
  } catch {
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement("div");
      bar.className = "wave-bar";
      bar.style.height = 4 + (i % 7) * 3 + "px";
      wf.appendChild(bar);
    }
  }
}

function copyJsx() {
  const presetPart = currentPreset
    ? `{...applyPreset('${currentPreset}')}`
    : `style="${currentStyle}" highlightColor="${playerProps.highlightColor}"`;
  const snippet = `<AnimatedCaptions captions={captions} ${presetPart} fontSize={${playerProps.fontSize}} fontColor="${playerProps.fontColor}" position="${playerProps.position}" />`;
  navigator.clipboard.writeText(snippet);
  setStatus("Copied JSX to clipboard", "success");
  setTimeout(clearStatus, 2000);
}

function exportJson() {
  if (!captions) return;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(captions, null, 2)], { type: "application/json" })
  );
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
    const speakersRaw = $("cfg-speakers").value;
    localStorage.setItem(
      "captioneer-preview-config",
      JSON.stringify({
        style: currentStyle,
        preset: currentPreset,
        diarize: diarizeEnabled,
        speakers: speakersRaw,
        ...playerProps,
      })
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
    if (c.fontColor) $("cfg-font-color").value = c.fontColor;
    if (typeof c.diarize === "boolean") {
      $("cfg-diarize").checked = c.diarize;
      diarizeEnabled = c.diarize;
    }
    if (c.speakers) $("cfg-speakers").value = c.speakers;
    $("speakers-count-group").style.display = diarizeEnabled ? "block" : "none";
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
