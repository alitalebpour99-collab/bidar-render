// The museum's night hall (the owner's yes of 2026-11-16): no neon pink or
// violet left in the set, one field colour a period on the tile, every new
// set piece listed for the shared asset library.
//   node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { ERA, eraOf } from "../src/set/era.ts";
import { ACCENT, NAVY } from "../src/set/space.ts";

const read = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), "utf8");
const SET = fs.readdirSync(new URL("../src/set/", import.meta.url)).filter((f) => /\.tsx?$/.test(f)).map((f) => `src/set/${f}`).concat(["src/set/props/Museum.tsx"]);

test("no neon pink or violet in the set", () => {
  const neon = /#ff4d8d|#7b61ff|#a78bfa|123, ?97, ?255|255, ?77, ?141|23, ?212, ?164/i;
  for (const f of SET) assert.ok(!neon.test(read(f)), `${f} still holds a neon colour`);
  for (const [name, hex] of Object.entries(ACCENT)) assert.ok(!neon.test(hex), `ACCENT.${name}`);
});

/** how far apart two colours are, 0 to about 441 */
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const apart = (a, b) => Math.hypot(...rgb(a).map((v, i) => v - rgb(b)[i]));
/** relative luminance against white text */
const lum = (h) => rgb(h).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);

test("a field colour a period: told apart on the grid, dark enough for the tile's white words", () => {
  const keys = Object.keys(ERA);
  assert.ok(keys.length >= 12);
  for (const a of keys) {
    assert.ok((1.05) / (lum(ERA[a].field) + 0.05) >= 4.5, `${a}: white words on ${ERA[a].field}`);
    for (const b of keys) if (a < b) assert.ok(apart(ERA[a].field, ERA[b].field) >= 28, `${a} and ${b} are too alike: ${ERA[a].field} ${ERA[b].field}`);
  }
});

test("the tile's period: the site's word first, then the tile's own words, then its series", () => {
  assert.equal(eraOf({ format: "frontier", title: "ساسانی", big: "ایران تا کجا بود؟" }), "sasanian");
  assert.equal(eraOf({ format: "belief", title: "کوروش", big: "کوروش: باور یا سند؟" }), "achaemenid");
  assert.equal(eraOf({ format: "frontier", title: "ساسانی", era: "qajar" }), "qajar");
  assert.equal(eraOf({ format: "frontier", title: "ساسانی", era: "nothing" }), "sasanian");
  assert.notEqual(eraOf({ format: "quiz", big: "سمرقند امروز کجاست؟" }), eraOf({ format: "truefalse", big: "درست یا غلط؟" }));
  const tiles = ["belief-1", "belief-2", "frontier-1", "frontier-2"].map((n) => JSON.parse(read(`samples/${n}.cover.json`)));
  const fields = tiles.map((c) => ERA[eraOf(c)].field);
  assert.ok(new Set(fields).size >= 3, `the four sample tiles wear ${new Set(fields).size} colours: ${fields.join(" ")}`);
});

test("lapis and parchment: the hall's own palette", () => {
  assert.match(NAVY.ink, /^#f[0-9a-f]{5}$/);
  assert.ok(rgb(NAVY.hall)[2] > rgb(NAVY.hall)[0] + 60, "the wall is blue");
});

test("every new set piece is in the manifest for the shared library, with both names", () => {
  const m = JSON.parse(read("src/set/props/manifest.json"));
  const src = read("src/set/props/Museum.tsx");
  for (const name of ["Plinth", "Vitrine", "RopeBarrier", "Tazhib"]) {
    const item = m.items.find((x) => x.export === name);
    assert.ok(item && item.name_en && item.name_fa && item.depicts && item.made && item.licence && item.tags.length, name);
    assert.ok(src.includes(`export const ${name}`), `${name} is exported`);
  }
});
