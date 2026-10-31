// The low bed under a Reel, synthesized: no sample, no licence, no download.
// Each series has its own sound as it has its own look (the owner disliked
// formats that look and sound alike): the borders a slow drone with a deep
// pulse, the myth a plucked string like a tar's, the word a few bells; the
// quote, the figure and the quiz only dark, minimal drones (with a sub pulse
// for the last two): no piano, no santur, nothing busy.
// The bar is stretched so the Reel is a whole number of bars, the last bar
// comes home, and the bed steps down to a quarter under the narrator.
//   score({ id, seconds, duck }) -> Buffer (WAV, 44.1 kHz stereo 16-bit)
const RATE = 44100;
const TAU = Math.PI * 2;
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));

// a fixed noise source, so the same Reel always gets the same bed
let seed = 11;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 31 - 1;
};

const MOODS = {
  // D minor-ish, slow, a drone and a soft heartbeat: the map breathing
  borders: { root: 38, bpm: 56, voice: "drone", pulse: true },
  // A, a plucked string on the beats of a dastgah-like line (Shur's lowered second)
  myth: { root: 45, bpm: 66, voice: "pluck" },
  // E, bells over a soft pad: a journey
  word: { root: 52, bpm: 72, voice: "bell" },
  // «سخنِ ماندگار»: a low D drone and nothing else, kept far under the reading (no pulse, no melody)
  quote: { root: 38, bpm: 48, voice: "drone", level: 0.62 },
  // «چهره‌ها»: a dark F drone with a slow sub pulse, like a print room
  figure: { root: 41, bpm: 60, voice: "drone", pulse: true, level: 0.8 },
  // «حدس بزن»: an A drone over a quicker sub pulse; it rises when the voice stops for the countdown
  quiz: { root: 45, bpm: 96, voice: "drone", pulse: true, level: 0.9 },
  // the three drawn formats: restrained, dark and minimal, no line and no plucked or struck voice
  // (the owner disliked cartoonish piano and santur): only held tones under the narrator
  // G, an open pad that barely moves: a quiet drawing room
  flag: { root: 43, bpm: 58, voice: "air" },
  // C, a low drone and a slow sub pulse once a bar: the archive
  treaty: { root: 36, bpm: 50, voice: "dark", sub: true },
  // E, a drone and a high fifth that swells and fades each bar, like a ring turning
  city: { root: 40, bpm: 52, voice: "orbit" },
  // the round of 2026-10-31 (proposal): Divan's «data-steady» brief, made here
  // (a muted eighth pulse, a clock tick, a soft pad, a sub on the downbeat; minor; no melody)
  // «درست یا غلط؟»: G, 100 bpm, the tick a little brighter (a game against the clock)
  truefalse: { root: 43, bpm: 100, voice: "steady", sub: true, tick: 0.05, level: 0.85 },
  // «پنج‌تایی»: A, 92 bpm, a countdown that keeps walking
  five: { root: 45, bpm: 92, voice: "steady", sub: true, tick: 0.035, level: 0.85 },
  // «تاریخ ایران در یک دقیقه»: E, 108 bpm, the quickest, like a clock running through the centuries
  sweep: { root: 40, bpm: 108, voice: "steady", sub: true, tick: 0.045, level: 0.9 },
  // «از کتاب» v2: room tone only, far under the book's reading; it carries the title page and the last card
  book2: { root: 38, bpm: 48, voice: "room", level: 0.55 },
};

// i  VI  III  VII
const CHORDS = [
  [0, 7, 15],
  [-4, 3, 12],
  [3, 10, 19],
  [-2, 5, 14],
];
// the plucked line: degrees of a mode with a lowered second (1, b2, b3, 4, 5, b6, b7)
const SHUR = [0, 1, 3, 5, 7, 8, 10];

function pad(L, R, from, to, midi, gain, cross = 0.9) {
  const f = hz(midi);
  const a = Math.max(0, Math.floor((from - cross) * RATE));
  const b = Math.min(L.length, Math.ceil((to + cross) * RATE));
  for (let n = a; n < b; n += 1) {
    const t = n / RATE;
    const env = smooth((t - (from - cross)) / (2 * cross)) * smooth((to + cross - t) / (2 * cross)) * gain;
    L[n] += env * (Math.sin(TAU * f * t) + 0.08 * Math.sin(TAU * 2 * f * t));
    R[n] += env * (Math.sin(TAU * f * 1.0016 * t + 1.1) + 0.08 * Math.sin(TAU * 2 * f * 1.0016 * t));
  }
}

/** Karplus–Strong: a string plucked once, with a soft attack. */
function pluck(L, R, at, midi, gain, pan) {
  const f = hz(midi);
  const period = Math.max(2, Math.round(RATE / f));
  const ring = new Float32Array(period);
  for (let i = 0; i < period; i += 1) ring[i] = noise() * 0.5;
  const start = Math.round(at * RATE);
  const length = Math.min(L.length - start, Math.round(2.6 * RATE));
  const lg = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const rg = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  let idx = 0;
  let last = 0;
  for (let n = 0; n < length; n += 1) {
    const cur = ring[idx];
    const nxt = ring[(idx + 1) % period];
    const v = 0.4985 * (cur + nxt);
    ring[idx] = v;
    idx = (idx + 1) % period;
    // a gentle low-pass so it is warm, not bright
    last += 0.45 * (cur - last);
    const s = last * Math.min(1, n / 60);
    L[start + n] += lg * s;
    R[start + n] += rg * s;
  }
}

/** A soft bell: a few inharmonic partials. */
function bell(L, R, at, midi, gain, pan) {
  const f = hz(midi);
  const start = Math.round(at * RATE);
  const length = Math.min(L.length - start, Math.round(4 * RATE));
  const lg = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const rg = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let n = 0; n < length; n += 1) {
    const t = n / RATE;
    const s = (Math.sin(TAU * f * t) * Math.exp(-t / 1.4) + 0.35 * Math.sin(TAU * f * 2.01 * t) * Math.exp(-t / 0.7) + 0.12 * Math.sin(TAU * f * 3.98 * t) * Math.exp(-t / 0.35)) * Math.min(1, t * 300);
    L[start + n] += lg * s;
    R[start + n] += rg * s;
  }
}

/** A muted note: a short, soft, low-passed tone (the «data-steady» pulse). */
function mute(L, R, at, midi, gain, pan) {
  const f = hz(midi);
  const start = Math.round(at * RATE);
  const length = Math.min(L.length - start, Math.round(0.32 * RATE));
  if (length <= 0) return;
  const lg = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const rg = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let n = 0; n < length; n += 1) {
    const t = n / RATE;
    const env = Math.min(1, t / 0.004) * Math.exp(-t / 0.085);
    const v = env * (Math.sin(TAU * f * t) + 0.32 * Math.sin(TAU * 2 * f * t) * Math.exp(-t / 0.03));
    L[start + n] += lg * v;
    R[start + n] += rg * v;
  }
}

/** A clock's tick: a few milliseconds of bright noise. */
function tick(L, R, at, gain) {
  const start = Math.round(at * RATE);
  const length = Math.min(L.length - start, Math.round(0.012 * RATE));
  let last = 0;
  for (let n = 0; n < length; n += 1) {
    const x = noise();
    const hp = x - last;
    last = x;
    const v = gain * hp * Math.exp(-n / (0.0025 * RATE));
    L[start + n] += v;
    R[start + n] += v * 0.8;
  }
}

function comb(input, delay, feedback, damp) {
  const out = new Float32Array(input.length);
  const line = new Float32Array(delay);
  let index = 0;
  let store = 0;
  for (let n = 0; n < input.length; n += 1) {
    const delayed = line[index];
    store = delayed * (1 - damp) + store * damp;
    line[index] = input[n] + store * feedback;
    out[n] = delayed;
    index = index + 1 === delay ? 0 : index + 1;
  }
  return out;
}
function allpass(input, delay) {
  const out = new Float32Array(input.length);
  const line = new Float32Array(delay);
  let index = 0;
  for (let n = 0; n < input.length; n += 1) {
    const delayed = line[index];
    out[n] = delayed - input[n];
    line[index] = input[n] + delayed * 0.5;
    index = index + 1 === delay ? 0 : index + 1;
  }
  return out;
}
// a soft hall (Freeverb's tunings)
function room(channel, spread) {
  const wet = new Float32Array(channel.length);
  for (const delay of [1116, 1277, 1422, 1557]) {
    const v = comb(channel, delay + spread, 0.84, 0.5);
    for (let n = 0; n < wet.length; n += 1) wet[n] += v[n] * 0.25;
  }
  return allpass(allpass(wet, 556 + spread), 441 + spread);
}

/**
 * Whether a Reel gets a bed at all. The book («از کتاب») gets none: it is the
 * book's own reading, and the owner is strict about music under a voice.
 */
export const hasBed = (id) => id !== "book";

export function score({ id, seconds, duck = [] }) {
  const mood = MOODS[id] ?? MOODS.borders;
  const { root, bpm } = mood;
  seed = 11;
  const total = Math.ceil(seconds * RATE);
  const L = new Float32Array(total);
  const R = new Float32Array(total);
  const bars = Math.max(2, Math.round(seconds / ((60 / bpm) * 4)));
  const bar = seconds / bars;
  const beat = bar / 4;
  const chordOf = (b) => (b === bars - 1 ? CHORDS[0] : CHORDS[b % 4]);

  for (let b = 0; b < bars; b += 1) {
    const chord = chordOf(b);
    const from = b * bar;
    const to = (b + 1) * bar;
    if (mood.voice === "drone") {
      // the drone holds the key note and its fifth all through; the chord moves softly above it
      pad(L, R, from, to, root, 0.07);
      pad(L, R, from, to, root + 7, 0.035);
      chord.forEach((o) => pad(L, R, from, to, root + 12 + o, 0.026));
    } else if (mood.voice === "pluck") {
      pad(L, R, from, to, root - 12, 0.04);
      pad(L, R, from, to, root - 5, 0.018);
      // a line that walks the mode: two notes a beat, resting on the first of the bar
      for (let q = 0; q < 8; q += 1) {
        if (b === bars - 1 && q > 0) break;
        const step = [0, 2, 1, 3, 4, 3, 2, 1][(q + b * 3) % 8];
        const deg = SHUR[(step + (b % 2 ? 2 : 0)) % SHUR.length];
        if (q % 2 === 1 && (q + b) % 3 === 0) continue;
        pluck(L, R, from + q * (beat / 2), root + 12 + deg, q === 0 ? 0.34 : 0.22, q % 2 ? 0.3 : -0.3);
      }
    } else if (mood.voice === "air") {
      // the key note low, the chord an octave up and very soft; it moves only every second bar
      pad(L, R, from, to, root, 0.045);
      const soft = chordOf(b - (b % 2));
      soft.forEach((o) => pad(L, R, from, to, root + 12 + o, 0.017, 1.4));
    } else if (mood.voice === "dark") {
      // one held low fifth, and the minor third far above it, barely there
      pad(L, R, from, to, root, 0.08);
      pad(L, R, from, to, root + 7, 0.032);
      pad(L, R, from, to, root + 15, 0.01, 1.6);
    } else if (mood.voice === "steady") {
      // the pad: the key note and its fifth, the chord very soft above (it moves every bar, never a tune)
      pad(L, R, from, to, root, 0.045);
      pad(L, R, from, to, root + 7, 0.02);
      chord.forEach((o) => pad(L, R, from, to, root + 12 + o, 0.01, 1.2));
      // the pulse: eight muted notes a bar on the key note an octave up, the fourth of each half on the fifth; the last bar only its first
      for (let q = 0; q < 8; q += 1) {
        if (b === bars - 1 && q > 0) break;
        mute(L, R, from + q * (beat / 2), root + 12 + (q % 4 === 3 ? 7 : 0), q % 2 ? 0.05 : 0.085, q % 2 ? 0.28 : -0.28);
      }
      // the clock: a tick on every off-beat
      if (b < bars - 1) for (let q = 1; q < 8; q += 2) tick(L, R, from + q * (beat / 2), mood.tick ?? 0.04);
    } else if (mood.voice === "room") {
      // a far low pad, and a breath of brown noise: the room the book is read in
      pad(L, R, from, to, root, 0.03, 1.6);
      pad(L, R, from, to, root + 7, 0.012, 1.6);
      const a = Math.floor(from * RATE);
      const z = Math.min(L.length, Math.ceil(to * RATE));
      let bl = 0;
      let br = 0;
      for (let n = a; n < z; n += 1) {
        bl = 0.995 * bl + 0.02 * noise();
        br = 0.995 * br + 0.02 * noise();
        L[n] += bl * 0.35;
        R[n] += br * 0.35;
      }
    } else if (mood.voice === "orbit") {
      pad(L, R, from, to, root, 0.062);
      pad(L, R, from, to, root + 7, 0.026);
      // a high fifth that rises and falls once a bar, panned slowly from side to side
      const f = hz(root + 19);
      const a = Math.floor(from * RATE);
      const z = Math.min(L.length, Math.ceil(to * RATE));
      for (let n = a; n < z; n += 1) {
        const t = n / RATE;
        const u = (t - from) / (to - from);
        const env = 0.016 * Math.sin(Math.PI * u) ** 2;
        const pan = 0.5 + 0.4 * Math.sin(TAU * (b / 4 + u / 4));
        const s = env * Math.sin(TAU * f * t);
        L[n] += s * (1 - pan);
        R[n] += s * pan;
      }
    } else {
      chord.forEach((o) => pad(L, R, from, to, root + o, 0.032));
      // a bell on the first and third beat, one note of the chord, an octave up
      for (const q of [0, 2]) {
        if (b === bars - 1 && q > 0) break;
        bell(L, R, from + q * beat, root + 24 + chord[(b + q / 2) % 3], q === 0 ? 0.07 : 0.05, q ? 0.35 : -0.35);
      }
    }
  }
  if (mood.pulse) {
    // a deep, soft heartbeat on the first and third beat; none in the last bar
    for (let b = 0; b < bars - 1; b += 1) {
      for (const q of [0, 2]) {
        const start = Math.round((b * bar + q * beat) * RATE);
        const length = Math.min(total - start, Math.round(0.6 * RATE));
        const gain = q === 0 ? 0.26 : 0.16;
        let phase = 0;
        for (let n = 0; n < length; n += 1) {
          const t = n / RATE;
          const f = 40 + 26 * Math.exp(-t / 0.05);
          phase += (TAU * f) / RATE;
          const s = gain * Math.exp(-t / 0.2) * Math.sin(phase) * (t < 0.004 ? t / 0.004 : 1);
          L[start + n] += s;
          R[start + n] += s;
        }
      }
    }
  }

  if (mood.sub) {
    // a deep, slow sub pulse once a bar, longer and lower than the borders' heartbeat; none in the last bar
    for (let b = 0; b < bars - 1; b += 1) {
      const start = Math.round(b * bar * RATE);
      const length = Math.min(total - start, Math.round(1.1 * RATE));
      let phase = 0;
      for (let n = 0; n < length; n += 1) {
        const t = n / RATE;
        const f = 34 + 18 * Math.exp(-t / 0.08);
        phase += (TAU * f) / RATE;
        const s = 0.24 * Math.exp(-t / 0.36) * Math.sin(phase) * (t < 0.01 ? t / 0.01 : 1);
        L[start + n] += s;
        R[start + n] += s;
      }
    }
  }

  const wetL = room(L, 0);
  const wetR = room(R, 23);
  let peak = 0;
  for (let n = 0; n < total; n += 1) {
    const t = n / RATE;
    const under = duck.reduce((m, [a, b]) => Math.max(m, Math.min(smooth((t - a + 0.25) / 0.25), smooth((b + 0.35 - t) / 0.35))), 0);
    const level = smooth(t / 0.4) * smooth((seconds - t) / 2.2) * (1 - 0.72 * under);
    L[n] = (L[n] + 0.3 * wetL[n]) * level;
    R[n] = (R[n] + 0.3 * wetR[n]) * level;
    peak = Math.max(peak, Math.abs(L[n]), Math.abs(R[n]));
  }
  const gain = (peak ? 0.5 / peak : 1) * (mood.level ?? 1);
  const data = Buffer.alloc(total * 4);
  for (let n = 0; n < total; n += 1) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[n] * gain)) * 32767), n * 4);
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[n] * gain)) * 32767), n * 4 + 2);
  }
  const head = Buffer.alloc(44);
  head.write("RIFF", 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write("WAVEfmt ", 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(2, 22);
  head.writeUInt32LE(RATE, 24);
  head.writeUInt32LE(RATE * 4, 28);
  head.writeUInt16LE(4, 32);
  head.writeUInt16LE(16, 34);
  head.write("data", 36);
  head.writeUInt32LE(data.length, 40);
  return Buffer.concat([head, data]);
}
