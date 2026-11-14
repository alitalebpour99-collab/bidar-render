// The gate of the set style (gate.mjs): the plan's checks on a made-up plan
// that passes, and on one fault of each kind; the measured checks on a few
// seconds of picture and sound made here with ffmpeg.   node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MIDDLE, MIN_TEXT, ZONES, dotBeside, fileChecks, planChecks, verdict, wordsOf } from "../gate.mjs";
import { FinalCheck } from "../finish.mjs";
import { enforce } from "../gate.mjs";

const home = { x: -66, y: 0, z: -110, yaw: -3 };
/** A plan as src/set/plans.ts makes one: 24 s, a camera event every two seconds, home at the end. */
function goodPlan() {
  const total = 24 * 30;
  return {
    style: "set",
    format: "quiz",
    total,
    shots: [{ at: 0, pose: home, move: "cut", push: 40, sway: 0.5 }, ...Array.from({ length: 11 }, (_, i) => ({ at: 60 * (i + 1), pose: { ...home, yaw: i % 2 ? 3 : -3 }, move: "glide", push: 20 })), { at: total - 19, pose: home, move: "glide", push: 0, sway: 0 }],
    punches: [{ at: 20, depth: 24 }],
    objects: [
      { id: "question", kind: "slab", from: 0, to: total, lines: [{ text: "سمرقند امروز در کدام کشور است؟", size: 76, weight: 900 }] },
      { id: "answer", kind: "slab", from: 400, to: 600, claim: true, lines: [{ text: "پاسخ: ازبکستان", size: 52, weight: 900 }], chip: { text: "منبع: اطلسِ تاریخیِ بیدار", size: 30, weight: 600 } },
    ],
    hud: [
      { id: "badge", kind: "badge", box: { x: 82, y: 1483, w: 300, h: 80 }, from: 620, to: 680 },
      { id: "source", kind: "source", box: { x: 402, y: 1470, w: 464, h: 99 }, from: 600, to: total - 12, lines: [{ text: "منبع: اطلسِ تاریخیِ بیدار", size: 32, weight: 600 }, { text: "bidar.ahura.cloud", size: 34, weight: 700 }] },
    ],
    sfx: [{ at: 2, name: "rise" }, { at: 60, name: "swish" }, { at: 400, name: "chime" }, { at: 401, name: "hit" }],
    hook: { text: "سمرقند امروز در کدام کشور است؟", from: 0 },
    boxes: [
      { id: "question", box: { x: 144, y: 300, w: 660, h: 380 }, minSize: 70, from: 0, to: total },
      { id: "answer", box: { x: 144, y: 1100, w: 660, h: 300 }, minSize: 30, from: 404, to: 600 },
    ],
    length: [14, 30],
    badge: true,
  };
}
const failed = (plan, cover = "سمرقند امروز کجاست؟") => planChecks(plan, cover).filter((c) => !c.ok).map((c) => c.id);

test("the zones are the measured ones: header 11 %, rail 14 %, caption rows", () => {
  assert.deepEqual(ZONES, { top: 232, right: 888, left: 56, bottom: 1583 });
  assert.equal(MIN_TEXT, 29);
  assert.deepEqual(MIDDLE, { top: 640, bottom: 1280 });
});

test("a plan made by the rules passes every check", () => {
  assert.deepEqual(failed(goodPlan()), []);
});

test("each fault fails its own check, and only that one", () => {
  const cases = [
    ["hook-words", (p) => (p.hook.text = "این جمله برای قلابِ اول بیش از هفت واژهٔ کامل دارد")],
    ["length", (p) => (p.length = [14, 20])],
    ["moves", (p) => (p.shots = [p.shots[0], ...p.shots.slice(1).filter((s) => s.at < 300 || s.at > 500)])],
    ["loop-plan", (p) => (p.shots[p.shots.length - 1].pose = { ...home, z: 0 })],
    ["safe", (p) => (p.boxes[1].box.y = 1400)],
    ["safe", (p) => (p.boxes[0].box.x = 40)],
    ["text-size", (p) => (p.boxes[1].minSize = 20)],
    ["source", (p) => (p.hud[1].to = p.hud[1].from + 30)],
    ["persian", (p) => (p.objects[0].lines[0].text = "بیدار · حقیقت")],
    ["badge", (p) => (p.hud[0].box.y = 900)],
    ["badge", (p) => (p.hud[0].to = p.hud[0].from + 20)],
    ["badge", (p) => (p.hud[0].from = 300)],
    ["sound-effects", (p) => p.sfx.push({ at: 400, name: "pop" }, { at: 402, name: "tick" })],
  ];
  for (const [id, spoil] of cases) {
    const p = goodPlan();
    spoil(p);
    assert.deepEqual(failed(p), [id], id);
  }
  assert.deepEqual(failed(goodPlan(), "کدام شهر پایتختِ ساسانیان بود؟"), ["cover"]);
  assert.deepEqual(failed(goodPlan(), "پایتخت؟"), ["cover"]);
});

test("the badge switched off is no fault", () => {
  const p = goodPlan();
  p.badge = false;
  p.hud = p.hud.filter((h) => h.kind !== "badge");
  assert.deepEqual(failed(p), []);
});

test("words are counted as a reader counts them; «·» and «|» only beside Persian", () => {
  assert.equal(wordsOf("درست یا غلط؟").length, 3);
  assert.equal(wordsOf("پنج دانشمندِ ایرانی").length, 3);
  assert.equal(dotBeside("بیدار | حقیقت"), true);
  assert.equal(dotBeside("Britannica · Iranica"), false);
});

test("a failing gate throws the owner's Persian reason as a FinalCheck; warn goes on", () => {
  const p = goodPlan();
  p.hook.text = "این جمله برای قلابِ اول بیش از هفت واژهٔ کامل دارد";
  assert.throws(() => enforce({ plan: p, log: () => {} }), (e) => e instanceof FinalCheck && /قلابِ اول/.test(e.message) && e.final === true);
  const r = enforce({ plan: p, mode: "warn", log: () => {} });
  assert.equal(r.ok, false);
  assert.match(verdict(r), /^این ویدیو از بازبینیِ پیش از ارسال رد شد/);
  assert.equal(enforce({ plan: p, mode: "off" }), null);
});

test("the measured checks: a still picture fails, a moving one that loops passes; the loudness is read", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bidar-gate-test-"));
  const ff = (...a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a]);
  const still = path.join(dir, "still.mp4");
  ff("-f", "lavfi", "-i", "color=c=0x0a1433:s=270x480:d=6:r=30", "-f", "lavfi", "-i", "sine=frequency=220:duration=6", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", still);
  const ids = (file) => fileChecks(file).filter((c) => !c.ok).map((c) => c.id);
  assert.ok(ids(still).includes("hook-motion"));
  assert.ok(ids(still).includes("still"));
  // a bar that runs right and comes back: it moves all the time and ends where it began
  const moving = path.join(dir, "moving.mp4");
  ff("-f", "lavfi", "-i", "color=c=0x0a1433:s=270x480:d=6:r=30", "-f", "lavfi", "-i", "color=c=0x17d4a4:s=60x60:d=6:r=30", "-f", "lavfi", "-i", "sine=frequency=220:duration=6", "-filter_complex", "[0:v][1:v]overlay=x='100+90*sin(2*PI*t/6)':y=200[v]", "-map", "[v]", "-map", "2:a", "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", moving);
  const m = fileChecks(moving);
  assert.equal(m.find((c) => c.id === "hook-motion").ok, true, m.find((c) => c.id === "hook-motion").detail);
  assert.equal(m.find((c) => c.id === "still").ok, true);
  assert.equal(m.find((c) => c.id === "loop").ok, true, m.find((c) => c.id === "loop").detail);
  assert.match(m.find((c) => c.id === "loudness").detail, /LUFS, true peak/);
  fs.rmSync(dir, { recursive: true, force: true });
});
