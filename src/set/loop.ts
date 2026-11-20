// «یک دوره، یک نشان»: the seamless loop (the Ahura round of 20 November 2026;
// bidar lib/social/loop.ts). One period of the atlas and its object in the
// hall of arches, drawn as a cycle of exactly `seconds`:
//
//   - the object (a column of Persepolis, a Sasanian coin with its fire altar,
//     a dome…) stands in its glass case from the first frame to past the last
//     and turns a whole number of turns in the cycle, so its last frame is one
//     step before its first;
//   - the camera goes round it in four soft glides and in the last 19 frames
//     glides back to the first frame's place (at rest on both sides of the
//     wrap: no jump of place and none of speed);
//   - the label (the period's name, its years in gold, its capitals) and the
//     source line are on screen all the time, so no text comes or goes at the
//     wrap; the badge comes once, in the middle of the second half, and is
//     gone 20 frames before the end;
//   - the hall's dust and the glass's shine run on the cycle too (Hall.tsx,
//     `plan.cycle`), and no effect sounds over the wrap;
//   - the bed is one cycle long and folded into itself (music.mjs `loop`).
//
// The gate (gate.mjs) measures the seam on the file: the first and the last
// frame (SSIM 0.97 or more) and the sound at the wrap (level and click).
// Pure numbers and measured text, as plans.ts; Hall.tsx draws it.
import { noDot } from "../kit";
import type { Timeline } from "../props";
import { fit, fitOne, linesHeight } from "./fit";
import { badgeCue } from "./badge-sound";
import { MODEL_SIZE } from "./models";
import { sourceLines } from "./doc";
import { BASE, INNER, SX, TEXT, Z0, at, slab, bottomOf } from "./plans";
import { COL, FPS, HZ, ZONES, frameCover, orbit, textBoxes, type Emblem, type Hud, type Model, type Obj, type Plan, type Shot, type Sfx } from "./space";

/** What the site sends (bidar lib/social/props.ts LoopProps). */
export type LoopSite = {
  format: "loop";
  kicker: string;
  hook: { text: string; figure: string | null } | null;
  episode?: number;
  period: string;
  name: string;
  years: string;
  capitals: string[];
  model: Model;
  emblem?: Emblem;
  seconds: number;
  source: string;
  foot?: string;
};

/** The cycle's length in frames: the site's seconds, 8 to 15, rounded to a whole number of frames divisible by 6 (the shine and the dust's periods divide it). */
export function loopFrames(seconds: unknown): number {
  const s = Math.max(8, Math.min(15, Number(seconds) || 12));
  return Math.round((s * FPS) / 6) * 6;
}

/** The turns the object makes in one cycle: a coin turns twice (its face comes round more often), the rest once. */
export const turnsOf = (model: Model) => (model === "coin" ? 2 : 1);

/** The timeline of a loop: no narrator, three stops (bidar lib/social/beats.ts loopBeats), the cycle's length. */
export function loopTimeline(total: number): Timeline {
  const end = total - 19;
  return { total, beats: { start: { from: 0, to: 45 }, turn: { from: 45, to: end }, end: { from: end, to: total } }, order: ["start", "turn", "end"], words: [], voice: [], speechEnd: 0, duck: [] };
}

/** the world's y of a screen row for a thing read from the base distance */
const rowAt = (screenY: number) => Math.round((screenY - HZ) * (BASE / 1000));

export function planLoop(p: LoopSite, tl: Timeline, opts: { badge: boolean }): Plan {
  const T = tl.total;
  const objects: Obj[] = [];
  const kicker = noDot(p.kicker || "یک دوره، یک نشان");

  // the label, from before the first frame to past the last: the series in its tag, the name big, the years in gold, the capitals
  const name = fit({ text: noDot(p.name), width: INNER, maxLines: 1, size: 120, min: 84, weight: 900 }).lines;
  const years = fitOne(noDot(p.years), INNER, 72, 800, TEXT);
  const capText = `${p.capitals.length > 1 ? "پایتخت‌ها" : "پایتخت"}: ${p.capitals.join("، ")}`;
  const caps = fit({ text: noDot(capText), width: INNER, maxLines: 2, size: 54, min: TEXT, weight: 700 }).lines.map((l) => ({ ...l, color: "#cdd6f4" }));
  const label = slab("label", { top: rowAt(300), z: Z0 }, -30, T + 60, [...name, { ...years, color: "#ffd23f" }, ...caps], { tag: kicker, enter: "none", claim: true });
  objects.push(label);

  // the object, in its case under the label: it turns a whole number of turns in the cycle (degrees a second)
  const objTop = bottomOf(label) + 40;
  const objBottom = rowAt(1300);
  const [mw, mh] = MODEL_SIZE[p.model] ?? MODEL_SIZE.book;
  const height = Math.max(260, Math.min(520, objBottom - objTop));
  const k = Math.min(height / mh, 700 / mw);
  const turns = turnsOf(p.model);
  objects.push({
    id: "object",
    kind: "artifact",
    model: p.model,
    emblem: p.emblem,
    at: [SX, Math.round((objTop + objBottom) / 2), Z0 + 40],
    w: Math.round(mw * k),
    h: Math.round(mh * k),
    from: 0,
    to: T + 60,
    enter: "none",
    spin: { from: p.model === "coin" ? -30 : 0, speed: (360 * turns * FPS) / T },
    states: [{ at: -20, glow: 0.6 }],
  });

  // the camera: home, then four glides round the case, then home again in the last 19 frames (finishLoop)
  const home = orbit(at(0), BASE + 40, -3, 0);
  const stops: [number, number, number][] = [
    [BASE + 10, 3, 18],
    [BASE - 10, -4, -12],
    [BASE + 20, 4, 10],
    [BASE, -2, -16],
  ];
  const span = T - 19 - 12;
  const shots: Shot[] = [{ at: 0, pose: home, move: "cut", push: 0, sway: 0, why: "home: the label and the object" }];
  stops.forEach(([d, a, lift], i) => shots.push({ at: 12 + Math.round((i * span) / stops.length), pose: orbit(at(0), d, a, lift), move: "glide", push: 6, sway: 0.3, why: `round the case ${i + 1}` }));
  shots.push({ at: T - 19, pose: home, move: "glide", push: 0, sway: 0, why: "back to the first picture (loop)" });

  // effects: a soft swish on each glide but the one that comes home; none in the last second, none over the wrap
  const sfx: Sfx[] = shots.slice(1, -1).map((s) => ({ at: s.at, name: "swish" as const, volume: 0.12, why: s.why }));

  // the source in full on two lines across the bottom, all the time; the badge and the address on the row above it
  const hud: Hud[] = [];
  const srcLines = sourceLines(p.source);
  const h = Math.ceil(linesHeight(srcLines, 1.35)) + 8;
  const srcBox = { x: COL.left, y: ZONES.bottom - 14 - h, w: COL.right - COL.left, h };
  // from before the first frame: its fade-in is behind the wrap, so frame 0 shows it whole, as the last frame does
  hud.push({ id: "source", kind: "source", box: srcBox, from: -8, to: T + 60, lines: srcLines, align: "start" });
  const rowY = srcBox.y - 12 - 80;
  if (opts.badge) {
    const from = T - 20 - 66;
    const bell = badgeCue(from, []);
    hud.push({ id: "badge", kind: "badge", box: { x: COL.left, y: rowY, w: 300, h: 80 }, from, to: from + 66, cue: bell.cue });
    if (bell.sfx) sfx.push(bell.sfx);
  }
  const addr = { ...fitOne("bidar.ahura.cloud", COL.right - COL.left - 330, 42, 700), color: "#f4f6ff" };
  hud.push({ id: "address", kind: "address", box: { x: COL.left + 330, y: rowY, w: COL.right - COL.left - 330, h: 80 }, from: -8, to: T + 60, lines: [addr], align: "start" });

  return {
    style: "set",
    format: "loop",
    total: T,
    shots,
    punches: [],
    objects,
    hud,
    sfx: sfx.filter((s) => s.at >= 6 && s.at <= T - 36).sort((a, b) => a.at - b.at),
    hook: { text: noDot(`${p.name} ${p.years}`), from: 0 },
    boxes: textBoxes(objects, shots, []),
    frames: frameCover(objects, hud, shots, [], T),
    length: [8, 15],
    badge: opts.badge,
    cycle: T,
  };
}
