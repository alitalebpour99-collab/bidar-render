// The badge in a pause (owner, 2026-11-17: «بج رو ببر توی یه مکث»): the like/follow badge comes in a pause of the
// narration inside the close, so its bell is heard on its own; a short breath between two sentences of the close
// when it has no pause that long; never a word cut.   node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { BREATH, MIN_PAUSE, badgeCue, badgeCueCheck, badgeFrom, badgeLead, badgeMoment, badgeRoom, badgeWindow, breathe, needFrames } from "../src/set/badge-sound.js";

const FPS = 30;
const w = (text, from, said, to = said) => ({ text, from, to, said, beat: "end" });
/** A small timeline: the close starts at frame 600, the take is one file from frame 5. */
const tl = (words, total) => ({ total, beats: { a: { from: 0, to: 600 }, end: { from: 600, to: total } }, order: ["a", "end"], words, voice: [{ file: "voice/x.mp3", from: 5 }], speechEnd: total - 84, duck: [[5, total - 84]] });
const planOf = (t, format = "quiz") => {
  const from = badgeFrom(t, t.beats.end.from, format);
  const bell = badgeCue(from, t.words);
  return { from, bell, plan: { hud: [{ id: "badge", kind: "badge", from, to: Math.min(from + 66, t.total - 20), cue: bell.cue }], sfx: bell.sfx ? [bell.sfx] : [] } };
};
/** No sound of the narrator between the bell's frame and the end of its body (the bell's own rule). */
const clear = (t, at) => t.words.every((x) => at + needFrames() - 2 <= x.from || at >= Math.min(x.to, x.said ?? x.to));

test("a pause of the close long enough: the badge comes in it, the earliest one, not on the last frames", () => {
  const words = [w("تو", 605, 615), w("درست", 617, 640), w("زدی؟", 642, 660, 676), w("در", 680, 686), w("کامنت", 688, 700), w("بنویس.", 702, 720, 730)];
  const t = tl(words, 820);
  assert.equal(badgeRoom(t, "quiz"), t, "no breath needed");
  const { from, bell, plan } = planOf(t);
  assert.equal(from, 662, "two frames of air after «زدی»'s last letter, in the pause before «در»");
  assert.equal(bell.sfx.at, from, "the bell on the badge's first frame");
  assert.ok(clear(t, from));
  assert.ok(badgeCueCheck(plan).ok, badgeCueCheck(plan).detail);
  assert.ok(from + 66 <= t.total - 20);
});

test("no pause long enough: a breath of about 0.4 s between the close's two sentences, no word cut", () => {
  // «زدی؟» ends at 660 and «در» starts at 671: 0.37 s, under what the bell needs
  const words = [w("تو", 605, 615), w("درست", 617, 640), w("زدی؟", 642, 660, 668), w("در", 671, 676), w("کامنت", 678, 690), w("بنویس.", 692, 710, 720)];
  const before = tl(words, 804);
  assert.ok((671 - 660) / FPS >= MIN_PAUSE && 671 - 660 < needFrames());
  const m = badgeMoment(before.words, badgeWindow(before.total, 600, badgeLead("quiz")));
  assert.equal(m.from, null);
  assert.ok(m.breath.at > 660 && m.breath.at < 671, "the cut is in the silence between the sentences");
  assert.ok(Math.abs(m.breath.frames / FPS - BREATH) < 0.05 || m.breath.frames === needFrames() - 11);
  const t = badgeRoom(before, "quiz");
  assert.equal(t.total, before.total + m.breath.frames);
  // every word keeps its length and order; the ones after the cut wait the breath
  t.words.forEach((x, i) => {
    const o = before.words[i];
    assert.equal(x.said - x.from, o.said - o.from);
    assert.equal(x.from - o.from, o.from >= m.breath.at ? m.breath.frames : 0);
  });
  // the take is cut there and its second piece plays the rest of the file, later
  assert.deepEqual(t.voice, [{ file: "voice/x.mp3", from: 5, frames: m.breath.at - 5 }, { file: "voice/x.mp3", from: m.breath.at + m.breath.frames, trim: m.breath.at - 5 }]);
  assert.equal(t.beats.end.to, t.total);
  const { from, bell, plan } = planOf(t);
  assert.equal(from, 662);
  assert.equal(bell.sfx.at, from);
  assert.ok(clear(t, from));
  assert.ok(badgeCueCheck(plan).ok, badgeCueCheck(plan).detail);
});

test("one sentence in the close: the silence after its last word, still clear of the loop", () => {
  const words = [w("چند", 605, 615), w("تا", 617, 622), w("را", 624, 628), w("درست", 630, 640), w("گفتی؟", 642, 655, 660)];
  const t = tl(words, 744);
  assert.equal(badgeRoom(t, "truefalse"), t);
  const { from, plan } = planOf(t, "truefalse");
  assert.equal(from, 657);
  assert.ok(badgeCueCheck(plan).ok);
  assert.ok(plan.hud[0].to - from >= 45 && plan.hud[0].to <= t.total - 15);
});

test("a breath never goes into a word", () => {
  const t = tl([w("یک", 605, 640)], 800);
  assert.throws(() => breathe(t, 620, 12));
});

// The samples' real narration (ElevenLabs' alignment): the close of every set-style sample gets its badge in a pause,
// its bell over no word. The words as src/timeline.ts makes them (one take from frame 5; `said` = the last letter).
const SAID = /[\p{L}\p{N}\p{M}]/u;
function sampleTimeline(props, voice) {
  const a = voice.alignment;
  const words = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(voice.text))) {
    let z = m.index + m[0].length - 1;
    const to = 5 + Math.round(a.character_end_times_seconds[z] * FPS);
    while (z > m.index && !SAID.test(voice.text[z])) z -= 1;
    words.push({ text: m[0], from: 5 + Math.round(a.character_start_times_seconds[m.index] * FPS), to, said: Math.min(to, 5 + Math.round(a.character_end_times_seconds[z] * FPS)), at: m.index });
  }
  const say = props.beats.at(-1).say;
  const first = words.find((x) => x.at >= voice.text.lastIndexOf(say));
  const end = 5 + Math.round(voice.seconds * FPS);
  const total = end + Math.round(2.8 * FPS);
  return { total, beats: { end: { from: first.from - 5, to: total } }, order: ["end"], words, voice: [{ file: "v.mp3", from: 5 }], speechEnd: end, duck: [] };
}
const SAMPLES = ["quiz-1", "belief-1", "belief-2", "frontier-1", "frontier-2", "phase1/five-scientists", "phase1/five-scientists-2", "phase1/truefalse-2", "phase1/truefalse-3", "lively/truefalse-3-lively"];

test("the samples: a badge in a pause of the close, its bell over no word, never on the last frames", () => {
  for (const name of SAMPLES) {
    const props = JSON.parse(fs.readFileSync(`samples/${name}.json`, "utf8"));
    const voice = JSON.parse(fs.readFileSync(`samples/${name}.voice.json`, "utf8"));
    const t = badgeRoom(sampleTimeline(props, voice), props.format);
    const { from, bell, plan } = planOf(t, props.format);
    assert.ok(bell.sfx, `${name}: the bell is played (${bell.cue.why ?? ""})`);
    assert.equal(bell.sfx.at, from, name);
    assert.ok(clear(t, from), `${name}: over no word at ${from}`);
    assert.ok(badgeCueCheck(plan).ok, `${name}: ${badgeCueCheck(plan).detail}`);
    assert.ok(from >= t.beats.end.from + badgeLead(props.format) && plan.hud[0].to <= t.total - 20, name);
  }
});
