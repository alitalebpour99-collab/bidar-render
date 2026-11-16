// The badge's bell (owner, 2026-11-16): Bidar's soft museum bell as the channel badge comes, off the narrator's
// words, under the narrator, and the gate's badge-sound check.   node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { BADGE_CUE, CUE_FILE_PEAK_DB, VOICE_PEAK_DB, badgeCue, badgeCueCheck } from "../src/set/badge-sound.js";
import { FLAVOURS, LEVEL, RANGE } from "../src/badge-cue.mjs";

const plan = (bell, cue, from = 620) => ({ hud: [{ id: "badge", kind: "badge", from, to: from + 66, cue }], sfx: bell ? [bell] : [] });

test("one soft bell, short, on the badge's first frame in a pause, LEVEL dB under the narrator", () => {
  assert.equal(FLAVOURS.bidar.notes.length, 1);
  const { sfx, cue } = badgeCue(620, [{ from: 500, to: 610 }]);
  assert.equal(sfx.name, BADGE_CUE);
  assert.equal(sfx.at, 620);
  assert.equal(cue.level, LEVEL);
  assert.ok(Math.abs(CUE_FILE_PEAK_DB + 20 * Math.log10(sfx.volume) - VOICE_PEAK_DB - LEVEL) < 0.1);
  assert.ok(badgeCueCheck(plan(sfx, cue)).ok);
});

test("moved to the nearest pause, or left out when there is none", () => {
  const moved = badgeCue(620, [{ from: 500, to: 625 }, { from: 660, to: 700 }]);
  assert.ok(moved.sfx.at >= 627 && moved.sfx.at <= 632, String(moved.sfx.at));
  assert.ok(badgeCueCheck(plan(moved.sfx, moved.cue)).ok);
  const none = badgeCue(620, [{ from: 500, to: 625 }, { from: 640, to: 700 }]);
  assert.equal(none.sfx, null);
  assert.ok(badgeCueCheck(plan(null, none.cue)).ok, "left out, with its reason");
});

test("the gate fails a bell over a word, a badge without its bell, a bell without a badge", () => {
  const { sfx, cue } = badgeCue(620, []);
  assert.equal(badgeCueCheck(plan(sfx, { ...cue, speech: [[615, 640]] })).ok, false);
  assert.equal(badgeCueCheck(plan(null, cue)).ok, false);
  assert.equal(badgeCueCheck({ hud: [], sfx: [sfx] }).ok, false);
  assert.ok(badgeCueCheck({ hud: [], sfx: [] }).ok);
  assert.ok(RANGE[0] <= LEVEL && LEVEL <= RANGE[1]);
});
