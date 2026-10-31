// The last step of every Reel, for the worker and the hand render alike.
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";

/** Below this the sound is taken for none at all (a mute stretch decodes to −inf; the quietest bed is far above it). */
const SILENT_DB = -60;
/** A mute stretch this long inside a Reel is a broken sound track, not a pause. */
export const HOLE_SECONDS = 4;
/** The opening may be quiet (the book's title page waits for its first word); a hole is looked for after it. */
const LEAD_SECONDS = 1.5;

const FA = "۰۱۲۳۴۵۶۷۸۹";
const faNum = (n) => String(Math.round(n)).replace(/\d/g, (d) => FA[Number(d)]);

/**
 * A check of the finished file that will fail the same way however often the
 * Reel is made again: `final` tells the worker (and the site) not to try again,
 * and its message is the plain Persian the owner is shown.
 */
export class FinalCheck extends Error {
  constructor(message) {
    super(message);
    this.name = "FinalCheck";
    this.final = true;
  }
}

/** The stretches of total silence in a file, as [start, end] seconds (ffmpeg silencedetect). */
export function silentStretches(file, { noise = SILENT_DB, min = HOLE_SECONDS } = {}) {
  const log = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-vn", "-af", `silencedetect=noise=${noise}dB:d=${min}`, "-f", "null", "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).stderr ?? "";
  const starts = [...log.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  // a silence still running at the end of the file has a start and no end
  return starts.map((s, i) => [s, ends[i] ?? Infinity]);
}

/**
 * The holes of a Reel's sound: mute stretches of HOLE_SECONDS or more that
 * begin after the opening and end before the file does. The quiet close of a
 * Reel (the book's last card) runs to the end and is not one.
 */
export function holesOf(file, length) {
  return silentStretches(file).filter(([a, b]) => a >= LEAD_SECONDS && b < length - 0.25);
}

/** The owner's words for a hole: «صدای ویدیو از ثانیهٔ ۱۴ تا ۴۰ قطع است…». */
export const holeReason = ([a, b]) => `صدای ویدیو از ثانیهٔ ${faNum(a)} تا ${faNum(b)} قطع است، پس این ویدیو فرستاده نشد.`;

/**
 * The last step of a Reel, as Iforia does it: one loudness for every video
 * (−14 LUFS, true peak −1.5 dB, what short-video apps play at), then a check
 * that the file is as long as its composition, has sound, and that its sound
 * has no hole. Needs ffmpeg on the machine (the workflows install it); without
 * it the video is handed back as rendered. A check that fails throws, so the
 * render counts as failed; a hole is a FinalCheck (it would come back the same).
 */
export function finish(file, seconds) {
  const has = (bin) => {
    try {
      execFileSync(bin, ["-version"], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  };
  if (!has("ffmpeg") || !has("ffprobe")) return "not levelled (no ffmpeg)";
  const tmp = file.replace(/\.mp4$/, ".level.mp4");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", file, "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", tmp], { stdio: "inherit" });
  fs.renameSync(tmp, file);
  const probe = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", file]).toString());
  const length = Number(probe.format?.duration ?? 0);
  const audio = (probe.streams ?? []).some((s) => s.codec_type === "audio");
  if (!audio) throw new Error("check: the video has no sound");
  if (Math.abs(length - seconds) > 1.2) throw new Error(`check: the video is ${length.toFixed(1)} s long, its composition ${seconds.toFixed(1)} s`);
  if (fs.statSync(file).size < 200_000) throw new Error("check: the video file is too small");
  const holes = holesOf(file, length);
  if (holes.length) {
    console.log(`check: the sound is mute ${holes.map(([a, b]) => `${a.toFixed(1)}–${b.toFixed(1)} s`).join(", ")}`);
    throw new FinalCheck(holeReason(holes[0]));
  }
  return `levelled to −14 LUFS, ${length.toFixed(1)} s with sound, no hole in it`;
}
