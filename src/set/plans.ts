// The set plans of «حدس بزن», «درست یا غلط؟» and «پنج‌تایی»: from the site's
// props and the narrator's timeline, where every slab stands, when it comes
// and goes, where the camera is, which sound plays. Pure numbers (space.ts),
// measured text (fit.ts); Hall.tsx draws it, gate.mjs checks it.
//
// The review of 2026-11-14 set the floors: every text 40 px or more on screen,
// an answer and its explanation 44 px or more, a source on one or two whole
// lines (never cut), the right answer lit in its colour with a mark (a cross
// on «غلط»), the confetti behind the slabs, the lower part of the frame used,
// «درست یا غلط؟» 30 s at most. Sizes here are the world's: on screen they are
// drawn at the camera's scale (about 0.9 when a slab is read), so a world size
// is the screen floor divided by that scale, rounded up.
import { faDigits, noDot } from "../kit";
import type { QuizProps, Timeline } from "../props";
import type { FiveProps } from "../Five";
import type { TrueFalseProps } from "../TrueFalse";
import { fit, fitOne, linesHeight, measure } from "./fit";
import { CHIP_SIZE, COL, COL_W, FPS, HZ, MIN_TEXT, TAG_ROOM, TOP_ROOM, ZONES, chipRoom, frameCover, orbit, poseAt, textBoxes, type Accent, type Hud, type Line, type Obj, type Plan, type Punch, type Sfx, type Shot, type V3 } from "./space";

/** The formats drawn in the set style. */
export const SET_FORMATS = ["quiz", "truefalse", "five"] as const;
export type SetFormat = (typeof SET_FORMATS)[number];
export const isSetFormat = (f: string): f is SetFormat => (SET_FORMATS as readonly string[]).includes(f);

/** How long each may run, in seconds (gate `length`): one idea each, the quiz the shortest; «درست یا غلط؟» two sentences in 30 s. */
export const LENGTH: Record<SetFormat, [number, number]> = { quiz: [14, 30], truefalse: [16, 30], five: [22, 42] };
/** The silent holds, at most (the quiz's countdown, the true-or-false pause): the audit's «nothing waits». */
export const HOLD_CAP: Record<SetFormat, number> = { quiz: 3, truefalse: 2, five: 2 };

/** The slab column: centred in the safe column, a little narrower so a punch keeps it inside. */
const SX = COL.left + COL_W / 2 - 540;
const SLAB_W = Math.min(720, COL_W - 64);
const INNER = SLAB_W - 96;
const Z0 = 1000;
/** the world's y of a row of the screen, for a thing at the camera's own distance (scale 1) */
const rowY = (screenY: number) => screenY - HZ;
/** the lowest a slab's bottom may stand (world), so the nearest camera of a Reel keeps it above the caption rows */
const LOW = 780;
/** world sizes: a text 40 px on screen and an answer 44 px at the reading scale (about 0.9) */
const TEXT = Math.ceil(MIN_TEXT / 0.86);
const ANSWER = 52;

type B = { from: number; to: number };
const beat = (tl: Timeline, id: string): B => tl.beats[id] ?? { from: 0, to: tl.total };
const has = (tl: Timeline, id: string) => Boolean(tl.beats[id]);
const asAnswer = (lines: Line[]): Line[] => lines.map((l) => ({ ...l, role: "answer" as const }));

/** A slab of lines, its height from its content (the room Hall.tsx gives the tag, the lines and the chip). */
function slab(id: string, at: { x?: number; top: number; z: number }, from: number, to: number, body: Line[], extra: Partial<Obj> = {}): Obj {
  const top = extra.tag ? TAG_ROOM : TOP_ROOM;
  const imgH = extra.image ? extra.image.h + 18 : 0;
  const h = Math.round(top + imgH + linesHeight(body) + chipRoom(extra.chip) + 10);
  return { id, kind: "slab", at: [at.x ?? SX, at.top + h / 2, at.z], w: SLAB_W, h, from, to, lines: body, ...extra };
}
const bottomOf = (o: Obj) => o.at[1] + o.h / 2;

/** The chip's room for its letters: the slab's inner width less the chip's padding and border. */
const CHIP_W = INNER - 56;
/**
 * A source chip: «منبع: …» on one or two whole lines, never cut. A source too
 * long for two lines is named shorter, still whole: the entry's headword
 * (Encyclopaedia Iranica, "Rāzī"), then the work alone. The whole source is
 * always in the caption and in the source line at the close.
 */
function chipOf(text: string | undefined): Line[] | undefined {
  if (!text) return undefined;
  const raw = noDot(text.replace(/^\s*منبع\s*[:：]\s*/, ""));
  for (const t of sourceForms(raw)) {
    const r = fit({ text: `منبع: ${t}`, width: CHIP_W, maxLines: 2, size: CHIP_SIZE, min: CHIP_SIZE, weight: 600 });
    if (!r.overflow) return r.lines;
  }
  return fit({ text: `منبع: ${sourceForms(raw).pop()}`, width: CHIP_W, maxLines: 3, size: CHIP_SIZE, min: CHIP_SIZE, weight: 600 }).lines;
}
export function sourceForms(s: string): string[] {
  const out = [s];
  const m = /^(.*?),\s*["“«](.+?)["”»]\s*$/.exec(s);
  if (m) {
    const head = m[2].split(/[,،(]/)[0].trim();
    out.push(`${m[1]}, "${head}"`, m[1].trim());
  }
  return [...new Set(out)];
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
  const whole = fit({ text: `منبع: ${src}`, width, maxLines: 2, size: MIN_TEXT, min: MIN_TEXT, weight: 600 });
  let lines = whole.lines;
  // every claim already showed its own source on its slab: the close names where all of them are
  if (whole.overflow && p.claimsSourced) lines = fit({ text: "منبع‌ها: زیرِ هر جمله و در کپشن", width, maxLines: 2, size: MIN_TEXT, min: MIN_TEXT, weight: 600 }).lines;
  lines = [...lines, { ...fitOne("bidar.ahura.cloud", width, 42, 700), color: "#f4f6ff" }];
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
    frames: frameCover(p.objects, hud, p.shots, p.punches, total),
    length: LENGTH[format],
    badge: opts.badge,
  };
}

// ---------- «حدس بزن» ----------
const FLAG_URL = /^https:\/\/bidar\.ahura\.cloud\/flags\/[a-z0-9_]+\.svg$/;

export function planQuiz(p: QuizProps, tl: Timeline, opts: { badge: boolean }): Plan {
  const T = tl.total;
  const o = p.options.map((_, i) => beat(tl, `o${i + 1}`));
  const count = beat(tl, "count");
  const answer = beat(tl, "answer");
  const why = beat(tl, "why");
  const end = beat(tl, "end");
  const flag = p.flag && FLAG_URL.test(p.flag.svg) ? p.flag : null;
  const target: V3 = [SX, 0, Z0];
  const objects: Obj[] = [];

  // the question: on screen from the first frame to past the last (the loop's first picture)
  const q = fit({ text: noDot(p.question), width: INNER, maxLines: 3, size: flag ? 80 : 104, min: 64, weight: 900, height: flag ? 230 : 420 }).lines;
  const Q = slab("question", { top: rowY(300), z: Z0 }, 0, T + 60, q, { tag: noDot(p.kicker || "حدس بزن"), enter: "none", ...(flag ? { image: { src: flag.svg, h: 200 } } : {}) });
  objects.push(Q);
  const qBottom = bottomOf(Q);

  // the options, one slab each, popping in as they are read; the right one is lit green with a tick, the others step back
  const optH = 146;
  const gap = 20;
  const optTop = qBottom + 36;
  p.options.forEach((text, i) => {
    const line = fitOne(`${faDigits(i + 1)}. ${noDot(text)}`, INNER, 72, 800, ANSWER);
    const right = i === p.answer;
    objects.push({
      id: `option${i + 1}`,
      kind: "slab",
      at: [SX, optTop + i * (optH + gap) + optH / 2, Z0],
      w: SLAB_W,
      h: optH,
      from: Math.max(1, o[i].from - 3),
      to: why.from + 10,
      enter: "pop",
      lines: [{ ...line, weight: 800, role: "answer" }],
      ...(right ? { mark: "check" as const } : {}),
      states: [right ? { at: answer.from - 2, glow: 1, accent: "right" as Accent, dz: -50, win: 1 } : { at: answer.from - 2, dim: 1, dy: 16, dz: 140 }, { at: why.from - 2, dy: 260, dz: 300 }],
    });
  });
  const optBottom = optTop + p.options.length * (optH + gap) - gap;
  // the hook's one object: a medallion with «؟» under the question; it steps back into the hall when the options come, and returns for the loop
  const medal = 330;
  const medalY = Math.min(optTop + medal / 2 + 60, LOW - medal / 2 - 160);
  objects.push({ id: "mark", kind: "medal", at: [SX, medalY, Z0 - 20], w: medal, h: medal, from: 0, to: T + 60, enter: "none", word: { text: "؟", size: 230, weight: 900 }, states: [{ at: -20, glow: 0.8 }, { at: Math.max(10, o[0].from - 8), dz: 1400, dy: -120, dim: 0.6, glow: 0 }, { at: end.from + 16, dz: 0, dy: 0, dim: 0, glow: 0.8 }] });

  // the countdown: a ring of light under the options
  const secs = Math.max(1, Math.round((count.to - count.from) / FPS));
  const ringW = 260;
  objects.push({ id: "ring", kind: "ring", at: [SX, Math.min(optBottom + 30 + ringW / 2, LOW - ringW / 2), Z0], w: ringW, h: ringW, from: count.from - 4, to: answer.from + 6, enter: "pop", secs, word: { text: "۳", size: 150, weight: 900 } });

  // the reveal: a burst behind the right one (the slabs stand in front of it); then the options sink and the answer rises in their place, with its source
  const rightY = optTop + p.answer * (optH + gap) + optH / 2;
  objects.push({ id: "burst", kind: "burst", at: [SX, rightY, Z0 + 160], w: 980, h: 520, from: answer.from - 2, to: answer.from + 30, enter: "none" });
  const chip = chipOf(p.source);
  const head = fitOne(`پاسخ: ${noDot(p.options[p.answer])}`, INNER, 80, 900, 60);
  let A: Obj | null = null;
  for (const [size, lines] of [[62, 4], [58, 4], [56, 3], [ANSWER, 3]] as const) {
    const body = fit({ text: noDot(p.reveal), width: INNER, maxLines: lines, size, min: ANSWER, weight: 600 }).lines;
    A = slab("answer", { top: optTop, z: Z0 - 10 }, why.from, end.from + 4, asAnswer([{ ...head, weight: 900, color: "#22e39b" }, ...body]), { enter: "rise", chip, claim: true });
    if (bottomOf(A) <= LOW) break;
  }
  objects.push(A!);
  // the call to answer in the comments, under the medallion at the close
  const cta = fitOne(noDot(p.cta), INNER, 64, 900, TEXT);
  objects.push(slab("cta", { top: Math.min(medalY + medal / 2 + 34, LOW - 130), z: Z0 - 10 }, end.from, T - 12, [{ text: cta.text, size: cta.size, weight: 900, color: "#ffd23f", w: cta.w, max: cta.max }], { enter: "pop" }));

  const shots: Shot[] = [
    { at: 0, pose: orbit(target, 1110, -4, 0), move: "cut", push: 30, sway: 0.5, why: "the question, the camera already pushing in" },
    ...o.map((b, i) => ({ at: b.from - 2, pose: orbit(target, 1080 - i * 10, i % 2 ? -2 : 3, i % 2 ? 14 : -14), move: "glide" as const, push: 18, sway: 0.4, why: `option ${i + 1}` })),
    { at: count.from, pose: orbit(target, 1110, 6, -30), move: "glide", push: 22, sway: 0.8, why: "the countdown: an orbit round the board" },
    { at: answer.from - 3, pose: orbit(target, 1070, 0, 0), move: "whip", push: 12, why: "the answer" },
    { at: why.from, pose: orbit(target, 1080, -3, -20), move: "glide", push: 16, sway: 0.5, why: "the context" },
    { at: end.from, pose: orbit(target, 1090, 2, 0), move: "glide", push: 12, sway: 0.4, why: "the close" },
  ];
  const punches: Punch[] = [...o.map((b, i) => ({ at: b.from, depth: 22, why: `option ${i + 1}` })), { at: answer.from - 1, depth: 45, why: "the answer" }, { at: end.from + 2, depth: 16, why: "the close" }];
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
/** A station down the hall: its slabs stand at this depth; the camera stops about 1060 in front of it. */
const stationZ = (k: number) => Z0 + 2000 * k;
const at = (k: number): V3 => [SX, 0, stationZ(k)];
const BASE = 1080;

/**
 * The opening: the series' line in big letters (the hook), its second line a
 * moment later, and under them a row of glowing numbered tokens, one for each
 * slab down the hall: the promise of what comes.
 */
function opening(hook: string, sub: string, T: number, subTo: number, tokens: string[]): Obj[] {
  const one = fit({ text: noDot(hook), width: INNER, maxLines: 1, size: 140, min: 104, weight: 900 });
  const big = one.overflow ? fit({ text: noDot(hook), width: INNER, maxLines: 2, size: 124, min: 84, weight: 900 }).lines : one.lines;
  const title = slab("title", { top: rowY(330), z: Z0 }, 0, T + 60, big, { enter: "none" });
  const subLines = fit({ text: noDot(sub), width: INNER, maxLines: 2, size: 60, min: TEXT + 2, weight: 700 }).lines.map((l) => ({ ...l, color: "#cdd6f4" }));
  const second = slab("sub", { top: bottomOf(title) + 36, z: Z0 - 20 }, 46, subTo, subLines, { enter: "rise" });
  const size = tokens.length > 3 ? 124 : 190;
  const step = size + 20;
  const y = Math.min(bottomOf(second) + 110 + size / 2, LOW - size / 2);
  const row = tokens.map((t, i): Obj => ({ id: `token${i + 1}`, kind: "medal", at: [SX + (i - (tokens.length - 1) / 2) * step * -1, y, Z0 - 30], w: size, h: size, from: 0, to: T + 60, enter: "none", word: { text: t, size: Math.round(size * 0.62), weight: 900 }, states: [{ at: -20, glow: 0.7 }] }));
  return [title, second, ...row];
}

/** The close at the opening slab: the question to the viewer under the title. */
function closing(q: string, a: string, endFrom: number, T: number, top: number): Obj {
  const l1 = fitOne(noDot(q), INNER, 68, 900, TEXT);
  const l2 = fitOne(noDot(a), INNER, 58, 700, TEXT);
  return slab("close", { top, z: Z0 - 40 }, endFrom, T - 12, [{ ...l1, weight: 900 }, { ...l2, weight: 700, color: "#ffd23f" }], { enter: "pop" });
}

const VERDICT: Record<string, Accent> = { right: "right", wrong: "wrong", contested: "maybe" };

export function planTrueFalse(p: TrueFalseProps & { rounds: (TrueFalseProps["rounds"][number] & { src?: string })[] }, tl: Timeline, opts: { badge: boolean }): Plan {
  const T = tl.total;
  const end = beat(tl, "end");
  const objects: Obj[] = [];
  const open = opening(p.hook, p.sub, T, beat(tl, "s1").from + 8, p.rounds.map((_, i) => faDigits(i + 1)));
  objects.push(...open);
  const sub = open[1];
  const shots: Shot[] = [{ at: 0, pose: orbit(at(0), BASE + 40, -3, 0), move: "cut", push: 30, sway: 0.5, why: "the opening, pushing toward the slabs" }];
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
    const chip = chipOf(r.src);
    if (!chip) sourced = false;
    // the claim, the two answers under it, then the proof where the ring was: the largest letters that keep the proof above the caption rows
    const pick = 156;
    const half = (SLAB_W - 24) / 2;
    let made: Obj[] = [];
    for (const [cs, cl, ps, pl] of [[84, 4, 60, 4], [76, 4, 56, 4], [72, 3, 56, 3], [64, 4, ANSWER, 3], [60, 4, ANSWER, 2]] as const) {
      const lines = fit({ text: noDot(r.text), width: INNER, maxLines: cl, size: cs, min: 56, weight: 800 }).lines;
      const st = slab(`claim${k}`, { top: rowY(290), z: stationZ(k) }, 0, T + 60, lines, { tag: `جملهٔ ${faDigits(k)} از ${faDigits(p.rounds.length)}`, enter: "none", states: [{ at: v.from - 2, glow: 0.8, accent }, { at: leave + 20, glow: 0, accent: "turq" }] });
      const rowAt = bottomOf(st) + 24 + pick / 2;
      // the verdict lights the right answer in its colour with its mark (a tick on «درست», a cross on «غلط») and the other steps back;
      // a contested record: both step back, and a stamp says so
      const choice = (id: string, label: string, x: number, mine: boolean, color: Accent, mark: "check" | "cross"): Obj => {
        const t = fitOne(label, half - 70, 84, 900, ANSWER);
        return { id, kind: "slab", at: [x, rowAt, stationZ(k)], w: half, h: pick, from: Math.max(1, s.from + 6), to: leave + 6, enter: "pop", lines: [{ ...t, weight: 900, role: "answer" }], ...(mine ? { mark } : {}), states: [mine ? { at: v.from - 2, glow: 1, accent: color, dz: -70, win: 1 } : { at: v.from - 2, dim: 1, dy: 24, dz: 220 }] };
      };
      const yes = choice(`yes${k}`, "درست", SX + (half + 24) / 2, r.verdict === "right", "right", "check");
      const no = choice(`no${k}`, "غلط", SX - (half + 24) / 2, r.verdict === "wrong", "wrong", "cross");
      const rowBottom = rowAt + pick / 2;
      const ringW = 280;
      const ring: Obj = { id: `ring${k}`, kind: "ring", at: [SX, rowBottom + 40 + ringW / 2, stationZ(k)], w: ringW, h: ringW, from: c.from - 4, to: v.from + 4, enter: "pop", secs: Math.max(1, Math.round((c.to - c.from) / FPS)), word: { text: "۲", size: 150, weight: 900 } };
      const proof = asAnswer(fit({ text: noDot(r.proof), width: INNER, maxLines: pl, size: ps, min: ANSWER, weight: 600 }).lines);
      const pr = slab(`proof${k}`, { top: rowBottom + 22, z: stationZ(k) - 20 }, v.from + 8, leave + 6, proof, { enter: "rise", chip, claim: true });
      made = [st, yes, no, ring, pr];
      if (bottomOf(pr) <= LOW) break;
    }
    objects.push(...made);
    if (r.verdict === "contested") {
      const word = fitOne(noDot(r.label), 560, 84, 900, ANSWER);
      const sw = Math.round(measure(word.text, word.size, 900) + 120);
      objects.push({ id: `stamp${k}`, kind: "stamp", at: [SX, made[1].at[1], stationZ(k) - 60], w: sw, h: 134, from: v.from - 2, to: leave + 6, enter: "pop", tilt: -5, accent, word: { ...word, weight: 900, role: "answer" } });
    }
    shots.push({ at: s.from - 6, pose: orbit(at(k), BASE, k % 2 ? 3 : -3, 0), move: "whip", push: 20, sway: 0.5, why: `to sentence ${k}` });
    if (c.to > c.from) shots.push({ at: c.from, pose: orbit(at(k), BASE - 20, k % 2 ? -5 : 5, -20), move: "glide", push: 16, sway: 0.8, why: `the pause of sentence ${k}` });
    shots.push({ at: v.from + 10, pose: orbit(at(k), BASE + 20, 0, 30), move: "glide", push: 14, sway: 0.4, why: `the proof of sentence ${k}` });
    punches.push({ at: v.from - 1, depth: 45, why: `verdict ${k}` });
    for (let t = 0; t < Math.round((c.to - c.from) / FPS); t += 1) sfx.push({ at: c.from + t * FPS, name: "tick", volume: 0.2, why: "pause" });
    sfx.push({ at: v.from - 2, name: "stamp", volume: 0.5, why: `verdict ${k}` });
    if (r.verdict === "right") sfx.push({ at: v.from + 2, name: "chime", volume: 0.24, why: "right" });
  });
  objects.push(closing(p.score.q, p.score.a, end.from, T, sub.at[1] - sub.h / 2));
  shots.push({ at: end.from - 6, pose: orbit(at(0), BASE + 20, 2, 0), move: "whip", push: 14, sway: 0.4, why: "back to the opening for the close" });
  return finish("truefalse", tl, { shots, punches, objects, sfx, hook: noDot(p.hook), closeAt: end.from, source: p.source, claimsSourced: sourced }, opts);
}

const latin = (s: string) => String(s).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

export function planFive(p: FiveProps & { items: (FiveProps["items"][number] & { src?: string })[] }, tl: Timeline, opts: { badge: boolean }): Plan {
  const T = tl.total;
  const end = beat(tl, "end");
  const objects: Obj[] = [];
  const first = beat(tl, `n${latin(String(p.items[0]?.n ?? "۵"))}`);
  const open = opening(p.hook, p.sub, T, first.from + 8, p.items.map((it) => faDigits(latin(String(it.n)))));
  objects.push(...open);
  const sub = open[1];
  const shots: Shot[] = [{ at: 0, pose: orbit(at(0), BASE + 40, -3, 0), move: "cut", push: 30, sway: 0.5, why: "the opening, pushing toward the five" }];
  const punches: Punch[] = [];
  const sfx: Sfx[] = [{ at: 2, name: "rise", volume: 0.18, why: "the hook" }];
  let sourced = true;
  p.items.forEach((it, i) => {
    const k = i + 1;
    const num = latin(String(it.n));
    const b = beat(tl, `n${num}`);
    const leave = i + 1 < p.items.length ? beat(tl, `n${latin(String(p.items[i + 1].n))}`).from : end.from;
    // the number, a big medal; the name and the years on one slab; the line and its source on a second
    const medalW = 220;
    const medalY = rowY(400);
    const medal: Obj = { id: `medal${k}`, kind: "medal", at: [SX, medalY, stationZ(k) - 10], w: medalW, h: medalW, from: 0, to: T + 60, enter: "none", word: { text: faDigits(num), size: 150, weight: 900 }, states: [{ at: b.from, glow: 1, accent: "gold" }, { at: leave + 20, glow: 0, accent: "turq" }] };
    objects.push(medal);
    const chip = chipOf(it.src);
    if (!chip) sourced = false;
    let made: Obj[] = [];
    for (const [ns, ls, ll] of [[104, 64, 3], [96, 60, 3], [92, 56, 3], [88, ANSWER, 3], [84, ANSWER, 2]] as const) {
      const name = fit({ text: noDot(it.name), width: INNER, maxLines: 2, size: ns, min: 64, weight: 900 }).lines;
      const fig = it.figure ? [{ ...fitOne(noDot(it.figure), INNER, 58, 800, TEXT), color: "#17d4a4" }] : [];
      const head = slab(`item${k}`, { top: medalY + medalW / 2 + 16, z: stationZ(k) }, 0, T + 60, [...name, ...fig], { enter: "none", states: [{ at: b.from, glow: 0.7 }, { at: leave + 20, glow: 0 }] });
      const line = asAnswer(fit({ text: noDot(it.line), width: INNER, maxLines: ll, size: ls, min: ANSWER, weight: 600 }).lines.map((l) => ({ ...l, color: "#e3e8fa" })));
      const lineSlab = slab(`line${k}`, { top: bottomOf(head) + 26, z: stationZ(k) - 20 }, Math.max(1, b.from + 10), leave + 6, line, { enter: "rise", chip, claim: true });
      made = [head, lineSlab];
      if (bottomOf(lineSlab) <= LOW) break;
    }
    objects.push(...made);
    const lineSlab = made[1];
    // the countdown so far, under the slabs: the five numbers, this one in gold, those told in turquoise, those to come dim (when there is room)
    const n = p.items.length;
    const size = 112;
    const step = 132;
    const y = bottomOf(lineSlab) + 40 + size / 2;
    if (y + size / 2 <= LOW + 20)
      p.items.forEach((other, j) => {
        const state = j === i ? { glow: 1, accent: "gold" as Accent } : j < i ? { glow: 0.5 } : { dim: 0.7 };
        objects.push({ id: `step${k}-${j + 1}`, kind: "medal", at: [SX - (j - (n - 1) / 2) * step, y, stationZ(k) - 20], w: size, h: size, from: Math.max(1, b.from + 14), to: leave + 6, enter: "pop", word: { text: faDigits(latin(String(other.n))), size: 66, weight: 900 }, states: [{ at: b.from + 14, ...state }] });
      });
    shots.push({ at: b.from - 6, pose: orbit(at(k), BASE, k % 2 ? 3 : -3, 0), move: "whip", push: 18, sway: 0.5, why: `to number ${faDigits(num)}` });
    const mid = Math.round((b.from + leave) / 2);
    if (leave - b.from > 100) shots.push({ at: mid, pose: orbit(at(k), BASE - 20, k % 2 ? -4 : 4, -20), move: "glide", push: 14, sway: 0.6, why: `number ${faDigits(num)}, an orbit` });
    punches.push({ at: b.from + 6, depth: 36, why: `number ${faDigits(num)}` });
    sfx.push({ at: b.from + 4, name: k === p.items.length ? "chime" : "hit", volume: k === p.items.length ? 0.3 : 0.18, why: `number ${faDigits(num)}` });
  });
  objects.push(closing(p.close.q, p.close.a, end.from, T, sub.at[1] - sub.h / 2));
  shots.push({ at: end.from - 6, pose: orbit(at(0), BASE + 20, 2, 0), move: "whip", push: 14, sway: 0.4, why: "back to the opening for the close" });
  return finish("five", tl, { shots, punches, objects, sfx, hook: noDot(p.hook), closeAt: end.from, source: p.source, claimsSourced: sourced }, opts);
}

export function planOf(format: SetFormat, props: unknown, tl: Timeline, opts: { badge: boolean }): Plan {
  if (format === "quiz") return planQuiz(props as QuizProps, tl, opts);
  if (format === "truefalse") return planTrueFalse(props as never, tl, opts);
  return planFive(props as never, tl, opts);
}

/** For the gate: the camera of a plan at a frame (also used by the tests). */
export { poseAt, MIN_TEXT };
