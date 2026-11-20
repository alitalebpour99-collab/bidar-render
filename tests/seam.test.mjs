// The seam of a loop («یک دوره، یک نشان», the Ahura round of 2026-11-20): the check of the sound at the wrap
// (gate.mjs audioSeam) on made-up sound, and the loop's own bed (music.mjs, folded onto one cycle), which must
// pass it while an ordinary bed (which fades at its end) must not. Node only: no browser, no ffmpeg, no render.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { SEAM, audioSeam } from "../gate.mjs";
import { fold, score } from "../music.mjs";

const RATE = 48000;
const sine = (seconds, f, amp = 0.5, phase = 0) => Float32Array.from({ length: Math.round(seconds * RATE) }, (_, n) => amp * Math.sin(2 * Math.PI * f * (n / RATE) + phase));

/** A WAV of score() (44.1 kHz, stereo, 16 bit) as two float channels. */
function channelsOf(wav) {
  const data = wav.subarray(44);
  const frames = data.length / 4;
  const L = new Float32Array(frames);
  const R = new Float32Array(frames);
  for (let i = 0; i < frames; i += 1) {
    L[i] = data.readInt16LE(i * 4) / 32767;
    R[i] = data.readInt16LE(i * 4 + 2) / 32767;
  }
  return [L, R];
}

test("the thresholds are the round's: SSIM 0.97, 3 dB, a tenth of the peak, 50 ms", () => {
  assert.deepEqual([SEAM.ssim, SEAM.db, SEAM.click, SEAM.window], [0.97, 3, 0.1, 0.05]);
});

test("a tone of whole cycles wraps with no click and no step of level", () => {
  // 220 Hz for exactly 1 s: 220 whole cycles, so the last sample runs into the first
  const r = audioSeam([sine(1, 220), sine(1, 220, 0.5, 0.3)], RATE);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.ok(r.db < 0.1 && !r.silent);
});

test("a click at the wrap fails: the last sample far from the first", () => {
  // the sound drifts up by 0.45 in the middle (slowly: no step inside it), so its end does not meet its start
  const x = sine(1, 220, 0.4);
  for (let n = 0; n < x.length; n += 1) x[n] += 0.45 * Math.min(1, Math.max(0, (n - 0.4 * RATE) / (0.2 * RATE)));
  const r = audioSeam([x], RATE);
  assert.equal(r.ok, false);
  assert.match(r.why, /click/);
});

test("a tone cut mid-cycle clicks (220.5 Hz for 1 s ends half a cycle off)", () => {
  const r = audioSeam([sine(1, 220.5, 0.5, Math.PI / 2)], RATE);
  assert.equal(r.ok, false, JSON.stringify(r));
});

test("a fade at the end is a step of level at the wrap", () => {
  const x = sine(1, 220);
  const n = Math.round(0.2 * RATE);
  for (let i = 0; i < n; i += 1) x[x.length - n + i] *= (n - i) / n;
  const r = audioSeam([x], RATE);
  assert.equal(r.ok, false);
  assert.ok(r.db > SEAM.db, `${r.db.toFixed(1)} dB`);
});

test("silence on both sides is a seam too (a silent format), and says so", () => {
  const r = audioSeam([new Float32Array(RATE), new Float32Array(RATE)], RATE);
  assert.equal(r.ok, true);
  assert.equal(r.silent, true);
});

test("too short a sound is no seam", () => {
  assert.equal(audioSeam([new Float32Array(100)], RATE).ok, false);
});

test("folding: what runs past the end comes in at the start, what comes before the start goes to the end", () => {
  const x = Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8]);
  // a cycle of 4 that starts at index 2: [3+7, 4+8, 5+1, 6+2]
  assert.deepEqual([...fold(x, 4, 2)], [10, 12, 6, 8]);
});

test("the loop's bed is one cycle long and wraps clean; an ordinary bed of the same length does not", () => {
  const seconds = 12;
  const wav = score({ id: "loop", seconds });
  const [L, R] = channelsOf(wav);
  assert.equal(L.length, seconds * 44100, "exactly the film's length, to the sample");
  const r = audioSeam([L, R], 44100);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.ok(!r.silent, "music at the wrap, not a gap");
  // no fade: the level at the wrap is the level of the middle
  const rms = (a) => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
  const mid = rms(L.subarray(L.length / 2, L.length / 2 + 2205));
  const edge = rms(L.subarray(0, 2205));
  assert.ok(Math.abs(20 * Math.log10(edge / mid)) < 6, `edge ${edge.toFixed(3)} against middle ${mid.toFixed(3)}`);
  // an ordinary set-style bed fades its last quarter second: the check catches it
  const plain = channelsOf(score({ id: "belief", seconds, deep: true }));
  assert.equal(audioSeam(plain, 44100).ok, false, "the ordinary bed is not a loop");
  // `loop: true` makes any mood loop
  assert.equal(audioSeam(channelsOf(score({ id: "city", seconds, loop: true })), 44100).ok, true);
});

test("the gate measures the seam on every loop it is handed, and the finisher cuts a loop's sound to its picture", () => {
  const gate = fs.readFileSync(new URL("../gate.mjs", import.meta.url), "utf8");
  assert.match(gate, /if \(plan\?\.cycle\) out\.push\(\.\.\.seamChecks\(file, \{ seconds: plan\.total \/ FPS \}\)\);/);
  assert.match(gate, /add\("seam-video", v >= SEAM\.ssim/);
  const finish = fs.readFileSync(new URL("../finish.mjs", import.meta.url), "utf8");
  assert.match(finish, /asetpts=N\/SR\/TB,apad,atrim=end_sample=\$\{Math\.round\(exact \* 48000\)\}/);
  for (const f of ["../worker.mjs", "../render.mjs"]) {
    const src = fs.readFileSync(new URL(f, import.meta.url), "utf8");
    assert.match(src, /loop: Boolean\(first\.props\.plan\?\.cycle\)/, `${f}: the bed is folded for a loop`);
    assert.match(src, /\{ loop: Boolean\(composition\.props\.plan\?\.cycle\) \}/, `${f}: the sound is cut to the picture`);
  }
  const root = fs.readFileSync(new URL("../src/Root.tsx", import.meta.url), "utf8");
  assert.match(root, /<Composition id="loop" component=\{SetOnly\}/);
  const sample = JSON.parse(fs.readFileSync(new URL("../samples/loop-1.json", import.meta.url), "utf8"));
  assert.equal(sample.format, "loop");
  assert.ok(sample.seconds >= 8 && sample.seconds <= 15);
});
