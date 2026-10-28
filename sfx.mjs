// The Reels' sound effects, synthesized like the score (music.mjs): no sample, no licence, no download.
// Written once into public/sfx/ and committed; a Reel plays them at its own moments (kit.tsx, <Sfx>).
// The first six are Divan's (divan-render/sfx.mjs); stamp, paper, chime and draw are Bidar's.
//   node sfx.mjs        writes public/sfx/{whoosh,hit,tick,pop,rise,swish,stamp,paper,chime,draw}.wav
import fs from "node:fs";
import path from "node:path";

const RATE = 44100;
const TAU = Math.PI * 2;

// a small fixed noise source, so the files come out the same every time
let seed = 7;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 31 - 1;
};

function wav(L, R) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 4, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 4, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 4, 40);
  let peak = 0;
  for (let i = 0; i < n; i += 1) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const k = peak > 0 ? 0.89 / peak : 1;
  for (let i = 0; i < n; i += 1) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * k)) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * k)) * 32767), 46 + i * 4);
  }
  return buf;
}

const make = (seconds) => [new Float32Array(Math.round(seconds * RATE)), new Float32Array(Math.round(seconds * RATE))];

/** Air moving past: noise through a band that sweeps up then down, panned across. */
function whoosh(seconds = 0.55) {
  const [L, R] = make(seconds);
  let lp = 0;
  let bp = 0;
  for (let i = 0; i < L.length; i += 1) {
    const t = i / L.length;
    const env = Math.sin(Math.PI * t) ** 1.6;
    // a simple two-pole filter whose centre sweeps 400 Hz → 2.6 kHz → 900 Hz
    const f = 400 + 2200 * Math.sin(Math.PI * Math.min(1, t * 1.25));
    const c = 2 * Math.sin((Math.PI * f) / RATE);
    const x = noise();
    lp += c * bp;
    bp += c * (x - lp - 0.35 * bp);
    const s = bp * env;
    const pan = t;
    L[i] = s * (1 - pan * 0.6);
    R[i] = s * (0.4 + pan * 0.6);
  }
  return wav(L, R);
}

/** A low, soft impact: a falling sine with a short click on top, for a figure that lands. */
function hit(seconds = 0.9) {
  const [L, R] = make(seconds);
  let phase = 0;
  for (let i = 0; i < L.length; i += 1) {
    const t = i / RATE;
    const f = 52 + 90 * Math.exp(-t * 18);
    phase += (TAU * f) / RATE;
    const body = Math.sin(phase) * Math.exp(-t * 5.5);
    const click = noise() * Math.exp(-t * 160) * 0.5;
    const s = body + click;
    L[i] = s;
    R[i] = s;
  }
  return wav(L, R);
}

/** A dry tick, for a counter or a reordering. */
function tick(seconds = 0.08) {
  const [L, R] = make(seconds);
  for (let i = 0; i < L.length; i += 1) {
    const t = i / RATE;
    const s = (Math.sin(TAU * 2400 * t) * 0.6 + noise() * 0.4) * Math.exp(-t * 90);
    L[i] = s;
    R[i] = s;
  }
  return wav(L, R);
}

/** A round blip that rises a little, for something that appears. */
function pop(seconds = 0.22) {
  const [L, R] = make(seconds);
  let phase = 0;
  for (let i = 0; i < L.length; i += 1) {
    const t = i / RATE;
    const f = 520 + 380 * (1 - Math.exp(-t * 40));
    phase += (TAU * f) / RATE;
    const s = Math.sin(phase) * Math.exp(-t * 22) * Math.min(1, t * 400);
    L[i] = s;
    R[i] = s;
  }
  return wav(L, R);
}

/** A rise before a reveal: noise and a tone that climb together and stop. */
function rise(seconds = 1.2) {
  const [L, R] = make(seconds);
  let phase = 0;
  let lp = 0;
  for (let i = 0; i < L.length; i += 1) {
    const t = i / L.length;
    const env = t ** 2.2 * (t < 0.97 ? 1 : (1 - t) / 0.03);
    const f = 180 + 900 * t * t;
    phase += (TAU * f) / RATE;
    lp += 0.08 * (noise() - lp);
    const s = (Math.sin(phase) * 0.5 + lp * 2.2) * env;
    L[i] = s;
    R[i] = s;
  }
  return wav(L, R);
}

/** A short, bright swish, for a quick change of card. */
function swish(seconds = 0.3) {
  const [L, R] = make(seconds);
  let hp = 0;
  let prev = 0;
  for (let i = 0; i < L.length; i += 1) {
    const t = i / L.length;
    const x = noise();
    hp = 0.92 * (hp + x - prev);
    prev = x;
    const s = hp * Math.sin(Math.PI * t) ** 2;
    L[i] = s * (1 - t * 0.5);
    R[i] = s * (0.5 + t * 0.5);
  }
  return wav(L, R);
}

/** A rubber stamp coming down on a desk: a deep thump, a wooden knock and the slap of the paper. */
function stamp(seconds = 0.9) {
  const [L, R] = make(seconds);
  let phase = 0;
  let lp = 0;
  for (let i = 0; i < L.length; i += 1) {
    const t = i / RATE;
    const f = 48 + 70 * Math.exp(-t * 30);
    phase += (TAU * f) / RATE;
    const thump = Math.sin(phase) * Math.exp(-t * 9);
    const knock = Math.sin(TAU * 310 * t) * Math.exp(-t * 55) * 0.5;
    lp += 0.35 * (noise() - lp);
    const slap = lp * Math.exp(-t * 70) * 1.4;
    const s = thump + knock + slap;
    L[i] = s;
    R[i] = s * 0.96;
  }
  return wav(L, R);
}

/** Paper turned over: two soft rustles of filtered noise. */
function paper(seconds = 0.5) {
  const [L, R] = make(seconds);
  let lp = 0;
  let hp = 0;
  let prev = 0;
  for (let i = 0; i < L.length; i += 1) {
    const t = i / L.length;
    const x = noise();
    hp = 0.8 * (hp + x - prev);
    prev = x;
    lp += 0.5 * (hp - lp);
    const grain = Math.abs(Math.sin(i * 0.013)) > 0.3 ? 1 : 0.55;
    const env = Math.sin(Math.PI * Math.min(1, t * 1.6)) ** 2 * 0.8 + Math.exp(-((t - 0.72) ** 2) / 0.006) * 0.7;
    const s = lp * env * grain;
    L[i] = s * (1 - t * 0.4);
    R[i] = s * (0.6 + t * 0.4);
  }
  return wav(L, R);
}

/** A small bell: inharmonic partials that ring out, for a word that arrives somewhere. */
function chime(seconds = 1.8) {
  const [L, R] = make(seconds);
  const f = 1046.5;
  const partials = [
    [1, 1, 1.6],
    [2.76, 0.42, 0.9],
    [5.4, 0.2, 0.45],
    [8.93, 0.08, 0.25],
  ];
  for (let i = 0; i < L.length; i += 1) {
    const t = i / RATE;
    let s = 0;
    for (const [m, g, d] of partials) s += g * Math.sin(TAU * f * m * t) * Math.exp(-t / d);
    s *= Math.min(1, t * 900);
    L[i] = s * 0.9;
    R[i] = s;
  }
  return wav(L, R);
}

/** A pen drawing a long line: a thin scratch that rises a little. */
function draw(seconds = 1.2) {
  const [L, R] = make(seconds);
  let bp = 0;
  let lp = 0;
  for (let i = 0; i < L.length; i += 1) {
    const t = i / L.length;
    const f = 2400 + 1600 * t;
    const c = 2 * Math.sin((Math.PI * f) / RATE);
    lp += c * bp;
    bp += c * (noise() - lp - 0.5 * bp);
    const env = Math.min(1, t * 8) * (1 - t) ** 0.6 * (0.75 + 0.25 * Math.sin(i * 0.004));
    const s = bp * env;
    L[i] = s * (0.5 + 0.5 * t);
    R[i] = s * (1 - 0.5 * t);
  }
  return wav(L, R);
}

const out = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "public", "sfx");
fs.mkdirSync(out, { recursive: true });
const all = { whoosh: whoosh(), hit: hit(), tick: tick(), pop: pop(), rise: rise(), swish: swish(), stamp: stamp(), paper: paper(), chime: chime(), draw: draw() };
for (const [name, bytes] of Object.entries(all)) {
  fs.writeFileSync(path.join(out, `${name}.wav`), bytes);
  console.log(`${name}.wav`, `${Math.round(bytes.length / 1024)} KB`);
}
