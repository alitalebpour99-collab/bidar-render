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
//
// A book Reel («از کتاب») has no narrator: bookVoice (below) cuts the book's own
// recording instead, and changes nothing of its pace.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/** How long the narration of a Reel should run, at most (seconds); the Reel adds its close of about 3 s. */
export const VOICE_TARGET = { borders: 36, myth: 32, word: 36, quote: 0, figure: 34, quiz: 16, flag: 33, treaty: 34, city: 34, truefalse: 30, five: 30, sweep: 46 };
/** What is left of a pause, per series: a saying (often a verse) keeps its breath between its lines. */
export const KEEP_PAUSES = { quote: 0.5 };
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
export function tighten(file, alignment, target, keepPause = KEEP_PAUSE) {
  if (!alignment?.characters?.length || !hasFfmpeg()) return null;
  const { length, quiet } = silences(file);
  if (!length) return null;
  // each pause keeps a little on both sides; the very start and end keep less
  const cuts = quiet
    .map(([a, b]) => (a < 0.05 ? [0, Math.max(0, b - 0.05)] : b > length - 0.05 ? [a + 0.12, length] : [a + keepPause / 2, b - keepPause / 2]))
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
    const t = tighten(out, alignment, one ? (VOICE_TARGET[format] ?? 0) : 0, KEEP_PAUSES[format] ?? KEEP_PAUSE);
    if (t) {
      alignment = t.alignment;
      seconds = t.seconds;
      console.log(`voice ${i}: ${t.before.toFixed(1)} s → ${seconds.toFixed(1)} s (pauses −${t.removed.toFixed(1)} s, tempo ×${t.tempo.toFixed(2)})`);
    }
    return { file, cue: line.cue ?? "all", frames: Math.ceil(seconds * fps), text: line.text, alignment };
  });
}

// ---------- the book («از کتاب») ----------
// A book Reel has no narrator: its sound is the book's own recording of the
// section (Shahram's, made for the book), which the site names in the props
// (`audioUrl`, public on the site) with the cut (`from`, `to`, seconds). It is
// fetched and cut here, with no change of pace and no pause taken out (only
// 30 ms in and 180 ms out, so the cut does not click), and the karaoke's timing
// is built from the passage's own words, each with its start after `from`
// (docs/contract.md). The line is the beat «read»: src/timeline.ts plays it
// after the silent hook and lights each word from its start to the next one's.

/** The hosts the book's recording may come from: the site, and the address the worker was given. */
const BOOK_HOSTS = () => new Set(["bidar.ahura.cloud", ...[process.env.BIDAR_URL].filter(Boolean).map((u) => { try { return new URL(u).hostname; } catch { return ""; } })]);
const MAX_BOOK_MB = 25;

/** Seconds of an audio file (ffprobe), or 0. */
function lengthOf(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
  const s = Number(String(r.stdout ?? "").trim());
  return Number.isFinite(s) ? s : 0;
}

/**
 * The character timing of the passage, as ElevenLabs' alignment is shaped:
 * every letter of a word from its start to the next word's start (the last
 * word to the end of the cut), the space after it at that moment.
 */
export function bookAlignment(words, seconds) {
  const characters = [];
  const s = [];
  const e = [];
  words.forEach((w, k) => {
    const from = Math.max(0, Math.min(seconds, Number(w.t) || 0));
    const next = k + 1 < words.length ? Math.max(from, Math.min(seconds, Number(words[k + 1].t) || from)) : seconds;
    for (const ch of String(w.w).split("")) {
      characters.push(ch);
      s.push(from);
      e.push(next);
    }
    if (k + 1 < words.length) {
      characters.push(" ");
      s.push(next);
      e.push(next);
    }
  });
  return { characters, character_start_times_seconds: s, character_end_times_seconds: e };
}

/**
 * Cuts `from`–`to` (seconds) of the recording `src` into `out`, with 30 ms in
 * and 180 ms out so the cut does not click, and returns the cut's length.
 *
 * The cut is made inside the filter (atrim, then asetpts so the cut's clock
 * starts at 0) and only then faded. With `-ss` after `-i` the fades would see
 * the recording's own clock: the fade-out, meant for the cut's last 180 ms,
 * fell at `seconds − 0.18` of the RECORDING, and everything after it was
 * silent. A passage from 26.6 s (chapter 3) went mute after 9.4 s of its 36.
 */
export function cutPassage(src, out, from, to) {
  const seconds = Math.round((to - from) * 1000) / 1000;
  if (!(seconds > 5)) throw new Error("the book's cut is too short");
  const fadeOut = Math.max(0, seconds - 0.18).toFixed(3);
  const filter = `atrim=start=${from.toFixed(3)}:end=${to.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.03,afade=t=out:st=${fadeOut}:d=0.18`;
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", src, "-af", filter, "-c:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", out]);
  return seconds;
}

/**
 * Fetches the book's recording named in a book Reel's props, cuts the passage
 * into the public folder (as the Reel's voice file, so dropVoice takes it away)
 * and returns it as the composition takes its lines in.
 */
export async function bookVoice(props, publicDir, name, { fps = 30 } = {}) {
  let url;
  try {
    url = new URL(String(props?.audioUrl ?? ""));
  } catch {
    throw new Error("the book Reel names no recording");
  }
  if (url.protocol !== "https:" || !BOOK_HOSTS().has(url.hostname) || !/^\/book\/audio\/[a-z]{2}\/[a-z0-9-]+\.mp3$/i.test(url.pathname)) throw new Error("the book's recording is not one of the site's");
  if (!hasFfmpeg()) throw new Error("ffmpeg is needed to cut the book's recording");
  const words = Array.isArray(props.words) ? props.words : [];
  if (!words.length) throw new Error("the book Reel has no words");
  let res;
  let why = "";
  for (let n = 1; n <= 3; n += 1) {
    try {
      res = await fetch(url, { headers: { "user-agent": "bidar-render (book)" }, signal: AbortSignal.timeout(60_000) });
      if (res.ok || (res.status >= 400 && res.status < 500)) break;
    } catch (e) {
      res = null;
      // what went wrong on the way (never the content): the network error's code
      why = String(e?.cause?.code ?? e?.cause?.name ?? e?.name ?? "error");
      console.log(`book: fetching the recording, try ${n}: ${why}`);
    }
    await new Promise((r) => setTimeout(r, 3000 * n));
  }
  if (!res?.ok) throw new Error(`the book's recording could not be fetched (${res ? `HTTP ${res.status}` : `no answer: ${why}`})`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 1000 || bytes.length > MAX_BOOK_MB * 1e6) throw new Error("the book's recording is not a sound file of the right size");
  const src = path.join(publicDir, `voice-${name}-src.mp3`);
  const file = `voice-${name}-0.mp3`;
  const out = path.join(publicDir, file);
  fs.writeFileSync(src, bytes);
  try {
    const length = lengthOf(src);
    const from = Math.max(0, Number(props.from) || 0);
    // `to` may pass the end of the file (a passage that ends its section): the file's end is the cut
    const to = Math.min(Number(props.to) || 0, length || Number(props.to) || 0);
    const seconds = cutPassage(src, out, from, to);
    console.log(`book: ${url.pathname.split("/").pop()} cut ${from.toFixed(2)}–${to.toFixed(2)} s (${seconds.toFixed(1)} s of ${length.toFixed(1)} s), ${words.length} words`);
    const text = words.map((w) => String(w.w)).join(" ");
    return [{ file, cue: "read", frames: Math.ceil(seconds * fps), text, alignment: bookAlignment(words, seconds) }];
  } finally {
    fs.rmSync(src, { force: true });
  }
}

/** The narrator's files of one Reel, taken away after its render. */
export function dropVoice(publicDir, name) {
  if (!fs.existsSync(publicDir)) return;
  for (const f of fs.readdirSync(publicDir).filter((x) => x.startsWith(`voice-${name}-`))) fs.rmSync(path.join(publicDir, f), { force: true });
}

/** The stretches (seconds) under which the score steps back: where the composition says words are said. */
export const duckOf = (composition) => (composition.props?.tl?.duck ?? []).map(([a, b]) => [a / composition.fps, b / composition.fps]);
