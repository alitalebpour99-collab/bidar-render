// The set plans of the two series the owner starred on 2026-11-15 (hub
// ali-list-1112/viral-formats-1115.md, section ۳):
//
//   belief    «باور یا سند؟»: a numbered series. The series' question and the
//             episode's object (the Cyrus Cylinder, a column of Persepolis, a
//             coin…) from the first frame; the belief word for word with the
//             stamp «باور»; down the hall to the object close and the
//             record's own sentences, each with its sources in full; back to
//             the belief, where the site's trust label comes down as the
//             stamp قطعی, محتمل or مورد اختلاف; the call to comment; the loop.
//   frontier  «مرز ایران، دوره به دوره»: one map board in the hall. The hook
//             zooms the map out and back in under «ایران ۲۵۰۰ سال پیش تا کجا
//             بود؟»; six periods, each its extent (Cliopatria), its name and
//             years, its object (a column, a coin with its emblem, a dome…)
//             and the stamp of the data; the episode's period held longer
//             with the date its extent shows and its reach; today's border in
//             gold; the call to comment; the loop.
//
// Both write every source in full on two lines across the bottom of the
// screen while the sentence or the extent it backs is on screen (not on a
// small chip), the badge and the address on the row above it at the close.
// Pure numbers and measured text, as plans.ts; Hall.tsx draws them, gate.mjs
// checks them (with `stamp` and `cta`, which these two must pass).
import { faDigits, noDot } from "../kit";
import type { Timeline } from "../props";
import { fit, fitOne, linesHeight } from "./fit";
import { badgeCue } from "./badge-sound";
import { MODEL_SIZE } from "./models";
import { ANSWER, BASE, INNER, LENGTH, SX, TEXT, Z0, at, beat, bottomOf, has, keepMoving, openPush, slab, thin, type SetFormat } from "./plans";
import { COL, FPS, HZ, ZONES, frameCover, orbit, textBoxes, type Accent, type Emblem, type Hud, type Line, type MapStop, type Model, type Obj, type Plan, type Punch, type Sfx, type Shot } from "./space";

// ---------- what the site sends (bidar lib/social/props.ts BeliefProps, FrontierProps) ----------
export type Tier = "FACT" | "CONTESTED" | "ALLEGATION";
/** The stamp of each trust tier of the site (lib/knowledge/types.ts): the owner's three words. */
export const STAMP_OF: Record<Tier, string> = { FACT: "قطعی", CONTESTED: "مورد اختلاف", ALLEGATION: "محتمل" };
export const STAMP_WORDS = Object.values(STAMP_OF);
const STAMP_ACCENT: Record<string, Accent> = { قطعی: "right", "مورد اختلاف": "maybe", محتمل: "gold" };

export type BeliefSite = {
  format: "belief";
  episode?: number;
  kicker: string;
  hook: { text: string; figure: string | null } | null;
  topic: string;
  claim: string;
  model: Model;
  emblem?: Emblem;
  proofs: { text: string; src: string }[];
  verdict: { tier: Tier; stamp: string; label: string };
  cta: { q: string; a: string };
  source: string;
  foot?: string;
};

export type FrontierFrame = {
  id: string;
  name: string;
  years: string;
  when?: string;
  /** the focus of the episode only: its reach in the atlas's words, and its short-lived peak's label */
  line?: string;
  peakLabel?: string;
  model: Model;
  emblem?: Emblem;
  geometry: unknown;
  peak?: unknown;
  capital?: [number, number];
  stamp: string;
  source: string;
  focus?: boolean;
};
export type FrontierSite = {
  format: "frontier";
  episode?: number;
  kicker: string;
  hook: { text: string; figure: string | null } | null;
  frames: FrontierFrame[];
  today: { label: string; geometry: unknown; stamp: string; source: string };
  cta: { q: string; a: string };
  source: string;
  foot?: string;
};

// ---------- the parts both share ----------
/** the lowest a slab's bottom may stand (world): above the two lines of source, even in a punch */
const LOW_DOC = 640;
/** the world's y of a screen row for a thing read from the base distance (scale about 0.93) */
const rowAt = (screenY: number) => Math.round((screenY - HZ) * (BASE / 1000));
/** the source runs the full text column, two lines of 40 px, just above the caption rows */
const SRC_W = COL.right - COL.left;
const SRC_SIZE = 40;
const SRC_LEAD = 1.35;
const srcBottom = ZONES.bottom - 14;

/** A source in full, on two lines across the column (never cut; a source longer than two lines shows as it is and the gate's `clip` and `source-lines` fail it). */
export function sourceLines(text: string): Line[] {
  const raw = noDot(String(text).replace(/^\s*منبع(?:‌ها)?\s*[:：]\s*/, ""));
  // one line when it fits; else broken between two sources when each fits its line, so no title is split
  const one = fitOne(`منبع: ${raw}`, SRC_W, SRC_SIZE, 600, SRC_SIZE);
  const tidy = (ls: (Line & { overflow?: boolean })[]): Line[] => ls.map(({ overflow: _o, ...l }) => ({ ...l, color: "#c3cbe6" }));
  if (!one.overflow) return tidy([one]);
  const parts = raw.split(/(?<=[;؛،])\s+/);
  let best: Line[] | null = null;
  for (let k = 1; k < parts.length; k += 1) {
    const a = fitOne(`منبع: ${parts.slice(0, k).join(" ")}`, SRC_W, SRC_SIZE, 600, SRC_SIZE);
    const b = fitOne(parts.slice(k).join(" "), SRC_W, SRC_SIZE, 600, SRC_SIZE);
    if (a.overflow || b.overflow) continue;
    if (!best || Math.abs((a.w ?? 0) - (b.w ?? 0)) < Math.abs((best[0].w ?? 0) - (best[1].w ?? 0))) best = [a, b];
  }
  if (best) return tidy(best);
  const r = fit({ text: `منبع: ${raw}`, width: SRC_W, maxLines: 2, size: SRC_SIZE, min: SRC_SIZE, weight: 600 });
  return r.lines.map((l) => ({ ...l, color: "#c3cbe6" }));
}
const srcBox = (lines: Line[]) => {
  const h = Math.ceil(linesHeight(lines, SRC_LEAD)) + 8;
  return { x: COL.left, y: srcBottom - h, w: SRC_W, h };
};

type Parts = { shots: Shot[]; punches: Punch[]; objects: Obj[]; sfx: Sfx[]; hook: string; closeAt: number; sources: { from: number; to: number; text: string }[]; close: string; stamps: { id: string; word: string }[]; cta: string };

function finishDoc(format: SetFormat, tl: Timeline, p: Parts, opts: { badge: boolean }): Plan {
  const total = tl.total;
  const first = p.shots[0];
  p.shots.push({ at: total - 19, pose: first.pose, move: "glide", push: 0, sway: 0, why: "back to the first picture (loop)" });
  keepMoving(p.shots, p.punches, total - 19);
  for (const s of p.shots.slice(1)) p.sfx.push(s.move === "whip" ? { at: s.at - 2, name: "whoosh", volume: 0.26, why: s.why } : { at: s.at, name: "swish", volume: 0.14, why: s.why });
  for (const o of p.objects) if (o.enter === "pop" && o.kind !== "stamp") p.sfx.push({ at: o.from, name: "pop", volume: 0.22, why: `${o.id} in` });
  for (const o of p.objects) if (o.enter === "rise" && o.kind === "slab") p.sfx.push({ at: o.from, name: "paper", volume: 0.16, why: `${o.id} rises` });

  const hud: Hud[] = [];
  // the source of what is on screen, in full on two lines, while it is there
  p.sources.forEach((s, i) => {
    const lines = sourceLines(s.text);
    hud.push({ id: `source${i + 1}`, kind: "source", box: srcBox(lines), from: s.from, to: Math.min(s.to, p.closeAt), lines, align: "start" });
  });
  // the close: every source of the Reel, and on the row above it the badge and the address
  const closeLines = sourceLines(p.close);
  const closeBox = srcBox(closeLines);
  hud.push({ id: "source", kind: "source", box: closeBox, from: p.closeAt, to: total - 12, lines: closeLines, align: "start" });
  const rowY = closeBox.y - 12 - 80;
  if (opts.badge) {
    const from = p.closeAt + 16;
    // its bell (owner 2026-11-16, badge-sound.js): on its first frame, or the nearest pause, or none
    const bell = badgeCue(from, tl.words);
    hud.push({ id: "badge", kind: "badge", box: { x: COL.left, y: rowY, w: 300, h: 80 }, from, to: Math.min(from + 66, total - 20), cue: bell.cue });
    if (bell.sfx) p.sfx.push(bell.sfx);
  }
  const addr = { ...fitOne("bidar.ahura.cloud", SRC_W - 330, 42, 700), color: "#f4f6ff" };
  hud.push({ id: "address", kind: "address", box: { x: COL.left + 330, y: rowY, w: SRC_W - 330, h: 80 }, from: p.closeAt, to: total - 12, lines: [addr], align: "start" });

  return {
    style: "set",
    format,
    total,
    shots: p.shots,
    punches: p.punches,
    objects: p.objects,
    hud,
    sfx: thin(p.sfx),
    hook: { text: p.hook, from: 0 },
    boxes: textBoxes(p.objects, p.shots, p.punches),
    frames: frameCover(p.objects, hud, p.shots, p.punches, total),
    length: LENGTH[format],
    badge: opts.badge,
    stamps: p.stamps,
    cta: p.cta,
  };
}

/** An artifact of the world, sized from its model to `height` (no wider than `maxW`). */
function artifact(id: string, model: Model, emblem: Emblem | undefined, centre: [number, number, number], height: number, from: number, to: number, extra: Partial<Obj> = {}, maxW = 620): Obj {
  const [mw, mh] = MODEL_SIZE[model];
  const k = Math.min(height / mh, maxW / mw);
  return { id, kind: "artifact", model, emblem, at: centre, w: Math.round(mw * k), h: Math.round(mh * k), from, to, enter: "none", spin: { from: model === "coin" ? -30 : 0, speed: model === "coin" ? 70 : model === "cylinder" ? 26 : 18 }, ...extra };
}

/** The call to comment: the question, and the answer to write, in gold. */
function ctaSlab(cta: { q: string; a: string }, top: number, z: number, from: number, to: number): Obj {
  const q = fit({ text: noDot(cta.q), width: INNER, maxLines: 2, size: 68, min: TEXT, weight: 900 }).lines;
  const a = fitOne(noDot(cta.a), INNER, 60, 800, TEXT);
  return slab("cta", { top, z }, from, to, [...q, { ...a, color: "#ffd23f" }], { enter: "pop" });
}

/** A stamp of the data, its word as the site gives it, tilted on a slab's corner. */
function stampObj(id: string, word: string, centre: [number, number, number], from: number, to: number, size = 84, tilt = -6): Obj {
  const w = fitOne(noDot(word), 560, size, 900, TEXT + 4);
  const sw = Math.round((w.w ?? 300) + 110);
  return { id, kind: "stamp", at: centre, w: sw, h: Math.round(w.size * 1.6), from, to, enter: "pop", tilt, accent: STAMP_ACCENT[word] ?? "maybe", word: { ...w, weight: 900, role: "answer" } };
}

// ---------- «باور یا سند؟» ----------
export function planBelief(p: BeliefSite, tl: Timeline, opts: { badge: boolean }): Plan {
  const T = tl.total;
  const start = beat(tl, "start");
  const ask = has(tl, "ask") ? beat(tl, "ask") : start;
  const proofs = p.proofs.slice(0, 2).map((_, i) => beat(tl, `p${i + 1}`));
  const verdict = beat(tl, "verdict");
  const end = beat(tl, "end");
  const objects: Obj[] = [];
  const kicker = noDot(p.kicker || "باور یا سند؟");

  // the opening: the series' question big, its number in the tag, and the object under it, turning from the first frame
  const title = slab("title", { top: rowAt(318), z: Z0 }, 0, T + 60, fit({ text: kicker, width: INNER, maxLines: 1, size: 132, min: 96, weight: 900 }).lines, { tag: p.episode ? `قسمتِ ${faDigits(p.episode)}` : "قسمتِ تازه", enter: "none" });
  objects.push(title);
  const objTop = bottomOf(title) + 30;
  const claimTop = rowAt(950);
  objects.push(artifact("object", p.model, p.emblem, [SX, Math.round((objTop + claimTop - 30) / 2), Z0 + 40], Math.min(300, claimTop - 20 - objTop), 0, T + 60, { states: [{ at: -20, glow: 0.6 }] }, 760));

  // the belief, word for word, under the object: in at 1.4 s (the hook alone in the first second and a half), back at the verdict
  const claimFrom = Math.max(42, start.from + 42);
  let claim: Obj | null = null;
  for (const [size, lines] of [[66, 3], [60, 3], [56, 4], [52, 4]] as const) {
    claim = slab("claim", { top: claimTop, z: Z0 - 10 }, claimFrom, end.from + 6, fit({ text: noDot(p.claim), width: INNER, maxLines: lines, size, min: 52, weight: 800 }).lines, { tag: "باورِ رایج", enter: "pop", states: [{ at: verdict.from - 2, glow: 0.9, accent: STAMP_ACCENT[p.verdict.stamp] ?? "maybe" }] });
    if (bottomOf(claim) <= LOW_DOC) break;
  }
  objects.push(claim!);
  // «باور»: the stamp on the belief as the narrator asks what the record says
  objects.push(stampObj("belief", "باور", [SX - 210, claim!.at[1] - claim!.h / 2 + 20, Z0 - 60], Math.max(claimFrom + 10, ask.from - 2), verdict.from - 4, 70, -9));
  // the verdict: the site's trust label comes down as the owner's stamp, over the belief
  const stampWord = STAMP_OF[p.verdict.tier] ?? p.verdict.stamp;
  objects.push(stampObj("verdict", stampWord, [SX + 40, claim!.at[1] + claim!.h / 2 + 10, Z0 - 90], verdict.from - 2, end.from + 6, 104, -5));

  // down the hall: the object close, and the record's sentences under it, each in while it is read
  const z1 = at(1)[2];
  const pTop = rowAt(842);
  const big = artifact("close", p.model, p.emblem, [SX, Math.round((rowAt(300) + pTop - 20) / 2), z1 + 60], Math.min(440, pTop - 20 - rowAt(300)), Math.max(1, proofs[0].from - 14), verdict.from + 6, { spin: { from: 20, speed: p.model === "coin" ? 80 : 34 } }, 880);
  objects.push(big);
  const sources: Parts["sources"] = [];
  p.proofs.slice(0, 2).forEach((pr, i) => {
    const b = proofs[i];
    const leave = i + 1 < proofs.length ? proofs[i + 1].from : verdict.from;
    let made: Obj | null = null;
    for (const [size, lines] of [[64, 4], [60, 4], [56, 4], [ANSWER, 5]] as const) {
      const body = fit({ text: noDot(pr.text), width: INNER, maxLines: lines, size, min: ANSWER, weight: 600 }).lines.map((l) => ({ ...l, color: "#e3e8fa", role: "answer" as const }));
      made = slab(`proof${i + 1}`, { top: pTop, z: z1 - 10 }, Math.max(1, b.from - 2), leave + 6, body, { tag: `سند ${faDigits(i + 1)}`, enter: "rise", claim: true, states: i + 1 < proofs.length ? [{ at: leave - 2, dy: 260, dz: 300, dim: 1 }] : [] });
      if (bottomOf(made) <= LOW_DOC) break;
    }
    objects.push(made!);
    sources.push({ from: Math.max(1, b.from - 2), to: leave - 2, text: pr.src });
  });

  // the close: back at the opening, the belief and its stamp give their place to the call to comment
  objects.push(ctaSlab(p.cta, claimTop, Z0 - 20, end.from, T - 12));

  const shots: Shot[] = [
    { at: 0, pose: orbit(at(0), BASE + 40, -3, 0), move: "cut", push: openPush(claimFrom), sway: 0.5, why: "the question and its object, pushing in" },
    { at: claimFrom, pose: orbit(at(0), BASE + 10, 3, 24), move: "glide", push: 16, sway: 0.5, why: "the belief" },
    { at: proofs[0].from - 6, pose: orbit(at(1), BASE, 3, 0), move: "whip", push: 18, sway: 0.5, why: "down the hall to the object" },
    ...proofs.slice(1).map((b, i) => ({ at: b.from - 2, pose: orbit(at(1), BASE - 20, i % 2 ? 4 : -4, -18), move: "glide" as const, push: 14, sway: 0.6, why: `proof ${i + 2}` })),
    { at: verdict.from - 6, pose: orbit(at(0), BASE - 10, 0, 10), move: "whip", push: 12, sway: 0.4, why: "back to the belief for the verdict" },
    { at: end.from, pose: orbit(at(0), BASE + 20, 2, 0), move: "glide", push: 12, sway: 0.4, why: "the call to comment" },
  ];
  const punches: Punch[] = [{ at: ask.from, depth: 26, why: "«باور»" }, ...proofs.map((b, i) => ({ at: b.from + 4, depth: 22, why: `proof ${i + 1}` })), { at: verdict.from - 1, depth: 48, why: "the verdict" }, { at: end.from + 2, depth: 16, why: "the close" }];
  const sfx: Sfx[] = [
    { at: 2, name: "rise", volume: 0.18, why: "the hook" },
    { at: Math.max(claimFrom + 10, ask.from - 2), name: "stamp", volume: 0.36, why: "«باور»" },
    { at: verdict.from - 14, name: "rise", volume: 0.2, why: "into the verdict" },
    { at: verdict.from - 2, name: "stamp", volume: 0.55, why: "the verdict" },
    ...(p.verdict.tier === "FACT" ? [{ at: verdict.from + 4, name: "chime" as const, volume: 0.22, why: "a documented answer" }] : []),
  ];
  return finishDoc("belief", tl, { shots, punches, objects, sfx, hook: kicker, closeAt: end.from, sources, close: p.source, stamps: [{ id: "verdict", word: stampWord }], cta: "cta" }, opts);
}

// ---------- «مرز ایران، دوره به دوره» ----------
export function planFrontier(p: FrontierSite, tl: Timeline, opts: { badge: boolean }): Plan {
  const T = tl.total;
  const end = beat(tl, "end");
  const todayB = beat(tl, "today");
  const objects: Obj[] = [];
  const frames = p.frames;
  const first = beat(tl, frames[0].id);

  // the map board, from the first frame to the last; under it the slab of the hook, then of each period
  const mapTop = rowAt(286);
  const mapH = 700;
  const mapW = 760;
  const stops: MapStop[] = [...frames.map((f) => ({ from: beat(tl, f.id).from, geometry: f.geometry, ...(f.peak ? { peak: f.peak } : {}), ...(f.capital ? { capital: f.capital } : {}) })), { from: todayB.from, geometry: p.today.geometry, today: true }];
  objects.push({ id: "map", kind: "map", at: [SX, mapTop + mapH / 2, Z0 + 30], w: mapW, h: mapH, from: 0, to: T + 60, enter: "none", map: { stops, today: p.today.geometry, zoom: Math.max(30, Math.min(90, first.from - 4)) } });
  const slabTop = mapTop + mapH + 22;

  // the hook: its question big under the map; it steps back into the hall when the first period comes, and returns for the loop
  const hookText = noDot(p.hook?.text ?? "");
  const hook = slab("hook", { top: slabTop, z: Z0 - 10 }, 0, T + 60, fit({ text: hookText, width: INNER, maxLines: 2, size: 96, min: 72, weight: 900 }).lines, {
    enter: "none",
    states: [{ at: first.from - 4, dz: 1800, dy: -80, dim: 1 }, { at: T - 34, dz: 0, dy: 0, dim: 0 }],
  });
  objects.push(hook);

  const sources: Parts["sources"] = [];
  const stamps: { id: string; word: string }[] = [];
  const shots: Shot[] = [{ at: 0, pose: orbit(at(0), BASE + 40, -3, 0), move: "cut", push: openPush(first.from), sway: 0.5, why: "the map zooming under the question" }];
  const punches: Punch[] = [];
  const sfx: Sfx[] = [{ at: 2, name: "rise", volume: 0.18, why: "the hook" }];
  const ids = [...frames.map((f) => f.id), "today"];
  const nextFrom = (i: number) => (i + 1 < ids.length ? beat(tl, ids[i + 1]).from : end.from);

  frames.forEach((f, i) => {
    const b = beat(tl, f.id);
    const leave = nextFrom(i);
    const ext = f.focus && has(tl, `${f.id}-x`) ? beat(tl, `${f.id}-x`) : null;
    // the period's slab: its name, its years, the date its extent shows (in gold)
    const name = fitOne(noDot(f.name), INNER - 120, 92, 900, 64);
    const years = fitOne(noDot(f.years), INNER, 58, 700, TEXT);
    const when = f.when ? [{ ...fitOne(noDot(f.when), INNER, 50, 700, TEXT), color: "#ffd23f" }] : [];
    const s1 = slab(`period${i + 1}`, { top: slabTop, z: Z0 - 10 }, Math.max(1, b.from - 2), (ext ? ext.from : leave) + 6, [name, { ...years, color: "#cdd6f4" }, ...when], { enter: "pop", states: [{ at: b.from, glow: 0.7 }] });
    objects.push(s1);
    if (ext) {
      // the episode's period, held: its reach in the atlas's words, and its short-lived peak in coral
      const body = fit({ text: noDot(f.line ?? ""), width: INNER, maxLines: 3, size: 56, min: ANSWER, weight: 700 }).lines.map((l) => ({ ...l, role: "answer" as const }));
      const peak = f.peakLabel ? fit({ text: noDot(f.peakLabel), width: INNER, maxLines: 1, size: 50, min: TEXT, weight: 800 }).lines.map((l) => ({ ...l, color: "#ff8a65" })) : [];
      objects.push(slab(`reach${i + 1}`, { top: slabTop, z: Z0 - 10 }, ext.from - 2, leave + 6, [...body, ...peak], { enter: "rise", claim: true }));
      shots.push({ at: ext.from - 2, pose: orbit(at(0), BASE - 10, i % 2 ? -5 : 5, -26), move: "glide", push: 8, sway: 0.7, why: `${f.id}: its reach` });
      punches.push({ at: ext.from + 4, depth: 16, why: `${f.id} reach` });
    }
    // its object, standing in front of the map's lower corner
    objects.push(artifact(`object${i + 1}`, f.model, f.emblem, [SX - 180, slabTop - 170, Z0 - 260], 320, Math.max(1, b.from - 2), leave + 4, { enter: "pop" }, 300));
    // the stamp of the data, on the slab's corner
    const st = stampObj(`stamp${i + 1}`, f.stamp, [SX + 205, slabTop - 40, Z0 - 60], b.from + 8, leave + 4, 64, -7);
    objects.push(st);
    stamps.push({ id: st.id, word: f.stamp });
    sources.push({ from: Math.max(1, b.from - 2), to: leave - 2, text: f.source });
    shots.push({ at: b.from - 3, pose: orbit(at(0), BASE - (f.focus ? 10 : 0), i % 2 ? 4 : -4, i % 2 ? -16 : 16), move: "glide", push: f.focus ? 10 : 14, sway: 0.5, why: `${f.id}` });
    punches.push({ at: b.from + 3, depth: f.focus ? 24 : 22, why: `${f.id}` });
    sfx.push({ at: b.from + 6, name: "stamp", volume: 0.3, why: `${f.id} stamp` });
  });

  // today: the border drawn in gold, its label, the stamp قطعی
  const todayName = fitOne(noDot(p.today.label), INNER, 96, 900, 64);
  objects.push(slab("today", { top: slabTop, z: Z0 - 10 }, todayB.from - 2, end.from + 6, [{ ...todayName, color: "#e8c56a" }], { enter: "pop", states: [{ at: todayB.from, glow: 0.8, accent: "gold" }] }));
  const ts = stampObj("stampToday", p.today.stamp, [SX + 205, slabTop - 40, Z0 - 60], todayB.from + 8, end.from + 4, 64, -7);
  objects.push(ts);
  stamps.push({ id: ts.id, word: p.today.stamp });
  sources.push({ from: todayB.from - 2, to: end.from, text: p.today.source });
  shots.push({ at: todayB.from - 4, pose: orbit(at(0), BASE + 30, 0, -10), move: "glide", push: 18, sway: 0.4, why: "today, in gold" });
  punches.push({ at: todayB.from + 6, depth: 30, why: "today" });
  sfx.push({ at: todayB.from + 2, name: "chime", volume: 0.26, why: "today's border" });

  // the close: the call to comment in the slab's place
  objects.push(ctaSlab(p.cta, slabTop, Z0 - 20, end.from, T - 12));
  shots.push({ at: end.from, pose: orbit(at(0), BASE + 20, 2, 0), move: "glide", push: 12, sway: 0.4, why: "the call to comment" });
  punches.push({ at: end.from + 2, depth: 16, why: "the close" });

  return finishDoc("frontier", tl, { shots, punches, objects, sfx, hook: hookText, closeAt: end.from, sources, close: p.source, stamps, cta: "cta" }, opts);
}

/** For the tests: the floors these plans keep. */
export const DOC = { LOW_DOC, SRC_W, SRC_SIZE, FPS };
