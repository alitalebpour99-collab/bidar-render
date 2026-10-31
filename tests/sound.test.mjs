// The book's cut and the check for holes in a Reel's sound (voice.mjs
// cutPassage, finish.mjs holesOf), on sound made here with ffmpeg: no network,
// no render.   node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { cutPassage } from "../voice.mjs";
import { FinalCheck, HOLE_SECONDS, holeReason, holesOf, silentStretches } from "../finish.mjs";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bidar-sound-"));
const ff = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args]);
const tone = (seconds) => `sine=frequency=220:sample_rate=44100:duration=${seconds}`;
const mute = (seconds) => `anullsrc=r=44100:cl=mono:d=${seconds}`;
/** A file of tones and mute stretches, one after another: [["tone", 5], ["mute", 6], …]. */
function track(name, parts) {
  const inputs = parts.flatMap(([kind, s]) => ["-f", "lavfi", "-i", kind === "tone" ? tone(s) : mute(s)]);
  const out = path.join(dir, name);
  ff(...inputs, "-filter_complex", `${parts.map((_, i) => `[${i}:a]`).join("")}concat=n=${parts.length}:v=0:a=1[a]`, "-map", "[a]", "-c:a", "aac", "-b:a", "128k", out);
  return out;
}
/** Seconds of the file with no sound at all, second by second (−inf RMS). */
function muteSeconds(file) {
  const log = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "asetnsamples=44100,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level", "-f", "null", "-"], { encoding: "utf8" }).stderr ?? "";
  return [...log.matchAll(/RMS_level=(\S+)/g)].map((m, i) => [i, m[1]]).filter(([, v]) => v === "-inf").map(([i]) => i);
}

test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

test("a passage cut from the middle of a recording keeps its sound to the end (chapter 3's hole)", () => {
  const src = path.join(dir, "section.mp3");
  ff("-f", "lavfi", "-i", tone(74), "-c:a", "libmp3lame", "-b:a", "64k", src);
  const out = path.join(dir, "cut.mp3");
  // book-1 of the samples: chapter 3, section 4, from 26.591 to 62.803 s
  const seconds = cutPassage(src, out, 26.591, 62.803);
  assert.equal(seconds, 36.212);
  const length = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out]).toString());
  assert.ok(Math.abs(length - 36.21) < 0.1, `the cut is ${length} s long`);
  assert.deepEqual(muteSeconds(out), [], "no second of the cut is mute");
  assert.deepEqual(silentStretches(out, { min: 0.5 }), [], "no mute stretch at all");
});

test("a cut from the start is as it was", () => {
  const src = path.join(dir, "start.mp3");
  ff("-f", "lavfi", "-i", tone(40), "-c:a", "libmp3lame", "-b:a", "64k", src);
  const out = path.join(dir, "start-cut.mp3");
  assert.equal(cutPassage(src, out, 0, 35.45), 35.45);
  assert.deepEqual(muteSeconds(out), []);
});

test("a cut shorter than five seconds is refused", () => {
  assert.throws(() => cutPassage(path.join(dir, "none.mp3"), path.join(dir, "x.mp3"), 10, 14), /too short/);
});

test("a mute stretch in the middle of a Reel is a hole", () => {
  const file = track("hole.m4a", [["tone", 5], ["mute", 6], ["tone", 5]]);
  const holes = holesOf(file, 16);
  assert.equal(holes.length, 1);
  assert.ok(Math.abs(holes[0][0] - 5) < 0.2 && Math.abs(holes[0][1] - 11) < 0.2, JSON.stringify(holes));
});

test("the quiet opening, a quiet close to the end and a short pause are not holes", () => {
  // the book's title page: a paper sound, then three seconds before the first word; its last card: four and a half quiet seconds
  const book = track("book.m4a", [["tone", 0.4], ["mute", 3], ["tone", 30], ["mute", 4.5]]);
  assert.deepEqual(holesOf(book, 37.9), []);
  // a quiz's count of five silent seconds always has its bed and its ticks: a pause shorter than the limit is no hole
  const pause = track("pause.m4a", [["tone", 10], ["mute", HOLE_SECONDS - 1], ["tone", 10]]);
  assert.deepEqual(holesOf(pause, 10 + HOLE_SECONDS - 1 + 10), []);
});

test("the owner is told in plain Persian, and the check says it will fail the same way again", () => {
  const reason = holeReason([13.4, 40.2]);
  assert.equal(reason, "صدای ویدیو از ثانیهٔ ۱۳ تا ۴۰ قطع است، پس این ویدیو فرستاده نشد.");
  assert.doesNotMatch(reason, /[·|]/);
  const e = new FinalCheck(reason);
  assert.equal(e.final, true);
  assert.equal(e.message.split("\n").length, 1);
  assert.ok(e.message.length <= 240, "the worker sends at most 240 characters");
});
