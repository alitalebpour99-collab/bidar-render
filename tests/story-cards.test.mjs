// The Story and the carousel, ported from Divan's renderer (6 November 2026):
// the site planned none while this renderer said `can=` (nothing beyond the
// Reels). Node only, like the other tests here: what is registered, what the
// worker and the workflow ask for, and the samples in the site's own shape.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const json = (file) => JSON.parse(read(file));

test("the Story and the carousel are compositions, each with its sample", () => {
  const root = read("src/Root.tsx");
  assert.match(root, /<Composition id="story" component=\{Story\} \{\.\.\.frame\} durationInFrames=\{storyDuration\(\)\}/, "the Story: 1080 × 1920");
  assert.match(root, /<Composition id="cards" component=\{Cards\} width=\{CARD_W\} height=\{CARD_H\}/, "the carousel: 1080 × 1350");
  assert.match(root, /durationInFrames: cardsLength\(props\)/, "one frame per card");
  assert.match(read("src/Cards.tsx"), /export const CARD_W = 1080;\nexport const CARD_H = 1350;/);
  assert.match(read("src/Story.tsx"), /const TOTAL = Math\.round\(9\.5 \* FPS\);/, "nine and a half seconds");
  assert.match(read("src/Story.tsx"), /p\.music \? <Audio src=\{staticFile\(p\.music\)\} \/>/, "the bed plays, so the check for holes (finish.mjs) holds");
});

test("the worker says it can draw both, and the workflow's look asks the same", () => {
  const worker = read("worker.mjs");
  assert.match(worker, /const CAN = process\.env\.RENDER_CAN \?\? "story,cards";/);
  assert.match(worker, /if \(job\.format === "cards"\) return renderPictures\(job, serve, t0\);/, "a carousel is drawn as pictures");
  assert.match(worker, /file=slide\$\{i \+ 1\}/, "handed back as slide1, slide2, …");
  assert.match(worker, /file=cover`, \{ method: "POST", headers: \{ "content-type": "image\/jpeg" \}, body: fs\.readFileSync\(files\[0\]\) \}/, "the first card again as the cover");
  assert.match(read(".github/workflows/render.yml"), /\/api\/social\/work\?peek=1&can=story,cards"/, "a waiting Story or carousel starts a run");
  assert.match(read("docs/contract.md"), /This renderer sends `can=story,cards`/);
});

test("the samples are what the site sends (lib/social/formats.ts of bidar)", () => {
  const story = json("samples/story.json");
  for (const k of ["format", "series", "of", "kicker", "title", "mark", "ai", "handle"]) assert.ok(k in story, `the Story's ${k}`);
  assert.equal(story.format, "story");
  assert.equal(story.ai, false);
  const cards = json("samples/cards.json");
  assert.equal(cards.format, "cards");
  assert.ok(cards.cards.length >= 2 && cards.cards.length <= 10, "two to ten cards");
  for (const c of cards.cards) assert.ok(["hook", "list", "figure", "end"].includes(c.kind), c.kind);
  // Bidar's list: a short label in k, the text in v (the other way round from Divan's)
  const list = cards.cards.find((c) => c.kind === "list");
  assert.ok(list.items.every((it) => it.k.length <= 12));
});

test("no «·» or «|» beside Persian in the two compositions", () => {
  for (const file of ["src/Story.tsx", "src/Cards.tsx"]) {
    const src = read(file).split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
    const strings = [...src.matchAll(/"([^"\n]*)"|`([^`\n]*)`|>([^<>{}\n]+)</g)].map((m) => m[1] ?? m[2] ?? m[3] ?? "");
    for (const s of strings) if (/[؀-ۿ]/.test(s)) assert.doesNotMatch(s, /[·|]/, `${file}: «${s}»`);
  }
});
