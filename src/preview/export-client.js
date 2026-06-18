/**
 * Browser-side caption export (mirrors src/exporters.ts for preview UI).
 */

function pad(n, width) {
  const s = String(n);
  return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

function msToSrtTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(millis, 3)}`;
}

function msToVttTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(millis, 3)}`;
}

function msToAssTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  return `${pad(hours, 1)}:${pad(minutes, 2)}:${pad(seconds, 2)}.${pad(centis, 2)}`;
}

export function exportCaptionsToFormat(captions, format) {
  if (!captions?.segments?.length) {
    throw new Error("No caption data to export");
  }

  switch (format) {
    case "srt":
      return captions.segments
        .map(
          (seg, i) =>
            `${i + 1}\n${msToSrtTime(seg.startMs)} --> ${msToSrtTime(seg.endMs)}\n${seg.text}\n`
        )
        .join("\n");
    case "vtt":
      return (
        "WEBVTT\n\n" +
        captions.segments
          .map(
            (seg, i) =>
              `${i + 1}\n${msToVttTime(seg.startMs)} --> ${msToVttTime(seg.endMs)}\n${seg.text}\n`
          )
          .join("\n")
      );
    case "ass":
      return (
        "[Script Info]\nScriptType: v4.00+\n\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n[Events]\nFormat: Layer, Start, End, Style, Text\n" +
        captions.segments
          .map(
            (seg) =>
              `Dialogue: 0,${msToAssTime(seg.startMs)},${msToAssTime(seg.endMs)},Default,${seg.text}`
          )
          .join("\n")
      );
    case "json":
      return JSON.stringify(captions, null, 2);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

export function downloadExport(captions, format, filenameBase = "captions") {
  const ext = format === "json" ? "json" : format;
  const text = exportCaptionsToFormat(captions, format);
  const mime =
    format === "json" ? "application/json" : "text/plain;charset=utf-8";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = `${filenameBase}.${ext}`;
  a.click();
  URL.revokeObjectURL(a.href);
}
