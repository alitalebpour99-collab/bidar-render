// The badge's sound (owner, 2026-11-16: «وقتی گزینهٔ فالو و لایک میاد یه صدایی هم بده کاربر متوجه بشه»): Bidar's
// flavour of the shared badge cue (../badge-cue.mjs, a Setavaz-owned SFX), one soft museum bell as the badge comes.
// Never over the narrator's words (the nearest pause within ±0.4 s, else left out); its peak LEVEL dB under the
// narrator's. Pure: the plans (plans.ts, doc.ts) and the gate (gate.mjs) use it; sfx.mjs writes public/sfx/badge.wav.
// Its moment (owner, 2026-11-17: «بج رو ببر توی یه مکث»): the badge itself comes in a pause of the narration inside
// the close (badgeMoment), so the bell on its first frame is heard on its own; when the close has no pause that long,
// a short breath goes in between two of its sentences first (badgeRoom, before the plan). No word is ever cut.
import { GUARD, LEVEL, RANGE, SHIFT, bodyOf, placeCue } from "../badge-cue.mjs";

export const BADGE_CUE = "badge";
export const FLAVOUR = "bidar";
/** The peak of public/sfx/badge.wav: sfx.mjs sets every effect's peak to 0.89. */
export const CUE_FILE_PEAK_DB = 20 * Math.log10(0.89);
/** The narrator's peak (an ElevenLabs take, narrate.mjs, peaks about here; the file is not read in the browser). */
export const VOICE_PEAK_DB = -1.5;
const FPS = 30;

/** The owner's shortest pause for the badge (s); the bell's own body with air on both sides counts when it is longer. */
export const MIN_PAUSE = 0.35;
/** The breath put between two sentences of the close when it has no pause that long (s). */
export const BREATH = 0.4;
/** The badge is on screen at least MIN_ON frames, it leaves END_ROOM frames before the last one (the loop), and stays FULL when it can. */
const MIN_ON = 45;
const END_ROOM = 20;
/** A word that ends a sentence (its punctuation is kept in the timeline's words). */
const STOP = /[.!?؟؛;…]["'»)]*$/;
/** What a word takes of the narration: from its first letter to its last (not the pause its «.» or «؟» holds). */
const spoken = (w) => [w.from, Math.min(w.to, w.said ?? w.to)];
/** Frames of silence the badge's moment needs. */
export const needFrames = () => Math.ceil(Math.max(MIN_PAUSE, bodyOf(FLAVOUR) + 2 * GUARD) * FPS);
/** Frames after a word's last letter before the badge (and its bell) comes. */
const AIR = Math.ceil(GUARD * FPS);
/** How long after the close begins the badge may come: the source line first (the set's row, the documents' row). */
export const badgeLead = (format) => (format === "belief" || format === "frontier" ? 16 : 20);
/** Where the badge may begin: from the close plus its lead to where it still has MIN_ON frames before END_ROOM. */
export const badgeWindow = (total, closeAt, lead) => ({ lo: closeAt + lead, hi: total - END_ROOM - MIN_ON });

/**
 * The badge's moment in the close: { from, room, pause } or { from: null, breath: { at, frames } }.
 * First a pause between two of the close's words (the earliest), so the badge is not on the very last frames;
 * else, with `breath`, a breath between two sentences of the close; else the silence after the last word.
 */
export function badgeMoment(words, { lo, hi }, { breath = true } = {}) {
  const sp = [...words].sort((a, b) => a.from - b.from).map((w) => ({ w, s: spoken(w) }));
  const need = needFrames();
  const gaps = sp.map(({ w, s }, i) => ({ a: s[1], z: i + 1 < sp.length ? sp[i + 1].s[0] : Infinity, w }));
  if (!sp.length || sp[0].s[0] > lo) gaps.unshift({ a: -Infinity, z: sp.length ? sp[0].s[0] : Infinity, w: null });
  const at = (g) => {
    const t = Math.max(lo, Math.ceil(g.a) + AIR);
    return t <= hi && g.z - t >= need - AIR && g.z - g.a >= need ? t : null;
  };
  const inner = gaps.filter((g) => Number.isFinite(g.z));
  for (const g of inner) { const t = at(g); if (t !== null) return { from: t, room: "pause", pause: [g.a, g.z] }; }
  if (breath) {
    for (const g of inner) {
      if (!g.w || !STOP.test(g.w.text) || Math.ceil(g.a) + AIR < lo || Math.ceil(g.a) + AIR > hi) continue;
      const frames = Math.max(Math.round(BREATH * FPS), need - (g.z - g.a));
      return { from: null, breath: { at: Math.round((g.a + g.z) / 2), frames, after: g.w.text } };
    }
  }
  const tail = gaps.find((g) => !Number.isFinite(g.z));
  const t = tail ? at(tail) : null;
  if (t !== null) return { from: t, room: "tail", pause: [tail.a, tail.z] };
  return { from: null, why: `no pause of ${(need / FPS).toFixed(2)} s in the close` };
}

/** The timeline with `frames` of silence from frame `at`: everything later waits, the take is cut there, no word is cut. */
export function breathe(tl, at, frames) {
  if (tl.words.some((w) => w.from < at && spoken(w)[1] > at)) throw new Error(`a breath at ${at} would cut a word`);
  const sh = (f) => (f >= at ? f + frames : f);
  const words = tl.words.map((w) => ({ ...w, from: sh(w.from), to: sh(w.to), ...(w.said !== undefined ? { said: sh(w.said) } : {}) }));
  const voice = [];
  for (const v of tl.voice) {
    const end = v.frames === undefined ? Infinity : v.from + v.frames;
    if (v.from >= at) voice.push({ ...v, from: v.from + frames });
    else if (end <= at) voice.push(v);
    else {
      const head = at - v.from;
      voice.push({ ...v, frames: head });
      voice.push({ file: v.file, from: at + frames, trim: (v.trim ?? 0) + head, ...(v.frames !== undefined ? { frames: v.frames - head } : {}) });
    }
  }
  const beats = Object.fromEntries(Object.entries(tl.beats).map(([id, b]) => [id, { from: sh(b.from), to: sh(b.to) }]));
  return { ...tl, total: tl.total + frames, beats, words, voice, speechEnd: sh(tl.speechEnd), duck: tl.duck.map(([a, z]) => [sh(a), sh(z)]), breath: { at, frames } };
}

/** Room for the badge before the plan: the timeline, with a breath in the close when it has no pause long enough. */
export function badgeRoom(tl, format) {
  const close = tl.beats.end;
  if (!close || !tl.voice.length) return tl;
  const m = badgeMoment(tl.words, badgeWindow(tl.total, close.from, badgeLead(format)));
  return m.breath ? breathe(tl, m.breath.at, m.breath.frames) : tl;
}

/** The badge's first frame: in its pause, or (no pause at all) where it always came, with the bell left out. */
export function badgeFrom(tl, closeAt, format) {
  const lead = badgeLead(format);
  const m = badgeMoment(tl.words, badgeWindow(tl.total, closeAt, lead), { breath: false });
  return m.from ?? closeAt + lead;
}

/** The badge's bell: { sfx, cue }. sfx is the effect to add (null when left out), cue what the gate reads. */
export function badgeCue(from, words = []) {
  const near = words.map(spoken).filter(([a, z]) => z >= from - 2 * FPS && a <= from + 2 * FPS);
  const place = placeCue({ at: from / FPS, body: bodyOf(FLAVOUR), words: near.map(([a, z]) => [a / FPS, z / FPS]) });
  if (place.t === null) return { sfx: null, cue: { at: from, frame: null, why: place.why, speech: near } };
  const volume = Math.round(10 ** ((VOICE_PEAK_DB + LEVEL - CUE_FILE_PEAK_DB) / 20) * 1000) / 1000;
  const level = Math.round((CUE_FILE_PEAK_DB + 20 * Math.log10(volume) - VOICE_PEAK_DB) * 10) / 10;
  const frame = Math.round(place.t * FPS);
  return { sfx: { at: frame, name: BADGE_CUE, volume, why: "the badge's bell" }, cue: { at: from, frame, level, shift: place.shift, speech: near } };
}

/** The gate: the bell once near the badge, over no word, at its level; no badge, no bell. */
export function badgeCueCheck(plan) {
  const badge = plan.hud.find((h) => h.kind === "badge");
  const bells = plan.sfx.filter((s) => s.name === BADGE_CUE);
  if (!badge) return { ok: bells.length === 0, detail: bells.length ? "a bell without a badge" : "no badge, no bell" };
  const cue = badge.cue;
  if (!bells.length) return { ok: Boolean(cue && cue.frame === null), detail: cue?.why ? `the bell is left out: ${cue.why}` : "the badge has no bell" };
  const b = bells[0];
  const body = bodyOf(FLAVOUR) * FPS;
  const over = (cue?.speech ?? []).filter(([a, z]) => b.at + body > a && b.at < z);
  const level = cue?.level;
  const at = cue?.at ?? badge.from;
  const ok = bells.length === 1 && b.at === cue?.frame && Math.abs(b.at - at) <= SHIFT * FPS + 0.5 && !over.length && level >= RANGE[0] && level <= RANGE[1];
  return { ok, detail: `one bell at ${(b.at / FPS).toFixed(2)} s (${((b.at - at) / FPS).toFixed(2)} s from the badge's first frame), ${over.length ? "over the narrator" : "over no word"}, peak ${level} dB against the narrator's (${RANGE[0]} to ${RANGE[1]})` };
}
