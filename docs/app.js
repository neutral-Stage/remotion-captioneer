/**
 * Captioneer docs — live demo (loads ui-meta.json)
 */
const WD = 0.34;
const LINES = [
  "Add beautiful animated captions to your videos",
  "Fourteen unique styles to choose from",
  "Word level timing powered by six STT providers",
  "Export to SRT VTT ASS TXT and more",
  "Built for Remotion the React video framework",
  "Audio video sync with beat detection",
  "Curated presets across ten categories",
  "Layout primitives for perfect positioning",
  "Auto generate emoji reactions from text",
  "Free open source MIT license forever",
];
const EMOJIS = [
  { w: "amazing", e: "😍" },
  { w: "fire", e: "🔥" },
  { w: "love", e: "❤️" },
  { w: "code", e: "💻" },
  { w: "music", e: "🎵" },
  { w: "happy", e: "😊" },
  { w: "fast", e: "⚡" },
  { w: "star", e: "⭐" },
];

let META = { styles: [], presets: [], categories: {} };
let STYLES = [];
let PRESET_MAP = {};
let S = {
  st: "word-highlight",
  preset: "tiktok",
  caps: [],
  on: false,
  t0: 0,
  dur: 0,
  raf: null,
  li: 0,
  auto: true,
  accent: "#3b82f6",
  config: { fontSize: 22, position: "bottom", wordsPerLine: 0, useSmartWrap: false },
};
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function init() {
  const res = await fetch("ui-meta.json");
  META = await res.json();
  STYLES = META.styles.map((s) => ({ id: s.id, n: s.label }));
  PRESET_MAP = Object.fromEntries(META.presets.map((p) => [p.key, p]));

  buildStyleBtns();
  buildWave();
  buildShowcase();
  buildPresets();
  buildEmojis();
  buildSync();
  buildConfigurator();
  setupCtrl();
  setupExp();
  loadConfig();
  applyUrlParams();
  applyCapPosition();

  document.getElementById("icmd").onclick = () => {
    navigator.clipboard.writeText("npx captioneer init my-video");
    toast("Copied!");
  };
  setTimeout(() => {
    loadLine();
    if (!reducedMotion) play();
  }, 400);
}

function buildStyleBtns() {
  const g = document.getElementById("sgrid");
  STYLES.forEach((s) => {
    const b = document.createElement("button");
    b.className = "sc-btn" + (s.id === S.st ? " on" : "");
    b.textContent = s.n;
    b.dataset.s = s.id;
    b.setAttribute("aria-pressed", s.id === S.st ? "true" : "false");
    b.onclick = () => {
      S.auto = false;
      pick(s.id);
    };
    g.appendChild(b);
  });
}

function pick(id) {
  S.st = id;
  document.querySelectorAll(".sc-btn").forEach((b) => {
    const on = b.dataset.s === id;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
  });
  document.getElementById("psn").textContent = STYLES.find((s) => s.id === id).n;
  const styleEl = document.getElementById("cfg-style");
  if (styleEl) styleEl.value = id;
  saveConfig();
}

function applyPreset(key) {
  const p = PRESET_MAP[key];
  if (!p) return;
  S.preset = key;
  S.st = p.style;
  S.accent = p.highlightColor;
  if (p.fontSize) S.config.fontSize = Math.min(48, Math.max(14, Math.round(p.fontSize / 2.5)));
  if (p.position) S.config.position = p.position;
  pick(p.style);
  document.querySelectorAll(".cat-item").forEach((el) => {
    el.classList.toggle("on", el.dataset.key === key);
  });
  const presetEl = document.getElementById("cfg-preset");
  const styleEl = document.getElementById("cfg-style");
  const highlightEl = document.getElementById("cfg-highlight");
  const fontEl = document.getElementById("cfg-font");
  const posEl = document.getElementById("cfg-position");
  if (presetEl) presetEl.value = key;
  if (styleEl) styleEl.value = p.style;
  if (highlightEl) highlightEl.value = p.highlightColor;
  if (fontEl) fontEl.value = String(S.config.fontSize);
  if (posEl) posEl.value = S.config.position;
  applyCapPosition();
  saveConfig();
}

function buildWave() {
  const w = document.getElementById("wv");
  for (let i = 0; i < 60; i++) {
    const d = document.createElement("div");
    d.className = "wb";
    d.style.height = "2px";
    w.appendChild(d);
  }
}

function buildShowcase() {
  const g = document.getElementById("showGrid");
  STYLES.forEach((s) => {
    const c = document.createElement("div");
    c.className = "style-card";
    c.tabIndex = 0;
    c.setAttribute("role", "button");
    c.setAttribute("aria-label", `Preview ${s.n} style`);
    c.onclick = () => scrollToDemo(s.id);
    c.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        scrollToDemo(s.id);
      }
    };
    const canvas = document.createElement("canvas");
    canvas.id = "sc-" + s.id;
    canvas.height = 80;
    canvas.setAttribute("aria-hidden", "true");
    const info = document.createElement("div");
    info.className = "info";
    const h4 = document.createElement("h4");
    h4.textContent = s.n;
    const small = document.createElement("small");
    small.textContent = s.id;
    info.append(h4, small);
    c.append(canvas, info);
    g.appendChild(c);
  });
  if (!reducedMotion) animateShowcards();
}

function scrollToDemo(id) {
  S.auto = false;
  pick(id);
  document.getElementById("demo").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
}

function animateShowcards() {
  const renders = getCanvasRenders();
  function frame() {
    const t = performance.now() / 1000;
    STYLES.forEach((s) => {
      const c = document.getElementById("sc-" + s.id);
      if (!c) return;
      const ctx = c.getContext("2d");
      c.width = c.offsetWidth * 2;
      c.height = 160;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#0a0a10";
      ctx.fillRect(0, 0, c.width, c.height);
      if (renders[s.id]) renders[s.id](ctx, c.width, c.height, t);
    });
    requestAnimationFrame(frame);
  }
  frame();
}

function getCanvasRenders() {
  const ac = S.accent;
  return {
    "word-highlight": (ctx, w, h, t) => {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World", w / 2, h / 2 + 6);
    },
    karaoke: (ctx, w, h, t) => {
      const p = (t * 0.5) % 1;
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#555";
      ctx.fillText("Hello World", w / 2, h / 2 + 6);
      ctx.fillStyle = ac;
      ctx.save();
      ctx.rect(w / 2 - 55, 0, 110 * p, 80);
      ctx.clip();
      ctx.fillText("Hello World", w / 2, h / 2 + 6);
      ctx.restore();
    },
    typewriter: (ctx, w, h, t) => {
      const n = Math.floor((t * 2) % 12) + 1;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World".substring(0, n), w / 2, h / 2 + 6);
    },
    bounce: (ctx, w, h, t) => {
      const sc = 1 + Math.abs(Math.sin(t * 3)) * 0.3;
      ctx.save();
      ctx.translate(w / 2, h / 2 + 6);
      ctx.scale(1, sc);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World", 0, 0);
      ctx.restore();
    },
    wave: (ctx, w, h, t) => {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      const txt = "Hello World";
      for (let i = 0; i < txt.length; i++) {
        const y = h / 2 + 6 + Math.sin(t * 4 + i * 0.5) * 6;
        ctx.fillText(txt[i], w / 2 - 55 + i * 10, y);
      }
    },
    glow: (ctx, w, h, t) => {
      ctx.shadowColor = ac;
      ctx.shadowBlur = 8 + Math.sin(t * 2) * 8;
      ctx.fillStyle = ac;
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World", w / 2, h / 2 + 6);
      ctx.shadowBlur = 0;
    },
    pill: (ctx, w, h) => {
      ctx.fillStyle = ac + "33";
      ctx.beginPath();
      ctx.roundRect(w / 2 - 60, h / 2 - 12, 120, 28, 14);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World", w / 2, h / 2 + 5);
    },
    flicker: (ctx, w, h) => {
      ctx.fillStyle = "#fdcb6e";
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World", w / 2, h / 2 + 6);
      ctx.globalAlpha = 1;
    },
    highlighter: (ctx, w, h, t) => {
      const p = (t * 0.6) % 1;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World", w / 2, h / 2 + 6);
      ctx.fillStyle = "rgba(253,203,110,0.3)";
      ctx.fillRect(w / 2 - 55, h / 2 + 2, 110 * Math.min(1, p * 1.5), 8);
    },
    blur: (ctx, w, h, t) => {
      const b = Math.abs(Math.sin(t)) * 4;
      ctx.filter = `blur(${b}px)`;
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World", w / 2, h / 2 + 6);
      ctx.filter = "none";
    },
    rainbow: (ctx, w, h, t) => {
      const hue = (t * 60) % 360;
      ctx.fillStyle = `hsl(${hue},80%,65%)`;
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World", w / 2, h / 2 + 6);
    },
    scale: (ctx, w, h, t) => {
      const sc = 0.8 + Math.abs(Math.sin(t * 2)) * 0.4;
      ctx.save();
      ctx.translate(w / 2, h / 2 + 6);
      ctx.scale(sc, sc);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World", 0, 0);
      ctx.restore();
    },
    spotlight: (ctx, w, h, t) => {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World", w / 2, h / 2 + 6);
    },
    "typewriter-erase": (ctx, w, h, t) => {
      const p = (t * 1.5) % 1;
      const n = p < 0.5 ? Math.floor(p * 2 * 11) + 1 : Math.floor((1 - (p - 0.5) * 2) * 11);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Hello World".substring(0, Math.max(1, n)), w / 2, h / 2 + 6);
    },
  };
}

function buildPresets() {
  const a = document.getElementById("presetArea");
  const cats = META.categories || {};
  for (const [cat, keys] of Object.entries(cats)) {
    const d = document.createElement("div");
    d.className = "cat";
    const title = document.createElement("div");
    title.className = "cat-title";
    title.textContent = cat;
    const items = document.createElement("div");
    items.className = "cat-items";
    keys.forEach((key) => {
      const p = PRESET_MAP[key];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-item";
      btn.dataset.key = key;
      btn.textContent = p ? p.name : key;
      btn.onclick = () => applyPreset(key);
      items.appendChild(btn);
    });
    d.append(title, items);
    a.appendChild(d);
  }
}

function buildConfigurator() {
  const panel = document.getElementById("configPanel");
  if (!panel) return;
  panel.replaceChildren();

  const addRow = (labelText, control) => {
    const row = document.createElement("div");
    row.className = "config-row";
    const label = document.createElement("label");
    label.textContent = labelText;
    row.append(label, control);
    panel.appendChild(row);
  };

  const presetSel = document.createElement("select");
  presetSel.id = "cfg-preset";
  META.presets.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.key;
    opt.textContent = p.name;
    presetSel.appendChild(opt);
  });
  presetSel.onchange = (e) => applyPreset(e.target.value);
  addRow("Preset", presetSel);

  const styleSel = document.createElement("select");
  styleSel.id = "cfg-style";
  STYLES.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.n;
    styleSel.appendChild(opt);
  });
  styleSel.onchange = (e) => pick(e.target.value);
  addRow("Style", styleSel);

  const colorIn = document.createElement("input");
  colorIn.type = "color";
  colorIn.id = "cfg-highlight";
  colorIn.value = S.accent;
  colorIn.oninput = (e) => {
    S.accent = e.target.value;
    saveConfig();
  };
  addRow("Highlight", colorIn);

  const fontIn = document.createElement("input");
  fontIn.type = "number";
  fontIn.id = "cfg-font";
  fontIn.min = "14";
  fontIn.max = "48";
  fontIn.value = String(S.config.fontSize);
  fontIn.oninput = (e) => {
    S.config.fontSize = Number(e.target.value) || 22;
    saveConfig();
  };
  addRow("Font size", fontIn);

  const posSel = document.createElement("select");
  posSel.id = "cfg-position";
  ["bottom", "center", "top"].forEach((pos) => {
    const opt = document.createElement("option");
    opt.value = pos;
    opt.textContent = pos.charAt(0).toUpperCase() + pos.slice(1);
    posSel.appendChild(opt);
  });
  posSel.value = S.config.position;
  posSel.onchange = (e) => {
    S.config.position = e.target.value;
    applyCapPosition();
    saveConfig();
  };
  addRow("Position", posSel);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "bt bt2";
  copyBtn.id = "copy-jsx";
  copyBtn.textContent = "Copy JSX";
  copyBtn.onclick = copyJsx;
  addRow("", copyBtn);
}

function copyJsx() {
  const p = PRESET_MAP[S.preset];
  const snippet = p
    ? `<AnimatedCaptions captions={captions} {...applyPreset('${S.preset}')} style="${S.st}" />`
    : `<AnimatedCaptions captions={captions} style="${S.st}" highlightColor="${S.accent}" />`;
  navigator.clipboard.writeText(snippet);
  toast("Copied JSX!");
}

function buildEmojis() {
  const r = document.getElementById("emojiDemo");
  if (!r) return;
  EMOJIS.forEach(({ w, e }) => {
    const item = document.createElement("div");
    item.className = "emoji-item";
    item.append(document.createTextNode(e + " "));
    const span = document.createElement("span");
    span.textContent = `"${w}"`;
    item.appendChild(span);
    r.appendChild(item);
  });
}

function buildSync() {
  const c = document.getElementById("syncBars");
  for (let i = 0; i < 32; i++) {
    const d = document.createElement("div");
    d.className = "sync-bar";
    c.appendChild(d);
  }
  if (reducedMotion) return;
  function animBars() {
    const t = performance.now() / 1000;
    c.querySelectorAll(".sync-bar").forEach((b, i) => {
      b.style.height = 10 + Math.sin(t * 3 + i * 0.3) * 20 + "px";
    });
    requestAnimationFrame(animBars);
  }
  animBars();
}

function loadLine() {
  const ln = LINES[S.li % LINES.length];
  const w = ln.split(" ");
  S.caps = w.map((t, i) => ({ text: t, start: i * WD, end: (i + 1) * WD }));
  S.dur = w.length * WD;
}

function nextLine() {
  S.li++;
  if (S.auto) {
    const i = STYLES.findIndex((s) => s.id === S.st);
    pick(STYLES[(i + 1) % STYLES.length].id);
  }
  loadLine();
}

function play() {
  if (S.on) {
    stop();
    return;
  }
  S.on = true;
  S.t0 = performance.now();
  document.getElementById("ppb").textContent = "⏸";
  document.getElementById("ppb").setAttribute("aria-label", "Pause");
  tick();
}

function stop() {
  S.on = false;
  if (S.raf) cancelAnimationFrame(S.raf);
  document.getElementById("ppb").textContent = "▶";
  document.getElementById("ppb").setAttribute("aria-label", "Play");
  document.getElementById("cap").replaceChildren();
  document.getElementById("pf").style.width = "0";
}

function tick() {
  if (!S.on) return;
  const el = (performance.now() - S.t0) / 1000;
  const p = Math.min(el / S.dur, 1);
  const pf = document.getElementById("pf");
  pf.style.width = p * 100 + "%";
  const prog = document.querySelector(".pprog");
  if (prog) prog.setAttribute("aria-valuenow", String(Math.round(p * 100)));
  document.getElementById("pt").textContent = ft(el) + " / " + ft(S.dur);
  const c = S.caps.find((c) => el >= c.start && el < c.end);
  if (c) renderCap(c, el);
  else document.getElementById("cap").replaceChildren();
  if (!reducedMotion) {
    updateWave(el);
    drawBg(el);
  }
  if (p >= 1) {
    stop();
    nextLine();
    setTimeout(play, 300);
    return;
  }
  S.raf = requestAnimationFrame(tick);
}

function ft(s) {
  return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
}

function setupCtrl() {
  const btn = document.getElementById("ppb");
  btn.onclick = play;
  btn.setAttribute("aria-label", "Play");
  const prog = document.querySelector(".pprog");
  prog.setAttribute("aria-valuenow", "0");
  prog.setAttribute("tabindex", "0");
  const seekFromEvent = (clientX) => {
    const rect = prog.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    seekTo(ratio * S.dur);
  };
  prog.addEventListener("click", (e) => seekFromEvent(e.clientX));
  prog.addEventListener("keydown", (e) => {
    const step = S.dur * 0.05;
    const current = (performance.now() - S.t0) / 1000;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      seekTo(Math.min(S.dur, current + step));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      seekTo(Math.max(0, current - step));
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input,select,textarea")) return;
    if (e.code === "Space") {
      e.preventDefault();
      play();
    }
  });
}

function seekTo(seconds) {
  if (!S.caps.length) loadLine();
  S.t0 = performance.now() - seconds * 1000;
  const p = Math.min(seconds / S.dur, 1);
  document.getElementById("pf").style.width = p * 100 + "%";
  document.querySelector(".pprog")?.setAttribute("aria-valuenow", String(Math.round(p * 100)));
  document.getElementById("pt").textContent = ft(seconds) + " / " + ft(S.dur);
  const c = S.caps.find((cap) => seconds >= cap.start && seconds < cap.end);
  const capEl = document.getElementById("cap");
  if (c) renderCap(c, seconds);
  else capEl.replaceChildren();
  if (S.on && S.raf) cancelAnimationFrame(S.raf);
  if (S.on) S.raf = requestAnimationFrame(tick);
}

function applyCapPosition() {
  const layer = document.getElementById("capLayer");
  if (!layer) return;
  layer.classList.remove("pos-top", "pos-bottom");
  if (S.config.position === "top") layer.classList.add("pos-top");
  else if (S.config.position === "bottom") layer.classList.add("pos-bottom");
}

function drawBg(t) {
  const c = document.getElementById("bgC"),
    ctx = c.getContext("2d");
  c.width = c.offsetWidth * 2;
  c.height = c.offsetHeight * 2;
  const w = c.width,
    h = c.height;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#0d0d16");
  g.addColorStop(1, "#08080e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function updateWave(t) {
  document.querySelectorAll(".wb").forEach((b, i) => {
    b.style.height = 3 + Math.sin(t * 3 + i * 0.15) * 8 + "px";
  });
}

function resetCapStyles(el) {
  el.style.cssText = "";
  el.className = "cap-el";
  el.style.fontSize = S.config.fontSize + "px";
  el.style.color = "#fff";
  el.style.fontWeight = "700";
  el.style.textAlign = "center";
  el.style.maxWidth = "88%";
  el.style.padding = "6px 14px";
}

function renderCap(cap, elapsed) {
  const el = document.getElementById("cap");
  const bg = S.accent;
  const p = Math.max(0, Math.min(1, (elapsed - cap.start) / (cap.end - cap.start)));
  const text = cap.text;
  resetCapStyles(el);

  switch (S.st) {
    case "karaoke": {
      const pct = Math.min(p * 100, 100);
      el.textContent = text;
      el.style.background = `linear-gradient(90deg,${bg} ${pct}%,#fff ${pct}%)`;
      el.style.webkitBackgroundClip = "text";
      el.style.backgroundClip = "text";
      el.style.webkitTextFillColor = "transparent";
      break;
    }
    case "typewriter": {
      const n = Math.max(1, Math.floor(p * text.length));
      el.textContent = text.substring(0, n);
      break;
    }
    case "typewriter-erase": {
      const cycle = p < 0.5 ? p * 2 : 1 - (p - 0.5) * 2;
      const n = Math.max(1, Math.floor(cycle * text.length));
      el.textContent = text.substring(0, n);
      break;
    }
    case "bounce":
      el.textContent = text;
      el.style.transform = reducedMotion ? "none" : `scaleY(${1 + Math.sin(p * Math.PI) * 0.25})`;
      el.style.textShadow = `0 0 14px ${bg}`;
      break;
    case "wave": {
      el.replaceChildren();
      for (let i = 0; i < text.length; i++) {
        const span = document.createElement("span");
        span.className = "wave-char";
        span.textContent = text[i];
        if (!reducedMotion) {
          span.style.transform = `translateY(${Math.sin(elapsed * 4 + i * 0.5) * 6}px)`;
        }
        el.appendChild(span);
      }
      break;
    }
    case "glow":
      el.textContent = text;
      el.style.color = bg;
      el.style.textShadow = reducedMotion
        ? `0 0 12px ${bg}`
        : `0 0 ${8 + Math.sin(elapsed * 2) * 8}px ${bg}`;
      break;
    case "pill":
      el.textContent = text;
      el.style.background = bg + "33";
      el.style.borderRadius = "999px";
      el.style.fontSize = Math.max(14, S.config.fontSize - 4) + "px";
      break;
    case "flicker":
      el.textContent = text;
      el.style.color = "#fdcb6e";
      el.style.opacity = reducedMotion ? "1" : String(0.5 + Math.random() * 0.5);
      break;
    case "highlighter":
      el.textContent = text;
      el.style.background = `linear-gradient(transparent 60%, rgba(253,203,110,${0.3 * Math.min(1, p * 1.5)}) 60%)`;
      break;
    case "blur":
      el.textContent = text;
      if (!reducedMotion) {
        const b = Math.abs(Math.sin(elapsed)) * 4;
        el.style.filter = `blur(${b}px)`;
      }
      break;
    case "rainbow": {
      const hue = reducedMotion ? 200 : (elapsed * 60) % 360;
      el.textContent = text;
      el.style.color = `hsl(${hue},80%,65%)`;
      break;
    }
    case "scale":
      el.textContent = text;
      if (!reducedMotion) {
        const sc = 0.8 + Math.abs(Math.sin(elapsed * 2)) * 0.4;
        el.style.transform = `scale(${sc})`;
      }
      break;
    case "spotlight":
      el.textContent = text;
      el.style.textShadow = `0 0 24px rgba(255,255,255,0.9), 0 0 48px ${bg}`;
      break;
    case "word-highlight":
    default:
      el.textContent = text;
      el.style.color = bg;
      el.style.textShadow = `0 0 18px ${bg}`;
  }
}

function setupExp() {
  document.querySelectorAll(".xbtn").forEach((b) => (b.onclick = () => exportCaps(b.dataset.f)));
}

function exportCaps(f) {
  if (!S.caps.length) return toast("Play demo first");
  let txt = "";
  if (f === "srt")
    txt = S.caps.map((c, i) => `${i + 1}\n${fs(c.start)} --> ${fs(c.end)}\n${c.text}\n`).join("\n");
  else if (f === "vtt")
    txt = "WEBVTT\n\n" + S.caps.map((c, i) => `${i + 1}\n${fs(c.start)} --> ${fs(c.end)}\n${c.text}\n`).join("\n");
  else if (f === "ass")
    txt =
      "[Script Info]\nScriptType: v4.00+\n\n[Events]\nFormat: Layer, Start, End, Style, Text\n" +
      S.caps.map((c) => `Dialogue: 0,${fa(c.start)},${fa(c.end)},Default,${c.text}`).join("\n");
  else txt = JSON.stringify(S.caps, null, 2);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
  a.download = "captions." + f;
  a.click();
  toast("Exported " + f.toUpperCase());
}

function fs(s) {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sc = Math.floor(s % 60),
    ms = Math.floor((s % 1) * 1000);
  return `${p(h)}:${p(m)}:${p(sc)},${String(ms).padStart(3, "0")}`;
}
function fa(s) {
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sc = Math.floor(s % 60),
    cs = Math.floor((s % 1) * 100);
  return `${p(h)}:${p(m)}:${p(sc)}.${String(cs).padStart(2, "0")}`;
}
function p(n) {
  return String(n).padStart(2, "0");
}

function saveConfig() {
  try {
    localStorage.setItem(
      "captioneer-docs-config",
      JSON.stringify({
        st: S.st,
        preset: S.preset,
        accent: S.accent,
        fontSize: S.config.fontSize,
        position: S.config.position,
      })
    );
  } catch (_) {}
}

function loadConfig() {
  try {
    const raw = localStorage.getItem("captioneer-docs-config");
    if (!raw) return;
    const c = JSON.parse(raw);
    if (c.fontSize) S.config.fontSize = c.fontSize;
    if (c.position) S.config.position = c.position;
    applyCapPosition();
    if (c.preset) applyPreset(c.preset);
    else if (c.st) pick(c.st);
    if (c.accent) S.accent = c.accent;
    const highlightEl = document.getElementById("cfg-highlight");
    const fontEl = document.getElementById("cfg-font");
    const posEl = document.getElementById("cfg-position");
    if (highlightEl && c.accent) highlightEl.value = c.accent;
    if (fontEl && c.fontSize) fontEl.value = String(c.fontSize);
    if (posEl && c.position) posEl.value = c.position;
  } catch (_) {}
}

function applyUrlParams() {
  const params = new URLSearchParams(location.search);
  if (params.get("style")) pick(params.get("style"));
  if (params.get("preset")) applyPreset(params.get("preset"));
}

function toast(m) {
  const t = document.getElementById("toast");
  t.textContent = m;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

init();
