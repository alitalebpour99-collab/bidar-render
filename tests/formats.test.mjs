// The formats of the round of 2026-10-31 («درست یا غلط؟», «پنج‌تایی», «تاریخِ
// ایران در یک دقیقه», the book's v2): registered, with a bed under every one, so
// the check for holes (finish.mjs, #1) still holds for them: their silent holds
// (the three seconds to guess, the book's title page) are never mute.
// Node and ffmpeg only (the test workflow installs no npm packages).   node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hasBed, score } from "../music.mjs";
import { HOLE_SECONDS, holesOf, silentStretches } from "../finish.mjs";
import { VOICE_TARGET } from "../voice.mjs";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bidar-formats-"));
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

const NEW = ["truefalse", "five", "sweep"];

test("the three new compositions are registered, each with its sample, and the book has one composition", () => {
  const root = read("src/Root.tsx");
  for (const id of NEW) {
    assert.match(root, new RegExp(`<Composition id="${id}" `), `${id} is a composition`);
    assert.ok(fs.existsSync(new URL(`../samples/${id}-1.json`, import.meta.url)), `samples/${id}-1.json is its default`);
  }
  assert.doesNotMatch(root, /id="book2"/, "the book's v2 is the «book» composition itself, not another one");
  const adapt = read("src/adapt.ts");
  for (const [id, list] of [["truefalse", "rounds"], ["five", "items"], ["sweep", "periods"]]) assert.match(adapt, new RegExp(`s\\.format === "${id}" && Array\\.isArray\\(s\\.${list}\\)`), `adapt.ts reads the site's ${id}`);
  assert.match(adapt, /const v2 = p\.v2 !== false;/, "the book draws v2 unless told otherwise");
  for (const id of NEW) assert.ok(VOICE_TARGET[id] > 0, `${id} has a length for its narrator`);
});

test("every format has a bed, the book's room tone among them", () => {
  for (const id of [...NEW, "book", "borders", "quiz"]) assert.equal(hasBed(id), true, `${id} has a bed`);
});

test("the bed of each new format, and the book's room tone, has sound in every second: a silent hold is never a hole", () => {
  for (const id of [...NEW, "book"]) {
    const file = path.join(dir, `${id}.wav`);
    // a Reel's length, with the narrator's pauses ducking nothing (the worst case: the bed alone)
    fs.writeFileSync(file, score({ id, seconds: 40 }));
    assert.deepEqual(silentStretches(file, { min: 0.5 }), [], `${id}: no mute half second in its bed`);
    assert.deepEqual(holesOf(file, 40), [], `${id}: no hole of ${HOLE_SECONDS} s`);
  }
});

test("the tile carries the episode's number, and «درست یا غلط؟» a third stamp", () => {
  const cover = read("src/Cover.tsx");
  assert.match(cover, /<EpisodeChip text=\{props\.episode\} \/>/, "every tile draws the episode's number");
  assert.match(read("src/props.ts"), /episode\?: string/, "CoverProps has the episode");
  const tf = read("src/TrueFalse.tsx");
  assert.match(tf, /"right" \| "wrong" \| "contested"/);
  assert.match(tf, /contested: DESK\.contested/);
  assert.match(read("src/Five.tsx"), /ICONS\[it\.icon\] \?\? Star/, "an item without a drawing of its own gets the girih star");
  assert.match(read("src/Sweep.tsx"), /p\.until/, "an episode of part of the line ends where its last period does");
});
