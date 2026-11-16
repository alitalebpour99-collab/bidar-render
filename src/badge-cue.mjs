// badge-cue.mjs: the sound of the like/follow badge (owner, 2026-11-16: «وقتی گزینهٔ فالو و لایک میاد یه صدایی
// هم بده کاربر متوجه بشه که فالو و لایک کنه، تو همهٔ پروژه‌ها»). One short in-house cue, made here in code from
// sine partials and a little shaped noise: no samples, no outside library. Every cue is a Setavaz-owned SFX
// (registered from badge-cue.library.json). Vendored as one file per project, same VERSION everywhere.
// VERSION 1 (2026-11-16)
//
// A family, not one sound: the same base (a soft attack, one note as the badge appears, an optional second as
// its follow mark lights up), with each project's own flavour. Rules shared by every project:
//   timing  exactly on the badge's first frame, and on its like → follow step when the badge has one;
//           never over a spoken word: moved to the nearest pause within ±SHIFT s, else dropped; only the
//           first time a badge shows
//   level   its peak LEVEL dB under the narrator's peak (measured on the stems), inside RANGE
//   none    Siraj Social (verbatim religious texts, no music); Manshur's mourning and casualty stories;
//           Setavaz only after the music ends on an end card (it has none today, so nothing there)
//
//   import { FLAVOURS, cueSamples, placeCue, cueGain } from './badge-cue.mjs';
//   const pcm = cueSamples('pickwise', { sr: 48000, step: 0.47 });   // Float32Array, peak 1
//   const at = placeCue({ at: 12.3, step: 0.47, body: FLAVOURS.pickwise.body, words: [[s, e], …] });
//   // at.t is the time to play it, or null with at.why when it is dropped
//   const g = cueGain(voicePeakDb, peakDb(pcm));                         // linear gain for the cue

export const VERSION = 1;
export const LEVEL = -9; // dB, the cue's peak against the narrator's peak
export const RANGE = [-10.5, -7.5]; // the gates accept this
export const SHIFT = 0.4; // s, the furthest a cue moves to find a pause
export const GUARD = 0.05; // s, air kept on each side of a word

const TAU = Math.PI * 2;
// Inharmonic partials of a small struck bell (ratio, amplitude, decay per second).
const BELL = [[1, 1, 7], [2.76, 0.42, 11], [5.4, 0.18, 17], [8.93, 0.07, 24]];
// A soft glass chime: near-harmonic, short.
const GLASS = [[1, 1, 9], [2, 0.3, 14], [3.01, 0.12, 20]];
// A muted brass blip: harmonic, the upper ones darker.
const BRASS = [[1, 1, 16], [2, 0.55, 20], [3, 0.32, 26], [4, 0.16, 32], [5, 0.08, 38]];
// A pure tone with one quiet octave.
const PURE = [[1, 1, 6], [2, 0.08, 10]];

/**
 * The flavours. Each note: at 'appear' (the badge's first frame) or 'step' (its follow mark), an offset in s,
 * a kind (bell, glass, brass, pure, pop, tick, square), a pitch in Hz and an amplitude. `body` is how long the cue is
 * heard after its last note starts (step + body must fall in a pause); `length` is the ring-out after it, the file is step + length.
 */
export const FLAVOURS = {
  pickwise: {
    names: { en: 'Pickwise badge cue: pop and bright tick', fa: 'صدای نشان پیک‌وایز: پاپ و تیکِ روشن' },
    depicts: 'a playful soft pop as the channel badge appears, then a bright little marimba-like tick as its follow mark lights up',
    tags: ['badge', 'like', 'follow', 'subscribe', 'ui', 'pop', 'tick', 'playful', 'short'],
    notes: [
      { on: 'appear', kind: 'pop', f: 520, amp: 0.8 },
      { on: 'appear', kind: 'glass', f: 1318.5, amp: 0.35, dt: 0.02 },
      { on: 'step', kind: 'glass', f: 1975.5, amp: 0.55 },
    ],
    step: 0.47, body: 0.18, length: 0.3,
  },
  iforia: {
    names: { en: 'Iforia badge cue: two rising glass notes', fa: 'صدای نشان ایفوریا: دو نتِ شیشه‌ایِ بالارونده' },
    depicts: 'a bright, curious two-note glass chime rising a fifth: the heart, then the follow mark',
    tags: ['badge', 'like', 'follow', 'subscribe', 'ui', 'chime', 'bright', 'curious', 'short'],
    notes: [
      { on: 'appear', kind: 'glass', f: 1046.5, amp: 0.8 },
      { on: 'step', kind: 'glass', f: 1568, amp: 0.7 },
    ],
    step: 0.27, body: 0.25, length: 0.45,
  },
  sirsoso: {
    names: { en: 'Sir SoSo badge cue: punchy game ding', fa: 'صدای نشان سر سوسو: دینگِ بازی‌ایِ پرضرب' },
    depicts: 'a punchy gaming pickup ding: a hard little click, then two quick bright square-ish notes a fourth apart (heart, then bell)',
    tags: ['badge', 'like', 'follow', 'subscribe', 'ui', 'ding', 'gaming', 'punchy', 'short'],
    notes: [
      { on: 'appear', kind: 'tick', f: 3200, amp: 0.5 },
      { on: 'appear', kind: 'square', f: 880, amp: 0.55, dt: 0.005 },
      { on: 'step', kind: 'square', f: 1174.7, amp: 0.6 },
    ],
    step: 0.09, body: 0.3, length: 0.45,
  },
  bidar: {
    names: { en: 'Bidar badge cue: soft museum bell', fa: 'صدای نشان بیدار: زنگِ نرمِ موزه' },
    depicts: 'one soft small bell, like a quiet museum hall chime, as the badge appears',
    tags: ['badge', 'like', 'follow', 'subscribe', 'ui', 'bell', 'soft', 'museum', 'short'],
    notes: [{ on: 'appear', kind: 'bell', f: 784, amp: 0.85 }],
    step: null, body: 0.45, length: 0.7,
  },
  divan: {
    names: { en: 'Divan badge cue: restrained brass tick', fa: 'صدای نشان دیوان: تیکِ برنجیِ آرام' },
    depicts: 'a restrained muted-brass blip with a dry tick on its front, low and short, as the badge appears',
    tags: ['badge', 'like', 'follow', 'subscribe', 'ui', 'brass', 'tick', 'restrained', 'short'],
    notes: [
      { on: 'appear', kind: 'tick', f: 1900, amp: 0.35 },
      { on: 'appear', kind: 'brass', f: 392, amp: 0.85, dt: 0.004 },
    ],
    step: null, body: 0.3, length: 0.45,
  },
  manshur: {
    names: { en: 'Manshur badge cue: one soft tone', fa: 'صدای نشان منشور: یک تُنِ نرم' },
    depicts: 'one very discreet soft pure tone with a slow attack, no melody, as the badge appears; never on mourning or casualty stories',
    tags: ['badge', 'like', 'follow', 'subscribe', 'ui', 'tone', 'discreet', 'news', 'short'],
    notes: [{ on: 'appear', kind: 'pure', f: 587.3, amp: 0.8, attack: 0.03 }],
    step: null, body: 0.4, length: 0.55,
  },
  doctor: {
    names: { en: "Doctor's site badge cue: calm soft chime", fa: 'صدای نشان سایت پزشک: زنگِ آرامِ نرم' },
    depicts: 'a calm minimal soft chime, one note, warm and quiet, as the end badge fades in',
    tags: ['badge', 'like', 'follow', 'ui', 'chime', 'calm', 'minimal', 'short'],
    notes: [{ on: 'appear', kind: 'pure', f: 659.3, amp: 0.8, attack: 0.012 }, { on: 'appear', kind: 'glass', f: 1318.5, amp: 0.18, dt: 0.01 }],
    step: null, body: 0.4, length: 0.6,
  },
};

const decayEnv = (x, attack, d) => Math.min(1, x / attack) * Math.exp(-x * d);
let seed = 20261116;
const noise = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; };

function voice(kind, f, x, attack) {
  const sum = (parts, a) => parts.reduce((v, [m, amp, d]) => v + amp * decayEnv(x, a, d) * Math.sin(TAU * f * m * x), 0);
  switch (kind) {
    case 'bell': return sum(BELL, attack ?? 0.003);
    case 'glass': return sum(GLASS, attack ?? 0.002);
    case 'brass': return sum(BRASS, attack ?? 0.008);
    case 'pure': return sum(PURE, attack ?? 0.01);
    // odd harmonics only, few of them and soft: a game «ding» without the harsh edge of a real square wave
    case 'square': return [1, 3, 5, 7].reduce((v, n) => v + (1 / (n * n * 0.6 + 0.4)) * Math.sin(TAU * f * n * x), 0) * decayEnv(x, 0.002, 13);
    // a pop: a sine that sweeps up fast, very short
    case 'pop': return Math.sin(TAU * (f * x + 2600 * x * x)) * decayEnv(x, 0.002, 38);
    // a tick: a tiny burst of a high sine and noise
    case 'tick': return (0.7 * Math.sin(TAU * f * x) + 0.3 * noise()) * decayEnv(x, 0.0008, 160);
    default: throw new Error(`badge-cue: unknown kind ${kind}`);
  }
}

/** The step (s) a flavour's second note waits: the badge's own (two-step badges) or the flavour's default. */
export const stepOf = (name, step) => (FLAVOURS[name].step === null ? null : step ?? FLAVOURS[name].step);

/** The cue as mono samples, peak 1. `step`: seconds from the badge's first frame to its follow mark; `short`: its
 *  first note(s) alone, for a pause too short for both (placeCue). */
export function cueSamples(name, { sr = 48000, step, short = false } = {}) {
  const fl = FLAVOURS[name];
  if (!fl) throw new Error(`badge-cue: no flavour ${name}`);
  const s = short ? 0 : stepOf(name, step) ?? 0;
  const len = fl.length + s;
  const n = Math.ceil(len * sr);
  const out = new Float32Array(n);
  for (const note of fl.notes) {
    const t0 = (note.on === 'step' ? s : 0) + (note.dt ?? 0);
    if (note.on === 'step' && (fl.step === null || short)) continue;
    for (let i = Math.floor(t0 * sr); i < n; i++) out[i] += note.amp * voice(note.kind, note.f, i / sr - t0, note.attack);
  }
  // the ring-out ends in a 30 ms fade; the whole cue is set to a peak of 1
  const fade = Math.round(0.03 * sr);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    if (i > n - fade) out[i] *= (n - i) / fade;
    peak = Math.max(peak, Math.abs(out[i]));
  }
  for (let i = 0; i < n; i++) out[i] /= peak || 1;
  return out;
}

/** How long the cue is heard from its start (what has to sit in a pause). */
export const bodyOf = (name, step) => FLAVOURS[name].body + (stepOf(name, step) ?? 0);

/**
 * Where the cue plays. at: the badge's first frame (s); words: [[start, end], …] in s; body: bodyOf(…).
 * The cue stays at `at` when that is clear of every word (GUARD each side); else the nearest clear start within
 * ±SHIFT (10 ms steps, the earlier one on a tie); else, when `short` is given (the body of the first note alone, a
 * two-step flavour), the same for that shorter cue (→ short: true, play cueSamples(…, { short: true })); else it is
 * dropped. → { t, shift, short } or { t: null, why }.
 */
export function placeCue({ at, words = [], body, short = null, shift = SHIFT, guard = GUARD, duration = Infinity }) {
  if (!Number.isFinite(at)) return { t: null, why: 'no badge' };
  const fits = (len) => {
    const clear = (t) => t >= 0 && t + len <= duration + 1e-6 && words.every(([s, e]) => t + len <= s - guard || t >= e + guard);
    for (let k = 0; k <= Math.round(shift * 100); k++) {
      for (const d of k === 0 ? [0] : [-k / 100, k / 100]) if (clear(at + d)) return { t: Math.round((at + d) * 1000) / 1000, shift: Math.round(d * 100) / 100 };
    }
    return null;
  };
  const whole = fits(body);
  if (whole) return { ...whole, short: false };
  const part = short !== null && short < body ? fits(short) : null;
  if (part) return { ...part, short: true };
  const len = short !== null && short < body ? short : body;
  return { t: null, why: `no pause of ${(len + 2 * guard).toFixed(2)} s within ±${shift} s of the badge at ${at.toFixed(2)} s` };
}
/** The body of a two-step flavour's first note alone (placeCue's `short`), or null for a one-note flavour. */
export const shortBodyOf = (name) => (FLAVOURS[name].step === null ? null : FLAVOURS[name].body);

/** Peak of samples in dBFS. */
export function peakDb(pcm) {
  let p = 0;
  for (let i = 0; i < pcm.length; i++) p = Math.max(p, Math.abs(pcm[i]));
  return p > 0 ? 20 * Math.log10(p) : -Infinity;
}
/** The linear gain that puts a cue of peak `cueDb` at LEVEL dB under a narrator of peak `voiceDb`. */
export const cueGain = (voiceDb, cueDb = 0, level = LEVEL) => Math.pow(10, (voiceDb + level - cueDb) / 20);

/** 16-bit mono (or stereo with `stereo`) WAV bytes. */
export function wavBytes(pcm, sr = 48000, { stereo = false } = {}) {
  // Node only (the rest of this file also runs in a browser bundle, so Buffer is not imported)
  const { Buffer } = globalThis;
  const ch = stereo ? 2 : 1;
  const data = Buffer.alloc(pcm.length * 2 * ch);
  for (let i = 0; i < pcm.length; i++) {
    const v = Math.max(-1, Math.min(1, pcm[i]));
    for (let c = 0; c < ch; c++) data.writeInt16LE(Math.round(v * 32767), (i * ch + c) * 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(ch, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 2 * ch, 28); h.writeUInt16LE(2 * ch, 32); h.writeUInt16LE(16, 34); h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

/** The library entry of a flavour, in the Ahura library's register() shape (ahura-library.mjs), owned by Setavaz. */
export function libraryEntry(name, { project = name, file } = {}) {
  const fl = FLAVOURS[name];
  return {
    kind: 'sfx',
    id: `setavaz-badge-cue-${name}`,
    names: fl.names,
    description: fl.depicts,
    depicts: fl.depicts,
    tags: fl.tags,
    style: `badge-cue-${name}`,
    facts: { seconds: fl.length + (fl.step ?? 0), step: fl.step, body: fl.body, levelUnderVoiceDb: LEVEL, family: 'badge-cue', version: VERSION },
    made: { tool: 'code', model: null, prompt: null, source: 'badge-cue.mjs', detail: `synthesised in code (${[...new Set(fl.notes.map((n) => n.kind))].join(', ')}): sine partials and shaped noise, no samples` },
    licence: { kind: 'own', name: 'Setavaz', credit: null, url: null },
    owner: 'setavaz',
    origin: { project, made: '2026-11-16', by: 'badge-cue.mjs VERSION ' + VERSION },
    use: 'on the like/follow channel badge of every video, ducked under the narrator',
    files: file ? [{ path: file, role: 'master', label: 'wav 48 kHz mono' }] : [],
  };
}
