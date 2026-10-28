// The last step of every Reel, for the worker and the hand render alike.
import { execFileSync } from "node:child_process";
import fs from "node:fs";

/**
 * The last step of a Reel, as Iforia does it: one loudness for every video
 * (−14 LUFS, true peak −1.5 dB, what short-video apps play at), then a check
 * that the file is as long as its composition and has sound. Needs ffmpeg on
 * the machine (the workflows install it); without it the video is handed back
 * as rendered. A check that fails throws, so the render counts as failed and is
 * tried again.
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
  return `levelled to −14 LUFS, ${length.toFixed(1)} s with sound`;
}

