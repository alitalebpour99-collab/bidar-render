// The badge's sound (owner, 2026-11-16: «وقتی گزینهٔ فالو و لایک میاد یه صدایی هم بده کاربر متوجه بشه»): Bidar's
// flavour of the shared badge cue (../badge-cue.mjs, a Setavaz-owned SFX), one soft museum bell as the badge comes.
// Never over the narrator's words (the nearest pause within ±0.4 s, else left out); its peak LEVEL dB under the
// narrator's. Pure: the plans (plans.ts, doc.ts) and the gate (gate.mjs) use it; sfx.mjs writes public/sfx/badge.wav.
import { LEVEL, RANGE, SHIFT, bodyOf, placeCue } from "../badge-cue.mjs";

export const BADGE_CUE = "badge";
export const FLAVOUR = "bidar";
/** The peak of public/sfx/badge.wav: sfx.mjs sets every effect's peak to 0.89. */
export const CUE_FILE_PEAK_DB = 20 * Math.log10(0.89);
/** The narrator's peak (an ElevenLabs take, narrate.mjs, peaks about here; the file is not read in the browser). */
export const VOICE_PEAK_DB = -1.5;
const FPS = 30;

/** The badge's bell: { sfx, cue }. sfx is the effect to add (null when left out), cue what the gate reads. */
export function badgeCue(from, words = []) {
  const near = words.filter((w) => w.to >= from - 2 * FPS && w.from <= from + 2 * FPS).map((w) => [w.from, w.to]);
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
