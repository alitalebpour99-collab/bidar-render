// The set plans of «حدس بزن», «درست یا غلط؟» and «پنج‌تایی»: from the site's
// props and the narrator's timeline, where every slab stands, when it comes
// and goes, where the camera is, which sound plays. Pure numbers (space.ts),
// measured text (fit.ts); Hall.tsx draws it, gate.mjs checks it.
import { faDigits, noDot } from "../kit";
import type { QuizProps, Timeline } from "../props";
import type { FiveProps } from "../Five";
import type { TrueFalseProps } from "../TrueFalse";
import { fit, fitOne, linesHeight, measure } from "./fit";
import { COL, COL_W, FPS, HZ, MIN_TEXT, ZONES, orbit, poseAt, textBoxes, type Accent, type Hud, type Line, type Obj, type Plan, type Punch, type Sfx, type Shot, type V3 } from "./space";

/** The formats drawn in the set style. */
export const SET_FORMATS = ["quiz", "truefalse", "five"] as const;
export type SetFormat = (typeof SET_FORMATS)[number];
export const isSetFormat = (f: string): f is SetFormat => (SET_FORMATS as readonly string[]).includes(f);

/** How long each may run, in seconds (gate `length`): one idea each, the quiz the shortest. */
export const LENGTH: Record<SetFormat, [number, number]> = { quiz: [14, 30], truefalse: [24, 48], five: [22, 42] };
/** The silent holds, at most (the quiz's countdown, the true-or-false pause): the audit's «nothing waits». */
export const HOLD_CAP: Record<SetFormat, number> = { quiz: 3, truefalse: 2, five: 2 };

/** The slab column: centred in the safe column, a little narrower so a punch keeps it inside. */
const SX = COL.left + COL_W / 2 - 540;
const SLAB_W = Math.min(660, COL_W - 120);
const INNER = SLAB_W - 96;
const Z0 = 1000;
/** the world's y of a row of the screen, for a thing at the camera's own distance (scale 1) */
const rowY = (screenY: number) => screenY - HZ;

type B = { from: number; to: number };
const beat = (tl: Timeline, id: string): B => tl.beats[id] ?? { from: 0, to: tl.total };
const has = (tl: Timeline, id: string) => Boolean(tl.beats[id]);

/** A slab of lines, its height from its content. */
function slab(id: string, at: { x?: number; top: number; z: number }, from: number, to: number, body: Line[], extra: Partial<Obj> = {}): Obj {
  const tagH = extra.tag ? 92 : 30;
  const imgH = extra.image ? extra.image.h + 18 : 0;
  const chipH = extra.chip ? 80 : 0;
  const h = Math.round(tagH + imgH + linesHeight(body) + chipH + 34);
  return { id, kind: "slab", at: [at.x ?? SX, at.top + h / 2, at.z], w: SLAB_W, h, from, to, lines: body, ...extra };
}

/** A source chip: «منبع: …», one line, as small as the frame allows and no smaller. */
function chipOf(text: string | undefined): Line | undefined {
  if (!text) return undefined;
  const t = noDot(/^\s*منبع/.test(text) ? text : `منبع: ${text}`);
  const one = fitOne(t, INNER - 20, 30, 600);
  return one.overflow ? { ...one, text: shorten(t, INNER - 20, one.size, 600) } : one;
}
/** A source too long for its chip keeps its first words and an ellipsis (the whole line is in the caption). */
function shorten(text: string, width: number, size: number, weight: number) {
  const words = text.split(/\s+/);
  while (words.length > 2 && measure(`${words.join(" ")}…`, size, weight) > width) words.pop();
  return `${words.join(" ")}…`;
}

// ---------- the parts every set Reel shares ----------
type Parts = { shots: Shot[]; punches: Punch[]; objects: Obj[]; sfx: Sfx[]; hook: string; closeAt: number; source: string; claimsSourced: boolean };

/** Keep the camera moving: a small punch into any stretch of more than 2.6 s without a move. */
function keepMoving(shots: Shot[], punches: Punch[], total: number) {
  const events = () => [...shots.map((s) => s.at), ...punches.map((p) => p.at)].sort((a, b) => a - b);
  for (let guard = 0; guard < 60; guard += 1) {
    const ev = [...events(), total];
    let gap = -1;
    for (let i = 1; i < ev.length; i += 1) if (ev[i] - ev[i - 1] > 78) { gap = i; break; }
    if (gap < 0) return;
    punches.push({ at: ev[gap - 1] + 66, depth: 22, why: "keep moving" });
  }
}

/** Effects: no more than two in any second, the most important kept (the sound code of Pickwise, Bidar's sounds). */
const RANK: Sfx["name"][] = ["stamp", "chime", "hit", "pop", "tick", "rise", "paper", "draw", "whoosh", "swish"];
function thin(list: Sfx[]): Sfx[] {
  const kept: Sfx[] = [];
  for (const s of [...list].sort((a, b) => RANK.indexOf(a.name) - RANK.indexOf(b.name) || a.at - b.at)) {
    const near = kept.filter((k) => Math.abs(k.at - s.at) < FPS);
    if (near.length < 2 && !kept.some((k) => Math.abs(k.at - s.at) < 3)) kept.push(s);
  }
  return kept.sort((a, b) => a.at - b.at);
}

function finish(format: SetFormat, tl: Timeline, p: Parts, opts: { badge: boolean }): Plan {
  const total = tl.total;
  // the loop: the last 19 frames glide back to the first frame's camera
  const first = p.shots[0];
  p.shots.push({ at: total - 19, pose: first.pose, move: "glide", push: 0, sway: 0, why: "back to the first picture (loop)" });
  keepMoving(p.shots, p.punches, total - 19);
  // the sound of the camera: a whoosh on a whip, a soft swish on a glide
  for (const s of p.shots.slice(1)) p.sfx.push(s.move === "whip" ? { at: s.at - 2, name: "whoosh", volume: 0.26, why: s.why } : { at: s.at, name: "swish", volume: 0.14, why: s.why });
  for (const o of p.objects) if (o.enter === "pop" && o.kind !== "stamp") p.sfx.push({ at: o.from, name: "pop", volume: 0.22, why: `${o.id} in` });
  for (const o of p.objects) if (o.enter === "rise" && o.kind === "slab") p.sfx.push({ at: o.from, name: "paper", volume: 0.16, why: `${o.id} rises` });

  // the close: the source line and the badge, side by side in the bottom safe area
  const hud: Hud[] = [];
  const closeFrom = p.closeAt;
  const bottom = ZONES.bottom - 14;
  const badgeBox = { x: COL.left, y: bottom - 86, w: 300, h: 80 };
  if (opts.badge) {
    const from = closeFrom + 20;
    hud.push({ id: "badge", kind: "badge", box: badgeBox, from, to: Math.min(from + 66, total - 20) });
  }
  const srcLeft = COL.left + 320;
  const width = COL.right - srcLeft;
  const src = noDot(p.source.replace(/^\s*منبع\s*[:：]\s*/, ""));
  let lines = fit({ text: `منبع: ${src}`, width, maxLines: 2, size: 32, weight: 600 }).lines;
  const tooLong = fit({ text: `منبع: ${src}`, width, maxLines: 2, size: 32, weight: 600 }).overflow;
  // every claim already showed its own source on its slab: the close names where all of them are
  if (tooLong && p.claimsSourced) lines = [fitOne("منبع‌ها: زیرِ هر جمله و در کپشن", width, 32, 600)];
  lines = [...lines, { text: "bidar.ahura.cloud", size: 34, weight: 700, color: "#f4f6ff" }];
  const h = Math.ceil(linesHeight(lines, 1.35)) + 8;
  hud.push({ id: "source", kind: "source", box: { x: srcLeft, y: bottom - h, w: width, h }, from: closeFrom, to: total - 12, lines });

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
    length: LENGTH[format],
    badge: opts.badge,
  };
}

// ---------- «حدس بزن» ----------
const FLAG_URL = /^https:\/\/bidar\.ahura\.cloud\/flags\/[a-z0-9_]+\.svg$/;

export function planQuiz(p: QuizProps, tl: Timeline, opts: { badge: boolean }): Plan {
  const T = tl.total;
  const n = p.options.length;
  const o = p.options.map((_, i) => beat(tl, `o${i + 1}`));
  const count = beat(tl, "count");
  const answer = beat(tl, "answer");
  const why = beat(tl, "why");
  const end = beat(tl, "end");
  const flag = p.flag && FLAG_URL.test(p.flag.svg) ? p.flag : null;
  const target: V3 = [SX, 0, Z0];
  const objects: Obj[] = [];

  // the question: on screen from the first frame to the last (the loop's first picture)
  const q = fit({ text: noDot(p.question), width: INNER, maxLines: 3, size: flag ? 62 : 76, min: 48, weight: 900, height: flag ? 190 : 320 }).lines;
  const Q = slab("question", { top: rowY(292), z: Z0 }, 0, T, q, { tag: noDot(p.kicker || "حدس بزن"), enter: "none", ...(flag ? { image: { src: flag.svg, h: 190 } } : {}) });
  objects.push(Q);
  const qBottom = Q.at[1] + Q.h / 2;

  // the options, one slab each, popping in as they are read
  const optH = 112;
  const gap = 20;
  const optTop = qBottom + 44;
  p.options.forEach((text, i) => {
    const line = fitOne(`${faDigits(i + 1)}. ${noDot(text)}`, INNER, 54, 800);
    const right = i === p.answer;
    const ob: Obj = {
      id: `option${i + 1}`,
      kind: "slab",
      at: [SX, optTop + i * (optH + gap) + optH / 2, Z0],
      w: SLAB_W,
      h: optH,
      from: Math.max(1, o[i].from - 3),
      to: T - 12,
      enter: "pop",
      lines: [{ text: line.text, size: line.size, weight: 800 }],
      states: [right ? { at: answer.from - 2, glow: 1, accent: "right" as Accent, dz: -30 } : { at: answer.from - 2, dim: 1, dy: 16, dz: 140 }],
      claim: right,
    };
    // a single-line slab: no tag and no chip, so its height is its own
    objects.push(ob);
  });
  const optBottom = optTop + n * (optH + gap) - gap;

  // the countdown: a ring of light under the options
  const secs = Math.max(1, Math.round((count.to - count.from) / FPS));
  const ringW = 220;
  objects.push({ id: "ring", kind: "ring", at: [SX, optBottom + 50 + ringW / 2, Z0], w: ringW, h: ringW, from: count.from - 4, to: answer.from + 6, enter: "pop", secs, word: { text: "۳", size: 120, weight: 900 } });

  // the reveal: a burst from the right one, then the answer and its line of context with its source
  const rightY = optTop + p.answer * (optH + gap) + optH / 2;
  objects.push({ id: "burst", kind: "burst", at: [SX, rightY, Z0 - 40], w: 640, h: 340, from: answer.from - 2, to: answer.from + 30, enter: "none" });
  const head = fitOne(`پاسخ: ${noDot(p.options[p.answer])}`, INNER, 52, 900);
  const body = fit({ text: noDot(p.reveal), width: INNER, maxLines: 3, size: 38, min: 30, weight: 600 }).lines;
  const whyTop = optBottom + 30;
  objects.push(slab("answer", { top: whyTop, z: Z0 - 10 }, answer.from + 4, end.from + 4, [{ text: head.text, size: head.size, weight: 900, color: "#22e39b" }, ...body], { enter: "rise", chip: chipOf(p.source), claim: true }));
  // the call to answer in the comments
  const cta = fitOne(noDot(p.cta), INNER, 52, 900);
  objects.push(slab("cta", { top: whyTop + 20, z: Z0 - 10 }, end.from, T - 12, [{ text: cta.text, size: cta.size, weight: 900, color: "#ffd23f" }], { enter: "pop" }));

  const shots: Shot[] = [
    { at: 0, pose: orbit(target, 1150, -4, 0), move: "cut", push: 50, sway: 0.5, why: "the question, the camera already pushing in" },
    ...o.map((b, i) => ({ at: b.from - 2, pose: orbit(target, 1120 - i * 15, i % 2 ? -2 : 3, i % 2 ? 14 : -14), move: "glide" as const, push: 28, sway: 0.4, why: `option ${i + 1}` })),
    { at: count.from, pose: orbit(target, 1170, 6, -36), move: "glide", push: 40, sway: 0.8, why: "the countdown: an orbit round the board" },
    { at: answer.from - 3, pose: orbit(target, 1090, 0, 0), move: "whip", push: 20, why: "the answer" },
    { at: why.from, pose: orbit(target, 1110, -3, -24), move: "glide", push: 26, sway: 0.5, why: "the context" },
    { at: end.from, pose: orbit(target, 1110, 2, 0), move: "glide", push: 20, sway: 0.4, why: "the close" },
  ];
  const punches: Punch[] = [...o.map((b, i) => ({ at: b.from, depth: 24, why: `option ${i + 1}` })), { at: answer.from - 1, depth: 60, why: "the answer" }, { at: end.from + 2, depth: 18, why: "the close" }];
  const sfx: Sfx[] = [
    { at: 2, name: "rise", volume: 0.18, why: "the hook" },
    ...Array.from({ length: secs }, (_, i) => ({ at: count.from + i * FPS, name: "tick" as const, volume: 0.22, why: "countdown" })),
    { at: answer.from - 14, name: "rise", volume: 0.2, why: "into the answer" },
    { at: answer.from - 2, name: "chime", volume: 0.32, why: "the answer" },
    { at: answer.from - 1, name: "hit", volume: 0.2, why: "the answer" },
  ];
  return finish("quiz", tl, { shots, punches, objects, sfx, hook: noDot(p.question), closeAt: end.from, source: p.source, claimsSourced: true }, opts);
}

// ---------- the corridor: «درست یا غلط؟» and «پنج‌تایی» ----------
/** A station down the hall: its slabs stand at this depth; the camera stops 1080 in front of it. */
const stationZ = (k: number) => Z0 + 2000 * k;
const at = (k: number): V3 => [SX, 0, stationZ(k)];

/** The opening slab: the series' line in big letters (the hook), and its second line a moment later. */
function opening(hook: string, sub: string, T: number, subTo: number): Obj[] {
  const big = fit({ text: noDot(hook), width: INNER, maxLines: 2, size: 112, min: 64, weight: 900 }).lines;
  const title = slab("title", { top: rowY(330), z: Z0 }, 0, T, big, { enter: "none" });
  const subLines = fit({ text: noDot(sub), width: INNER, maxLines: 2, size: 46, min: 36, weight: 700 }).lines.map((l) => ({ ...l, color: "#a9b4d6" }));
  const second = slab("sub", { top: title.at[1] + title.h / 2 + 40, z: Z0 - 20 }, 46, subTo, subLines, { enter: "rise" });
  return [title, second];
}

/** The close at the opening slab: the question to the viewer under the title. */
function closing(q: string, a: string, endFrom: number, T: number, top: number): Obj {
  const l1 = fitOne(noDot(q), INNER, 56, 900);
  const l2 = fitOne(noDot(a), INNER, 46, 700);
  return slab("close", { top, z: Z0 - 20 }, endFrom, T - 12, [{ text: l1.text, size: l1.size, weight: 900 }, { text: l2.text, size: l2.size, weight: 700, color: "#ffd23f" }], { enter: "pop" });
}

const VERDICT: Record<string, Accent> = { right: "right", wrong: "wrong", contested: "maybe" };

export function planTrueFalse(p: TrueFalseProps & { rounds: (TrueFalseProps["rounds"][number] & { src?: string })[] }, tl: Timeline, opts: { badge: boolean }): Plan {
  const T = tl.total;
  const end = beat(tl, "end");
  const objects: Obj[] = [];
  const [title, sub] = opening(p.hook, p.sub, T, beat(tl, "s1").from + 8);
  objects.push(title, sub);
  const shots: Shot[] = [{ at: 0, pose: orbit(at(0), 1120, -3, 0), move: "cut", push: 60, sway: 0.5, why: "the opening, pushing toward the three slabs" }];
  const punches: Punch[] = [];
  const sfx: Sfx[] = [{ at: 2, name: "rise", volume: 0.18, why: "the hook" }];
  let sourced = true;
  p.rounds.forEach((r, i) => {
    const k = i + 1;
    const s = beat(tl, `s${k}`);
    const c = beat(tl, `c${k}`);
    const v = beat(tl, `v${k}`);
    const leave = has(tl, `s${k + 1}`) ? beat(tl, `s${k + 1}`).from : end.from;
    const accent = VERDICT[r.verdict] ?? "maybe";
    const lines = fit({ text: noDot(r.text), width: INNER, maxLines: 4, size: 66, min: 44, weight: 800 }).lines;
    const st = slab(`claim${k}`, { top: rowY(300), z: stationZ(k) }, 0, T, lines, { tag: `جملهٔ ${faDigits(k)} از ${faDigits(p.rounds.length)}`, enter: "none", states: [{ at: v.from - 2, glow: 0.8, accent }, { at: leave + 20, glow: 0, accent: "turq" }] });
    objects.push(st);
    const bottom = st.at[1] + st.h / 2;
    // the pause: a ring counts it under the slab
    objects.push({ id: `ring${k}`, kind: "ring", at: [SX, bottom + 190, stationZ(k)], w: 200, h: 200, from: c.from - 4, to: v.from + 4, enter: "pop", secs: Math.max(1, Math.round((c.to - c.from) / FPS)), word: { text: "۲", size: 110, weight: 900 } });
    // the verdict: a stamp on the slab's lower corner, then the proof with its source
    const word = fitOne(noDot(r.label), 360, 74, 900);
    const sw = Math.round(measure(word.text, word.size, 900) + 110);
    objects.push({ id: `stamp${k}`, kind: "stamp", at: [SX - SLAB_W / 2 + sw / 2 + 30, bottom + 10, stationZ(k) - 30], w: sw, h: 116, from: v.from - 2, to: leave + 6, enter: "pop", tilt: -7, accent, word: { text: word.text, size: word.size, weight: 900 } });
    const proof = fit({ text: noDot(r.proof), width: INNER, maxLines: 5, size: 44, min: 32, weight: 600 }).lines;
    const chip = chipOf(r.src);
    if (!chip) sourced = false;
    objects.push(slab(`proof${k}`, { top: bottom + 96, z: stationZ(k) - 20 }, v.from + 8, leave + 6, proof, { enter: "rise", chip, claim: true }));
    shots.push({ at: s.from - 6, pose: orbit(at(k), 1080, k % 2 ? 3 : -3, 0), move: "whip", push: 40, sway: 0.5, why: `to sentence ${k}` });
    if (c.to > c.from) shots.push({ at: c.from, pose: orbit(at(k), 1050, k % 2 ? -5 : 5, -26), move: "glide", push: 30, sway: 0.8, why: `the pause of sentence ${k}` });
    shots.push({ at: v.from + 10, pose: orbit(at(k), 1110, 0, 40), move: "glide", push: 24, sway: 0.4, why: `the proof of sentence ${k}` });
    punches.push({ at: v.from - 1, depth: 55, why: `verdict ${k}` });
    for (let t = 0; t < Math.round((c.to - c.from) / FPS); t += 1) sfx.push({ at: c.from + t * FPS, name: "tick", volume: 0.2, why: "pause" });
    sfx.push({ at: v.from - 2, name: "stamp", volume: 0.5, why: `verdict ${k}` });
    if (r.verdict === "right") sfx.push({ at: v.from + 2, name: "chime", volume: 0.24, why: "right" });
  });
  objects.push(closing(p.score.q, p.score.a, end.from, T, sub.at[1] - sub.h / 2));
  shots.push({ at: end.from - 6, pose: orbit(at(0), 1090, 2, 0), move: "whip", push: 24, sway: 0.4, why: "back to the opening for the close" });
  return finish("truefalse", tl, { shots, punches, objects, sfx, hook: noDot(p.hook), closeAt: end.from, source: p.source, claimsSourced: sourced }, opts);
}

export function planFive(p: FiveProps & { items: (FiveProps["items"][number] & { src?: string })[] }, tl: Timeline, opts: { badge: boolean }): Plan {
  const T = tl.total;
  const end = beat(tl, "end");
  const objects: Obj[] = [];
  const first = beat(tl, `n${String(p.items[0]?.n ?? "۵").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))}`);
  const [title, sub] = opening(p.hook, p.sub, T, first.from + 8);
  objects.push(title, sub);
  const shots: Shot[] = [{ at: 0, pose: orbit(at(0), 1120, -3, 0), move: "cut", push: 60, sway: 0.5, why: "the opening, pushing toward the five" }];
  const punches: Punch[] = [];
  const sfx: Sfx[] = [{ at: 2, name: "rise", volume: 0.18, why: "the hook" }];
  let sourced = true;
  p.items.forEach((it, i) => {
    const k = i + 1;
    const num = String(it.n).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    const b = beat(tl, `n${num}`);
    const leave = i + 1 < p.items.length ? beat(tl, `n${String(p.items[i + 1].n).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))}`).from : end.from;
    const name = fit({ text: noDot(it.name), width: INNER, maxLines: 2, size: 76, min: 52, weight: 900 }).lines;
    const line = fit({ text: noDot(it.line), width: INNER, maxLines: 3, size: 44, min: 34, weight: 600 }).lines.map((l) => ({ ...l, color: "#d7def5" }));
    const fig = it.figure ? [{ ...fitOne(noDot(it.figure), INNER, 42, 800), color: "#17d4a4" }] : [];
    const chip = chipOf(it.src);
    if (!chip) sourced = false;
    const st = slab(`item${k}`, { top: rowY(470), z: stationZ(k) }, 0, T, [...name, ...fig, ...line], { enter: "none", chip, claim: true, states: [{ at: b.from, glow: 0.7 }, { at: leave + 20, glow: 0 }] });
    objects.push(st);
    // the number above the slab, a medal that lights as the camera arrives
    objects.push({ id: `medal${k}`, kind: "medal", at: [SX, st.at[1] - st.h / 2 - 70, stationZ(k) - 10], w: 160, h: 160, from: 0, to: T, enter: "none", word: { text: faDigits(num), size: 104, weight: 900 }, states: [{ at: b.from, glow: 1, accent: "gold" }, { at: leave + 20, glow: 0, accent: "turq" }] });
    shots.push({ at: b.from - 6, pose: orbit(at(k), 1080, k % 2 ? 3 : -3, 0), move: "whip", push: 34, sway: 0.5, why: `to number ${faDigits(num)}` });
    const mid = Math.round((b.from + leave) / 2);
    if (leave - b.from > 100) shots.push({ at: mid, pose: orbit(at(k), 1040, k % 2 ? -4 : 4, -30), move: "glide", push: 26, sway: 0.6, why: `number ${faDigits(num)}, an orbit` });
    punches.push({ at: b.from + 6, depth: 40, why: `number ${faDigits(num)}` });
    sfx.push({ at: b.from + 4, name: k === p.items.length ? "chime" : "hit", volume: k === p.items.length ? 0.3 : 0.18, why: `number ${faDigits(num)}` });
  });
  objects.push(closing(p.close.q, p.close.a, end.from, T, sub.at[1] - sub.h / 2));
  shots.push({ at: end.from - 6, pose: orbit(at(0), 1090, 2, 0), move: "whip", push: 24, sway: 0.4, why: "back to the opening for the close" });
  return finish("five", tl, { shots, punches, objects, sfx, hook: noDot(p.hook), closeAt: end.from, source: p.source, claimsSourced: sourced }, opts);
}

export function planOf(format: SetFormat, props: unknown, tl: Timeline, opts: { badge: boolean }): Plan {
  if (format === "quiz") return planQuiz(props as QuizProps, tl, opts);
  if (format === "truefalse") return planTrueFalse(props as never, tl, opts);
  return planFive(props as never, tl, opts);
}

/** For the gate: the camera of a plan at a frame (also used by the tests). */
export { poseAt, MIN_TEXT };
