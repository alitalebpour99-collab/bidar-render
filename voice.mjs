// The narrator's lines of one Reel, as the site hands them in (docs/contract.md,
// VoiceLine). They are written beside the score in the bundle's public folder;
// where each one goes, and when every beat starts, is the composition's own
// work (src/timeline.ts).
//
// Shahram on eleven_v3 reads slowly and rests long between sentences (a take
// of 480 characters runs about 45 s). Before a Reel is laid out, every pause
// is shortened and the take is brought, by at most 15 % of tempo (pitch kept),
// toward its series' length; the alignment is moved with it, so the captions
// and the cuts still land on their words. Needs ffmpeg (the workflows install
// it); without it the take is used as it came.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** How long the narration of a Reel should run, at most (seconds); the Reel adds its close of about 3 s. */
export const VOICE_TARGET = { borders: 36, myth: 32, word: 36 };
const MAX_TEMPO = 1.15;
/** what is left of a pause between two sentences */
const KEEP_PAUSE = 0.2;

const hasFfmpeg = () => spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;

/** Pauses (seconds) in an MP3, and its length. */
function silences(file) {
  const log = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", "silencedetect=noise=-38dB:d=0.25", "-f", "null", "-"], { encoding: "utf8" }).stderr ?? "";
  const dur = /Duration: (\d+):(\d+):([\d.]+)/.exec(log);
  const length = dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0;
  const starts = [...log.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return { length, quiet: starts.map((s, i) => [s, ends[i] ?? length]) };
}

/**
 * Shortens the pauses of a take and speeds it up toward `target` seconds, in
 * place. Returns the moved alignment and the take's new length, or null when
 * nothing was done.
 */
export function tighten(file, alignment, target) {
  if (!alignment?.characters?.length || !hasFfmpeg()) return null;
  const { length, quiet } = silences(file);
  if (!length) return null;
  // each pause keeps a little on both sides; the very start and end keep less
  const cuts = quiet
    .map(([a, b]) => (a < 0.05 ? [0, Math.max(0, b - 0.05)] : b > length - 0.05 ? [a + 0.12, length] : [a + KEEP_PAUSE / 2, b - KEEP_PAUSE / 2]))
    .filter(([a, b]) => b - a > 0.03);
  const removed = cuts.reduce((s, [a, b]) => s + (b - a), 0);
  const tight = length - removed;
  const tempo = target ? Math.min(MAX_TEMPO, Math.max(1, tight / target)) : 1;
  if (!cuts.length && tempo === 1) return null;
  const keep = [];
  let at = 0;
  for (const [a, b] of cuts) {
    if (a > at) keep.push([at, a]);
    at = b;
  }
  if (at < length) keep.push([at, length]);
  const parts = keep.map(([a, b], i) => `[0:a]atrim=start=${a.toFixed(3)}:end=${b.toFixed(3)},asetpts=PTS-STARTPTS[p${i}]`);
  const graph = `${parts.join(";")};${keep.map((_, i) => `[p${i}]`).join("")}concat=n=${keep.length}:v=0:a=1,atempo=${tempo.toFixed(4)}[out]`;
  const tmp = file.replace(/\.mp3$/, ".tight.mp3");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", file, "-filter_complex", graph, "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", tmp]);
  fs.renameSync(tmp, file);
  // a moment of the old take on the new one's clock
  const move = (t) => {
    let gone = 0;
    for (const [a, b] of cuts) {
      if (t >= b) gone += b - a;
      else if (t > a) gone += t - a;
    }
    return Math.max(0, (t - gone) / tempo);
  };
  const moved = {
    characters: alignment.characters,
    character_start_times_seconds: alignment.character_start_times_seconds.map(move),
    character_end_times_seconds: alignment.character_end_times_seconds.map(move),
  };
  const ends = moved.character_end_times_seconds;
  return { alignment: moved, seconds: ends[ends.length - 1], tempo, removed, before: length };
}

/**
 * Writes the lines' MP3s into the public folder, named after the Reel, and
 * returns them as the composition takes them in: file, cue, length in frames,
 * the text and the alignment. A line may also name a local MP3 (`file`,
 * relative to `baseDir`) instead of carrying it as base64: the samples do that.
 */
export function voiceFiles(lines, publicDir, name, { fps = 30, baseDir = ".", format = "" } = {}) {
  if (!Array.isArray(lines) || !lines.length) return [];
  const one = lines.length === 1;
  return lines.map((line, i) => {
    const file = `voice-${name}-${i}.mp3`;
    const out = path.join(publicDir, file);
    const bytes = line.b64 ? Buffer.from(line.b64, "base64") : fs.readFileSync(path.resolve(baseDir, line.file));
    fs.writeFileSync(out, bytes);
    const ends = line.alignment?.character_end_times_seconds ?? [];
    let seconds = Number(line.seconds) || (ends.length ? ends[ends.length - 1] : 0);
    let alignment = line.alignment ?? null;
    // one take for the whole Reel is tightened toward its series' length; separate lines only lose their long pauses
    const t = tighten(out, alignment, one ? (VOICE_TARGET[format] ?? 0) : 0);
    if (t) {
      alignment = t.alignment;
      seconds = t.seconds;
      console.log(`voice ${i}: ${t.before.toFixed(1)} s → ${seconds.toFixed(1)} s (pauses −${t.removed.toFixed(1)} s, tempo ×${t.tempo.toFixed(2)})`);
    }
    return { file, cue: line.cue ?? "all", frames: Math.ceil(seconds * fps), text: line.text, alignment };
  });
}

/** The narrator's files of one Reel, taken away after its render. */
export function dropVoice(publicDir, name) {
  if (!fs.existsSync(publicDir)) return;
  for (const f of fs.readdirSync(publicDir).filter((x) => x.startsWith(`voice-${name}-`))) fs.rmSync(path.join(publicDir, f), { force: true });
}

/** The stretches (seconds) under which the score steps back: where the composition says words are said. */
export const duckOf = (composition) => (composition.props?.tl?.duck ?? []).map(([a, b]) => [a / composition.fps, b / composition.fps]);
