// The set style's world, as plain numbers: the camera, the projection, the
// platforms' safe zones and the plan a Reel is drawn from. Nothing here draws;
// Hall.tsx draws a plan, and gate.mjs checks the same plan after the render
// (the plan travels with the composition's props, so the gate sees exactly
// what was drawn).
//
// The world is Bidar's «hall of arches»: a dark navy hall with a glossy floor,
// pointed arches standing down both sides in turquoise, violet and pink light,
// and the episode's glass slabs floating in it. The camera never stands still:
// it pushes in, orbits the slab it looks at, punches on a beat and whips from
// one slab to the next.

export const W = 1080;
export const H = 1920;
export const FPS = 30;
/** the focal length: a point 1000 units in front of the camera is drawn at its own size */
export const F = 1000;
/** the screen's centre column and the horizon's row (the camera never pitches) */
export const CX = 540;
export const HZ = 760;
/** the floor, in world units below the eye */
export const FLOOR = 620;
/** nearer than this a point is behind the lens */
export const NEAR = 160;

// ---------- the platforms' safe zones ----------
// Measured on the owner's iPhone screenshots of 2026-11-13 (hub
// ahura-city/ali-list-1112/cue-sample/, 1320 × 2868; Pickwise set/zones.ts):
// the video fills the screen from the top down to row 2617 and loses both
// sides; the app's header covers the top 11 % of the screen, the rail of
// buttons the right 14 %, and the account's name and the caption begin at row
// 2158 (TikTok, the highest of the three). In the frame of 1080 × 1920:
const SCREEN = { w: 1320, h: 2868, videoBottom: 2617 };
const K = SCREEN.videoBottom / H;
const CUT = (W * K - SCREEN.w) / 2;
export const ZONES = {
  /** rows above this are under the app's header */
  top: Math.ceil((0.11 * SCREEN.h) / K),
  /** columns right of this are under the rail */
  right: Math.floor((0.86 * SCREEN.w + CUT) / K),
  /** columns left of this are off the screen */
  left: Math.ceil(CUT / K),
  /** rows below this hold the account's name and the caption */
  bottom: Math.floor(2158 / K),
};
/** The middle of the frame, where the badge never goes: the middle third of the height. */
export const MIDDLE = { top: Math.round(H / 3), bottom: Math.round((2 * H) / 3) };
/** The text column every set Reel writes in: inside the zones with a margin. */
export const COL = { left: ZONES.left + 26, right: ZONES.right - 22 };
export const COL_W = COL.right - COL.left;
export const COL_X = (COL.left + COL.right) / 2;
/** the smallest letters any text may have on screen: 1.5 % of the frame's height (STYLE_GUIDE R5) */
export const MIN_TEXT = Math.ceil(0.015 * H);

export type Box = { x: number; y: number; w: number; h: number };
export const boxInZones = (b: Box) => b.x >= ZONES.left && b.y >= ZONES.top && b.x + b.w <= ZONES.right && b.y + b.h <= ZONES.bottom;
export const unite = (a: Box | null, b: Box): Box => {
  if (!a) return { ...b };
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
};

// ---------- the camera ----------
export type Pose = { x: number; y: number; z: number; yaw: number };
export type V3 = [number, number, number];

/** A point of the world on the screen: [x, y, scale], or null behind the lens. */
export function project(p: V3, pose: Pose): [number, number, number] | null {
  const a = (pose.yaw * Math.PI) / 180;
  const dx = p[0] - pose.x;
  const dz = p[2] - pose.z;
  const x = dx * Math.cos(a) - dz * Math.sin(a);
  const z = dx * Math.sin(a) + dz * Math.cos(a);
  if (z < NEAR) return null;
  const s = F / z;
  return [CX + x * s, HZ + (p[1] - pose.y) * s, s];
}

/** A camera that looks at `target` from `dist` away, turned `angle` degrees round it, raised `lift`. */
export const orbit = (target: V3, dist: number, angle = 0, lift = 0): Pose => {
  const a = (angle * Math.PI) / 180;
  // moved sideways along its own right, so the target is drawn at the safe column's middle
  const r = ((CX - (ZONES.left + 26 + ZONES.right - 22) / 2) * dist) / F;
  return { x: target[0] - dist * Math.sin(a) + r * Math.cos(a), y: lift, z: target[2] - dist * Math.cos(a) - r * Math.sin(a), yaw: angle };
};

/**
 * A shot: from frame `at` the camera goes to `pose` (a whip in 6 frames, a
 * glide in 18, a cut at once) and then drifts: it pushes in by `push` units a
 * second and sways `sway` degrees, so no held second is still.
 */
export type Move = "cut" | "whip" | "glide";
export type Shot = { at: number; pose: Pose; move: Move; push?: number; sway?: number; why: string };
export const MOVE_FRAMES: Record<Move, number> = { cut: 0, whip: 6, glide: 18 };

const smooth = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const easeOut = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - (1 - u) ** 3);
const mix = (a: Pose, b: Pose, t: number): Pose => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, yaw: a.yaw + (b.yaw - a.yaw) * t });

/** Where the camera drifts `frames` after its shot began. */
function drifted(s: Shot, frames: number): Pose {
  const t = Math.max(0, frames) / FPS;
  const push = (s.push ?? 0) * t;
  const sway = (s.sway ?? 0) * Math.sin(t * 1.7);
  const a = (s.pose.yaw * Math.PI) / 180;
  // pushing in goes along the line of sight
  return { x: s.pose.x + push * Math.sin(a), y: s.pose.y, z: s.pose.z + push * Math.cos(a), yaw: s.pose.yaw + sway };
}

/** A punch: the camera jumps closer by `depth` and settles back (an accent on a beat). */
export type Punch = { at: number; depth: number; why: string };
const punchAt = (p: Punch, f: number) => {
  const t = f - p.at;
  if (t < 0 || t > 20) return 0;
  return t < 4 ? easeOut(t / 4) : 1 - smooth((t - 4) / 16);
};

/** The camera at a frame: its shot, the move into it, the drift and any punch. */
export function poseAt(shots: Shot[], punches: Punch[], f: number): Pose {
  let k = 0;
  for (let i = 0; i < shots.length; i += 1) if (shots[i].at <= f) k = i;
  const s = shots[k];
  let pose = drifted(s, f - s.at);
  if (k > 0) {
    const len = MOVE_FRAMES[s.move];
    const u = len ? (f - s.at) / len : 1;
    if (u < 1) {
      const prev = shots[k - 1];
      const from = drifted(prev, s.at - prev.at);
      pose = mix(from, pose, s.move === "whip" ? easeOut(u) : smooth(u));
    }
  }
  const depth = punches.reduce((m, p) => m + p.depth * punchAt(p, f), 0);
  if (depth) {
    const a = (pose.yaw * Math.PI) / 180;
    pose = { ...pose, x: pose.x + depth * Math.sin(a), z: pose.z + depth * Math.cos(a) };
  }
  return pose;
}

/** How fast the camera moves at a frame (units a frame): the whip's blur and the gate's check of motion. */
export function speedAt(shots: Shot[], punches: Punch[], f: number) {
  const a = poseAt(shots, punches, Math.max(0, f - 1));
  const b = poseAt(shots, punches, f);
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) + Math.abs(b.yaw - a.yaw) * 20;
}

// ---------- what is in the world ----------
export type Accent = "turq" | "right" | "wrong" | "maybe" | "violet" | "gold";
export const ACCENT: Record<Accent, string> = {
  turq: "#17d4a4",
  right: "#22e39b",
  wrong: "#ff4d8d",
  maybe: "#a78bfa",
  violet: "#7b61ff",
  gold: "#ffd23f",
};
export const NAVY = { deep: "#040816", night: "#071026", hall: "#0a1433", panel: "#0f1a3d", panel2: "#16224d", ink: "#f4f6ff", muted: "#a9b4d6", dark: "#06101f" };

/** A line of text, already broken and sized (fit.ts). */
export type Line = { text: string; size: number; weight: number; color?: string };
/** A change of an object at a frame, eased over 10 frames. */
export type State = { at: number; glow?: number; dim?: number; dy?: number; dz?: number; accent?: Accent };
export type Obj = {
  id: string;
  kind: "slab" | "ring" | "stamp" | "burst" | "medal";
  /** the object's centre in the world */
  at: V3;
  w: number;
  h: number;
  from: number;
  to: number;
  enter?: "pop" | "rise" | "fade" | "none";
  /** a slab: its lines, its tag (top right), its source chip (bottom) and a picture */
  lines?: Line[];
  tag?: string;
  chip?: Line;
  image?: { src: string; h: number };
  /** a medal or a stamp: its word or figure */
  word?: Line;
  /** a ring: the seconds it counts, from `from` */
  secs?: number;
  accent?: Accent;
  states?: State[];
  /** turned this many degrees (a stamp) */
  tilt?: number;
  /** a claim: something said as a fact; it needs a source on screen (the gate's `source`) */
  claim?: boolean;
};

/** The flat things over the world, in the screen's own pixels. */
export type Hud = { id: string; kind: "source" | "badge"; box: Box; from: number; to: number; lines?: Line[] };

export type Sfx = { at: number; name: "whoosh" | "hit" | "tick" | "pop" | "rise" | "swish" | "stamp" | "paper" | "chime" | "draw"; volume: number; why: string };

/** Everything a set Reel draws and plays, and what the gate needs to check it. */
export type Plan = {
  style: "set";
  format: string;
  total: number;
  shots: Shot[];
  punches: Punch[];
  objects: Obj[];
  hud: Hud[];
  sfx: Sfx[];
  /** the words on screen in the first 1.5 s */
  hook: { text: string; from: number };
  /** the screen box each text object covers over its whole life (gate `safe`) */
  boxes: { id: string; box: Box; minSize: number; from: number; to: number }[];
  /** the length this format may run, in seconds (gate `length`) */
  length: [number, number];
  badge: boolean;
};

/** Words of a Persian text as a reader counts them («دربارهٔ» one word, a half-space joins). */
export const wordsOf = (s: string) => s.replace(/[؟?!.،,؛:«»"()]/g, " ").split(/\s+/).filter(Boolean);

/** An object's place, scale and look at a frame, once its states are applied. */
export function stateAt(o: Obj, f: number) {
  let glow = 0;
  let dim = 0;
  let dy = 0;
  let dz = 0;
  let accent = o.accent ?? "turq";
  for (const s of o.states ?? []) {
    const u = smooth((f - s.at) / 10);
    if (u <= 0) continue;
    if (s.glow !== undefined) glow += (s.glow - glow) * u;
    if (s.dim !== undefined) dim += (s.dim - dim) * u;
    if (s.dy !== undefined) dy += (s.dy - dy) * u;
    if (s.dz !== undefined) dz += (s.dz - dz) * u;
    if (s.accent && u > 0.5) accent = s.accent;
  }
  return { glow, dim, dy, dz, accent };
}

/** How present an object is (0–1) and its entrance scale and lift. */
export function presence(o: Obj, f: number) {
  if (f < o.from || f > o.to) return { a: 0, k: 1, lift: 0 };
  const t = f - o.from;
  const out = Math.min(1, (o.to - f) / 8);
  if (o.enter === "none") return { a: out, k: 1, lift: 0 };
  if (o.enter === "pop") {
    const k = t < 6 ? 0.7 + 0.36 * easeOut(t / 6) : t < 12 ? 1.06 - 0.06 * smooth((t - 6) / 6) : 1;
    return { a: Math.min(1, t / 4) * out, k, lift: 0 };
  }
  if (o.enter === "rise") return { a: Math.min(1, t / 8) * out, k: 1, lift: 90 * (1 - easeOut(t / 14)) };
  return { a: Math.min(1, t / 10) * out, k: 1, lift: 0 };
}

/** The screen box of an object at a frame (its whole rectangle), or null when it is not drawn. */
export function boxAt(o: Obj, pose: Pose, f: number): { box: Box; s: number } | null {
  const pr = presence(o, f);
  if (pr.a <= 0.02) return null;
  const st = stateAt(o, f);
  const p = project([o.at[0], o.at[1] + st.dy + pr.lift, o.at[2] + st.dz], pose);
  if (!p) return null;
  const s = p[2] * pr.k;
  // a tilted stamp covers its turned rectangle
  const r = ((o.tilt ?? 0) * Math.PI) / 180;
  const w = (Math.abs(o.w * Math.cos(r)) + Math.abs(o.h * Math.sin(r))) * s;
  const h = (Math.abs(o.w * Math.sin(r)) + Math.abs(o.h * Math.cos(r))) * s;
  return { box: { x: p[0] - w / 2, y: p[1] - h / 2, w, h }, s };
}

/** Text an object shows (for the counts and the checks). */
export const textOf = (o: Obj) => [...(o.lines ?? []).map((l) => l.text), o.tag ?? "", o.chip?.text ?? "", o.word?.text ?? ""].filter(Boolean);
/** Below this scale a slab's letters are not drawn (only soft bars): far away they could not be read. */
export const READ_SCALE = 0.86;
/** How much of a slab's letters show at a scale: none far away, and none when the camera flies through it (they would leave the zones). */
export const textAlpha = (s: number) => (s < READ_SCALE ? 0 : s < READ_SCALE + 0.08 ? (s - READ_SCALE) / 0.08 : s > 1.1 ? 0 : s > 1.06 ? (1.1 - s) / 0.04 : 1);

/**
 * The boxes the gate checks: for every object with text, the union of its
 * screen boxes over the frames it is readable, and the smallest its letters get.
 */
export function textBoxes(objects: Obj[], shots: Shot[], punches: Punch[]): Plan["boxes"] {
  const out: Plan["boxes"] = [];
  for (const o of objects) {
    const texts = textOf(o);
    if (!texts.length) continue;
    const sizes = [...(o.lines ?? []), ...(o.chip ? [o.chip] : []), ...(o.word ? [o.word] : [])].map((l) => l.size);
    if (o.tag) sizes.push(TAG_SIZE);
    const smallest = Math.min(...sizes);
    let box: Box | null = null;
    let minSize = Infinity;
    let from = -1;
    let to = -1;
    for (let f = o.from; f <= o.to; f += 2) {
      const pose = poseAt(shots, punches, f);
      const b = boxAt(o, pose, f);
      if (!b || textAlpha(b.s) < 0.5 || presence(o, f).a < 0.5) continue;
      box = unite(box, b.box);
      minSize = Math.min(minSize, smallest * b.s);
      if (from < 0) from = f;
      to = f;
    }
    if (box) out.push({ id: o.id, box, minSize, from, to });
  }
  return out;
}
/** the slab's tag (its kind, its number) */
export const TAG_SIZE = 36;
