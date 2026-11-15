// The artifacts of the set (the owner's yes of 2026-11-15 to «باور یا سند؟»
// and «مرز ایران، دوره به دوره»: meaningful objects, not circles and squares).
// Each is a real object of Iran's past, drawn in three dimensions in SVG from
// its own simple geometry: a shape that turns (an angle `turn`, in degrees),
// lit from the upper left by a warm key light, with the hall's turquoise light
// on its right edge. None shows a person: a coin shows its reverse (a fire
// altar, an anchor, a bow, a sun), the column its capital of two bulls.
//
//   cylinder  the Cyrus Cylinder: a barrel of fired clay lying on its side,
//             its lines of cuneiform running round it as it rolls
//   coin      a silver drachm or a gold coin spinning on its edge
//   column    a column of Persepolis: base, fluted shaft, the double-bull capital
//   tablet    a clay tablet of the Persepolis Fortification archive, with a seal
//   ziggurat  Chogha Zanbil: stepped tiers of brick, turning
//   book      an open manuscript: an illuminated head band and ruled lines
//   dome      a tiled dome on its drum (Soltaniyeh, Samarkand, Isfahan)
//   tower     a tower on four legs that meet in an arch, in white stone
import React from "react";
import type { Emblem, Model } from "./space";

const rad = (d: number) => (d * Math.PI) / 180;
/** a small repeatable random number for a seed (the same picture on every render) */
const rnd = (n: number) => {
  const v = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};
const TURQ = "#17d4a4";

type P = { id: string; w: number; h: number; turn: number; frame: number };

/** Wedges of cuneiform along a line: a row of small triangles with their tails, as one path. */
function wedges(x0: number, x1: number, y: number, size: number, seed: number, squash = 1) {
  let d = "";
  let x = x0;
  let k = 0;
  while (x < x1) {
    const r = rnd(seed * 31 + k);
    const s = size * (0.7 + 0.5 * r);
    const hy = s * 0.5 * squash;
    if (r > 0.18) {
      // a wedge: its head, and a tail to the right
      d += `M${x.toFixed(1)} ${(y - hy).toFixed(1)}L${(x + s * 0.55).toFixed(1)} ${y.toFixed(1)}L${x.toFixed(1)} ${(y + hy).toFixed(1)}Z`;
      if (r > 0.45) d += `M${(x + s * 0.4).toFixed(1)} ${y.toFixed(1)}h${(s * (0.4 + r)).toFixed(1)}`;
    }
    if (r > 0.86) {
      // an upright wedge
      d += `M${(x + s * 0.2).toFixed(1)} ${(y - hy * 1.5).toFixed(1)}l${(s * 0.25).toFixed(1)} ${(hy * 0.8).toFixed(1)}l${(s * 0.25).toFixed(1)} ${(-hy * 0.8).toFixed(1)}Z`;
    }
    x += s * (1.05 + 0.6 * rnd(seed * 17 + k));
    k += 1;
  }
  return d;
}

// ---------- the Cyrus Cylinder ----------
const Cylinder: React.FC<P> = ({ id, w, h, turn }) => {
  const cx = w / 2;
  const cy = h / 2;
  const L = w * 0.86;
  const R = h * 0.34;
  // a barrel: thicker in the middle, the ends a little narrower
  const r = (x: number) => R * (0.84 + 0.16 * Math.cos((Math.PI * (x - cx)) / L));
  const xs = Array.from({ length: 41 }, (_, i) => cx - L / 2 + (L * i) / 40);
  const top = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)} ${(cy - r(x)).toFixed(1)}`).join("");
  const bottom = [...xs].reverse().map((x) => `L${x.toFixed(1)} ${(cy + r(x)).toFixed(1)}`).join("");
  const endR = r(cx + L / 2);
  const endRx = endR * 0.3;
  // the lines of writing run along the barrel, all round it; it rolls, so they climb and set
  const LINES = 40;
  const rows: React.ReactNode[] = [];
  for (let k = 0; k < LINES; k += 1) {
    const a = rad(turn) + (k / LINES) * Math.PI * 2;
    const c = Math.cos(a);
    if (c < 0.12) continue;
    // the broken part of the real cylinder: a band of lines missing toward its left end
    const x0 = cx - L / 2 + 26 + (k % 9 === 4 ? L * 0.22 : 0);
    const x1 = cx + L / 2 - 30;
    const y = cy - r(cx) * 0.93 * Math.sin(a);
    rows.push(<path key={k} d={wedges(x0, x1, y, 15, k, c)} fill={`rgba(58,34,18,${(0.25 + 0.6 * c).toFixed(2)})`} stroke={`rgba(58,34,18,${(0.2 + 0.5 * c).toFixed(2)})`} strokeWidth={1.6} />);
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e4a2c" />
          <stop offset="0.22" stopColor="#d9b78e" />
          <stop offset="0.42" stopColor="#c69e72" />
          <stop offset="0.8" stopColor="#7d5636" />
          <stop offset="1" stopColor="#3d2615" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(0,0,0,.45)" />
          <stop offset="0.16" stopColor="rgba(0,0,0,0)" />
          <stop offset="0.86" stopColor="rgba(0,0,0,0)" />
          <stop offset="1" stopColor="rgba(23,212,164,.35)" />
        </linearGradient>
        <radialGradient id={`${id}e`} cx="0.4" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#caa57a" />
          <stop offset="1" stopColor="#6b4529" />
        </radialGradient>
        <clipPath id={`${id}k`}>
          <path d={`${top}${bottom}Z`} />
        </clipPath>
      </defs>
      <path d={`${top}${bottom}Z`} fill={`url(#${id}c)`} />
      <g clipPath={`url(#${id}k)`}>
        {rows}
        {/* the crack and the chipped edge of the real piece */}
        <path d={`M${cx - L * 0.18} ${cy - R * 0.9} l18 40 l-12 34 l22 46 l-8 38`} fill="none" stroke="rgba(40,22,10,.55)" strokeWidth={3} />
        <rect x={0} y={0} width={w} height={h} fill={`url(#${id}s)`} />
      </g>
      {/* the right end, facing the light of the hall */}
      <ellipse cx={cx + L / 2} cy={cy} rx={endRx} ry={endR} fill={`url(#${id}e)`} stroke="rgba(23,212,164,.5)" strokeWidth={3} />
      <ellipse cx={cx + L / 2} cy={cy} rx={endRx * 0.35} ry={endR * 0.3} fill="rgba(60,36,18,.35)" />
      <path d={top} fill="none" stroke="rgba(255,236,206,.55)" strokeWidth={3} />
    </svg>
  );
};

// ---------- a coin ----------
const SILVER = ["#f4f6fb", "#b9c0cf", "#6c7385"];
const GOLD = ["#fff2bf", "#e5b547", "#8a5f12"];

const emblemPath = (e: Emblem, d: number): React.ReactNode => {
  const s = d / 200;
  const g = (node: React.ReactNode) => <g transform={`scale(${s}) translate(-100 -100)`}>{node}</g>;
  if (e === "altar")
    // the Sasanian fire altar: a stepped base, the shaft, a stepped top and the flames
    return g(
      <>
        <path d="M62 150 h76 v10 h-76z M70 140 h60 v10 h-60z M86 96 h28 v44 h-28z M72 86 h56 v10 h-56z M64 76 h72 v10 h-72z" />
        <path d="M78 76 C76 58 90 52 88 36 C98 46 96 56 100 62 C104 48 112 44 110 28 C124 44 126 62 122 76 Z" />
      </>,
    );
  if (e === "anchor")
    return g(
      <>
        <circle cx={100} cy={42} r={12} fill="none" stroke="currentColor" strokeWidth={8} />
        <path d="M96 54 h8 v96 h-8z M72 70 h56 v8 h-56z" />
        <path d="M48 120 C58 156 90 164 100 164 C110 164 142 156 152 120 l-12 6 C132 146 112 152 100 152 C88 152 68 146 60 126 Z" />
      </>,
    );
  if (e === "bow")
    return g(
      <>
        <path d="M70 34 C120 52 128 148 70 166 l-4 -8 C112 140 108 62 66 42 Z" />
        <path d="M70 38 L70 162" stroke="currentColor" strokeWidth={3} fill="none" />
        <path d="M58 100 h92 M136 92 l14 8 l-14 8 M62 92 l-8 8 l8 8" stroke="currentColor" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>,
    );
  if (e === "sun")
    return g(
      <>
        <circle cx={100} cy={100} r={30} />
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const l = i % 2 ? 52 : 64;
          return <path key={i} d={`M${100 + Math.cos(a - 0.08) * 36} ${100 + Math.sin(a - 0.08) * 36} L${100 + Math.cos(a) * l} ${100 + Math.sin(a) * l} L${100 + Math.cos(a + 0.08) * 36} ${100 + Math.sin(a + 0.08) * 36}Z`} />;
        })}
      </>,
    );
  // three lines of flowing strokes, the look of a coin's legend (no word is written)
  return g(
    <>
      {[70, 100, 130].map((y, i) => (
        <path key={y} d={`M${52 + i * 4} ${y} c12 -14 22 10 34 -2 s18 -16 30 0 s20 10 32 -6`} fill="none" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      ))}
    </>,
  );
};

const Coin: React.FC<P & { emblem?: Emblem }> = ({ id, w, h, turn, emblem = "altar" }) => {
  const d = Math.min(w, h) * 0.92;
  const cx = w / 2;
  const cy = h / 2;
  const a = rad(turn);
  const c = Math.cos(a);
  const sn = Math.sin(a);
  const t = d * 0.075;
  const metal = emblem === "sun" || emblem === "script" ? GOLD : SILVER;
  const rx = Math.max(2, (d / 2) * Math.abs(c));
  const shift = t * sn;
  const face = c >= 0;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={metal[0]} />
          <stop offset="0.45" stopColor={metal[1]} />
          <stop offset="1" stopColor={metal[2]} />
        </linearGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={metal[2]} />
          <stop offset="0.5" stopColor={metal[1]} />
          <stop offset="1" stopColor={metal[2]} />
        </linearGradient>
      </defs>
      {/* the edge: the face drawn again behind, moved by the coin's thickness, and the band between */}
      <ellipse cx={cx - shift} cy={cy} rx={rx} ry={d / 2} fill={metal[2]} />
      <rect x={Math.min(cx, cx - shift)} y={cy - d / 2} width={Math.abs(shift)} height={d} fill={`url(#${id}r)`} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={d / 2} fill={`url(#${id}m)`} stroke={sn > 0 ? "rgba(23,212,164,.55)" : "rgba(255,255,255,.4)"} strokeWidth={3} />
      <g transform={`translate(${cx} ${cy}) scale(${Math.max(0.02, Math.abs(c)) * (face ? 1 : -1)} 1)`} style={{ color: metal[2] }} fill={metal[2]} opacity={0.85}>
        {/* the ring of pellets round the face */}
        {Array.from({ length: 36 }, (_, i) => {
          const q = (i / 36) * Math.PI * 2;
          return <circle key={i} cx={Math.cos(q) * d * 0.43} cy={Math.sin(q) * d * 0.43} r={d * 0.012} />;
        })}
        <circle r={d * 0.4} fill="none" stroke={metal[2]} strokeWidth={d * 0.006} opacity={0.6} />
        {face ? emblemPath(emblem, d * 0.78) : emblemPath("script", d * 0.62)}
      </g>
      {/* a glint that runs over the metal as it turns */}
      <ellipse cx={cx - rx * 0.35 * Math.sign(c || 1)} cy={cy - d * 0.2} rx={rx * 0.35} ry={d * 0.12} fill="rgba(255,255,255,.35)" opacity={0.4 + 0.6 * Math.abs(sn)} />
    </svg>
  );
};

// ---------- a column of Persepolis ----------
const Column: React.FC<P> = ({ id, w, h, turn }) => {
  const cx = w / 2;
  const sway = Math.sin(rad(turn)) * 0.22;
  const shaftW = w * 0.26;
  const capTop = h * 0.04;
  const capH = h * 0.24;
  const shaftTop = capTop + capH + h * 0.03;
  const baseTop = h * 0.84;
  const flutes = 18;
  const lines: React.ReactNode[] = [];
  for (let k = 0; k < flutes; k += 1) {
    const a = (k / flutes) * Math.PI * 2 + rad(turn);
    if (Math.cos(a) < 0.05) continue;
    const x = cx + (shaftW / 2) * Math.sin(a);
    lines.push(<line key={k} x1={x} y1={shaftTop} x2={x} y2={baseTop} stroke={`rgba(60,48,36,${(0.15 + 0.4 * Math.cos(a)).toFixed(2)})`} strokeWidth={3} />);
  }
  // the capital: two bulls' foreparts back to back, kneeling, their heads out to either side
  const bull = (dir: 1 | -1) => {
    const s = dir;
    const x = (v: number) => cx + s * v * w * (1 - Math.abs(sway) * 0.4);
    const y = (v: number) => capTop + v * capH;
    return (
      <path
        d={`M${x(0.02)} ${y(0.25)} L${x(0.28)} ${y(0.2)} C${x(0.36)} ${y(0.12)} ${x(0.42)} ${y(0.1)} ${x(0.44)} ${y(0.18)} L${x(0.47)} ${y(0.02)} L${x(0.46)} ${y(0.22)} C${x(0.5)} ${y(0.3)} ${x(0.49)} ${y(0.45)} ${x(0.44)} ${y(0.5)} L${x(0.36)} ${y(0.52)} L${x(0.34)} ${y(0.86)} L${x(0.27)} ${y(0.86)} L${x(0.26)} ${y(0.62)} L${x(0.12)} ${y(0.64)} L${x(0.1)} ${y(0.86)} L${x(0.02)} ${y(0.86)} Z`}
        fill={`url(#${id}st)`}
        stroke="rgba(40,30,20,.55)"
        strokeWidth={2.4}
      />
    );
  };
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}sh`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5e5244" />
          <stop offset={(0.3 + sway).toFixed(2)} stopColor="#e9dcc4" />
          <stop offset="0.75" stopColor="#a8977c" />
          <stop offset="1" stopColor={TURQ} stopOpacity={0.6} />
        </linearGradient>
        <linearGradient id={`${id}st`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0e4cc" />
          <stop offset="1" stopColor="#8f7d62" />
        </linearGradient>
      </defs>
      {bull(1)}
      {bull(-1)}
      {/* the block under the bulls, then the shaft */}
      <rect x={cx - shaftW * 0.75} y={capTop + capH * 0.86} width={shaftW * 1.5} height={h * 0.035} fill={`url(#${id}st)`} />
      <rect x={cx - shaftW / 2} y={shaftTop} width={shaftW} height={baseTop - shaftTop} fill={`url(#${id}sh)`} />
      {lines}
      {/* the bell-shaped base on its plinth */}
      <path d={`M${cx - shaftW * 0.55} ${baseTop} C${cx - shaftW * 0.6} ${h * 0.9} ${cx - shaftW * 1.15} ${h * 0.92} ${cx - shaftW * 1.2} ${h * 0.95} L${cx + shaftW * 1.2} ${h * 0.95} C${cx + shaftW * 1.15} ${h * 0.92} ${cx + shaftW * 0.6} ${h * 0.9} ${cx + shaftW * 0.55} ${baseTop} Z`} fill={`url(#${id}sh)`} />
      <rect x={cx - shaftW * 1.4} y={h * 0.95} width={shaftW * 2.8} height={h * 0.05} fill="#6f604c" />
    </svg>
  );
};

// ---------- a clay tablet ----------
const Tablet: React.FC<P> = ({ id, w, h, turn }) => {
  const a = Math.sin(rad(turn)) * 0.5;
  const fw = w * 0.8 * Math.cos(a);
  const side = w * 0.12 * Math.sin(a);
  const x0 = w / 2 - fw / 2;
  const y0 = h * 0.08;
  const fh = h * 0.84;
  const rows = 9;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dcbd93" />
          <stop offset="0.6" stopColor="#b48a5e" />
          <stop offset="1" stopColor="#6e4b2d" />
        </linearGradient>
      </defs>
      {/* its edge, as thick as the clay */}
      <path d={side > 0 ? `M${x0 + fw} ${y0 + 18} q${side} 0 ${side} 16 v${fh - 32} q0 16 ${-side} 16 Z` : `M${x0} ${y0 + 18} q${side} 0 ${side} 16 v${fh - 32} q0 16 ${-side} 16 Z`} fill={side > 0 ? TURQ : "#5a3c22"} opacity={side > 0 ? 0.55 : 0.9} />
      <rect x={x0} y={y0} width={fw} height={fh} rx={34} fill={`url(#${id}f)`} stroke="rgba(70,44,22,.6)" strokeWidth={3} />
      {Array.from({ length: rows }, (_, k) => (
        <path key={k} d={wedges(x0 + 30, x0 + fw - 30, y0 + 46 + k * ((fh * 0.62) / rows), 16, k + 7)} fill="rgba(70,40,20,.7)" stroke="rgba(70,40,20,.6)" strokeWidth={1.5} />
      ))}
      {/* the seal rolled over the clay under the text */}
      <rect x={x0 + fw * 0.16} y={y0 + fh * 0.72} width={fw * 0.68} height={fh * 0.18} rx={16} fill="rgba(90,58,30,.35)" />
      {Array.from({ length: 7 }, (_, k) => (
        <circle key={k} cx={x0 + fw * (0.24 + k * 0.088)} cy={y0 + fh * 0.81} r={fh * 0.045} fill="none" stroke="rgba(70,40,20,.55)" strokeWidth={3} />
      ))}
    </svg>
  );
};

// ---------- boxes in space (the ziggurat) ----------
type Face = { d: string; z: number; fill: string };
/** A box of half-sizes (a, b, c) at height y0, turned `turn` degrees round the vertical, seen a little from above: its visible faces. */
function box(cx: number, base: number, a: number, b: number, hgt: number, turn: number, k: number, colors: [string, string, string]): Face[] {
  const t = rad(turn);
  const tilt = 0.32;
  const P = (x: number, z: number, y: number) => {
    const X = x * Math.cos(t) - z * Math.sin(t);
    const Z = x * Math.sin(t) + z * Math.cos(t);
    return [cx + X * k, base - y * k + Z * tilt * k, Z] as const;
  };
  const corners = [
    [-a, -b],
    [a, -b],
    [a, b],
    [-a, b],
  ];
  const faces: Face[] = [];
  for (let i = 0; i < 4; i += 1) {
    const [x1, z1] = corners[i];
    const [x2, z2] = corners[(i + 1) % 4];
    const p1 = P(x1, z1, 0);
    const p2 = P(x2, z2, 0);
    const p3 = P(x2, z2, hgt);
    const p4 = P(x1, z1, hgt);
    // a side faces the camera when its outward normal points toward it (toward -Z)
    const nx = (z2 - z1) * -1;
    const nz = x2 - x1;
    const nZ = nx * Math.sin(t) + nz * Math.cos(t);
    if (nZ >= 0) continue;
    const lit = nx * Math.cos(t) - nz * Math.sin(t) < 0 ? colors[0] : colors[1];
    faces.push({ d: `M${p1[0]} ${p1[1]}L${p2[0]} ${p2[1]}L${p3[0]} ${p3[1]}L${p4[0]} ${p4[1]}Z`, z: (p1[2] + p2[2]) / 2, fill: lit });
  }
  const top = corners.map(([x, z]) => P(x, z, hgt));
  faces.push({ d: `M${top.map((p) => `${p[0]} ${p[1]}`).join("L")}Z`, z: -1e6, fill: colors[2] });
  return faces;
}

const Ziggurat: React.FC<P> = ({ w, h, turn }) => {
  const k = w / 640;
  const base = h * 0.9;
  const tiers = [
    [260, 260, 70],
    [200, 200, 70],
    [142, 142, 70],
    [86, 86, 64],
  ];
  let y = 0;
  const all: React.ReactNode[] = [];
  tiers.forEach(([a, b, hh], i) => {
    const faces = box(w / 2, base - y * k * 1, a, b, hh, turn, k, ["#c99b67", "#7d5a36", "#e3bd8a"]);
    all.push(
      <g key={i}>
        {faces.map((f, j) => (
          <path key={j} d={f.d} fill={f.fill} stroke="rgba(60,38,20,.6)" strokeWidth={2} />
        ))}
      </g>,
    );
    y += hh;
  });
  // the rows of brick, faint lines over the whole
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      {all}
      <g opacity={0.25}>
        {Array.from({ length: 22 }, (_, i) => (
          <line key={i} x1={w * 0.05} x2={w * 0.95} y1={base - i * 12 * k} y2={base - i * 12 * k} stroke="#3d2614" strokeWidth={1.2} />
        ))}
      </g>
    </svg>
  );
};

// ---------- an open manuscript ----------
const Book: React.FC<P> = ({ id, w, h, turn }) => {
  const s = Math.sin(rad(turn)) * 0.18;
  const cx = w / 2;
  const top = h * 0.16;
  const bot = h * 0.88;
  const pw = w * 0.44;
  const page = (dir: 1 | -1) => {
    const k = 1 + dir * s;
    const x1 = cx + dir * pw * k;
    return `M${cx} ${top + 20} Q${cx + dir * pw * 0.5 * k} ${top - 18} ${x1} ${top} L${x1} ${bot} Q${cx + dir * pw * 0.5 * k} ${bot - 22} ${cx} ${bot + 6} Z`;
  };
  const rows = (dir: 1 | -1) =>
    Array.from({ length: 9 }, (_, i) => {
      const k = 1 + dir * s;
      const y = top + h * 0.2 + i * h * 0.06;
      return <line key={`${dir}${i}`} x1={cx + dir * 34} x2={cx + dir * (pw * k - 30)} y1={y} y2={y} stroke="rgba(40,30,60,.38)" strokeWidth={6} strokeLinecap="round" strokeDasharray={`${40 + 30 * rnd(i + dir * 7)} 14`} />;
    });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbf3df" />
          <stop offset="1" stopColor="#d9c9a4" />
        </linearGradient>
      </defs>
      {/* the leather cover under the pages */}
      <path d={`M${cx - pw * 1.08} ${top + 14} L${cx + pw * 1.08} ${top + 14} L${cx + pw * 1.08} ${bot + 22} L${cx - pw * 1.08} ${bot + 22} Z`} fill="#5a2333" stroke="#e5b547" strokeWidth={3} />
      <path d={page(1)} fill={`url(#${id}p)`} stroke="rgba(90,70,40,.5)" strokeWidth={2} />
      <path d={page(-1)} fill={`url(#${id}p)`} stroke="rgba(90,70,40,.5)" strokeWidth={2} />
      {/* the illuminated head band of each page, in gold and lapis */}
      {[1, -1].map((dir) => (
        <rect key={dir} x={dir > 0 ? cx + 30 : cx - pw * (1 - s) + 30} y={top + h * 0.06} width={pw * (1 + dir * s) - 60} height={h * 0.07} rx={8} fill="#1f4aa8" stroke="#e5b547" strokeWidth={4} />
      ))}
      {rows(1)}
      {rows(-1)}
      <line x1={cx} y1={top + 20} x2={cx} y2={bot + 6} stroke="rgba(60,40,20,.5)" strokeWidth={3} />
    </svg>
  );
};

// ---------- a tiled dome ----------
const Dome: React.FC<P> = ({ id, w, h, turn }) => {
  const cx = w / 2;
  const R = w * 0.36;
  const drumTop = h * 0.56;
  const drumBot = h * 0.96;
  const apex = h * 0.06;
  // the dome's profile: a pointed (ogee) curve from the drum to the apex
  const prof = (u: number) => R * Math.sin(Math.PI * 0.5 * (1 - u)) ** 0.8;
  const N = 24;
  const ys = Array.from({ length: N + 1 }, (_, i) => drumTop - (drumTop - apex) * (i / N));
  const outline = `M${cx - R} ${drumTop} ${ys.map((y, i) => `L${cx - prof(i / N)} ${y}`).join(" ")} ${[...ys].reverse().map((y, i) => `L${cx + prof((N - i) / N)} ${y}`).join(" ")} Z`;
  const ribs: React.ReactNode[] = [];
  for (let k = 0; k < 16; k += 1) {
    const a = (k / 16) * Math.PI * 2 + rad(turn);
    if (Math.cos(a) < 0.05) continue;
    const d = ys.map((y, i) => `${i ? "L" : "M"}${cx + prof(i / N) * Math.sin(a)} ${y}`).join("");
    ribs.push(<path key={k} d={d} fill="none" stroke={k % 2 ? "#e5b547" : "#f4f6ff"} strokeOpacity={0.25 + 0.5 * Math.cos(a)} strokeWidth={k % 2 ? 3 : 5} />);
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}d`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0b3d6b" />
          <stop offset="0.35" stopColor="#2fb6c8" />
          <stop offset="0.7" stopColor="#167f9e" />
          <stop offset="1" stopColor="#0a2a4d" />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3b2a1c" />
          <stop offset="0.35" stopColor="#d9b98a" />
          <stop offset="1" stopColor="#5a4128" />
        </linearGradient>
      </defs>
      <path d={outline} fill={`url(#${id}d)`} />
      {ribs}
      {/* the drum, with its band of script-like tile (no word) and its windows */}
      <rect x={cx - R * 1.02} y={drumTop} width={R * 2.04} height={drumBot - drumTop} fill={`url(#${id}w)`} />
      <rect x={cx - R * 1.02} y={drumTop + 8} width={R * 2.04} height={(drumBot - drumTop) * 0.22} fill="#123f78" opacity={0.9} />
      {Array.from({ length: 8 }, (_, k) => {
        const a = (k / 8) * Math.PI * 2 + rad(turn);
        if (Math.cos(a) < 0.15) return null;
        const x = cx + R * Math.sin(a);
        const ww = 26 * Math.cos(a);
        return <path key={k} d={`M${x - ww} ${drumBot - 18} v-70 q${ww} -34 ${ww * 2} 0 v70 Z`} fill="#0d1d33" opacity={0.85} />;
      })}
      {/* the finial */}
      <path d={`M${cx} ${apex - 54} l8 34 h-16z`} fill="#e5b547" />
      <circle cx={cx} cy={apex - 4} r={9} fill="#e5b547" />
    </svg>
  );
};

// ---------- a tower on four legs ----------
const Tower: React.FC<P> = ({ id, w, h, turn }) => {
  const s = Math.sin(rad(turn)) * 0.35;
  const k = Math.cos(s);
  const cx = w / 2;
  const fw = w * 0.42 * k;
  const depth = w * 0.18 * Math.sin(s);
  // the front: two legs that sweep up into one shaft, the arch between them
  const front = `M${cx - fw} ${h} C${cx - fw * 0.8} ${h * 0.62} ${cx - fw * 0.3} ${h * 0.42} ${cx - fw * 0.22} ${h * 0.06} L${cx + fw * 0.22} ${h * 0.06} C${cx + fw * 0.3} ${h * 0.42} ${cx + fw * 0.8} ${h * 0.62} ${cx + fw} ${h} L${cx + fw * 0.52} ${h} C${cx + fw * 0.4} ${h * 0.7} ${cx + fw * 0.12} ${h * 0.56} ${cx} ${h * 0.5} C${cx - fw * 0.12} ${h * 0.56} ${cx - fw * 0.4} ${h * 0.7} ${cx - fw * 0.52} ${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a8f9e" />
          <stop offset="0.4" stopColor="#f5f1e8" />
          <stop offset="1" stopColor="#a9acb8" />
        </linearGradient>
      </defs>
      <path d={front} transform={`translate(${depth} -6)`} fill={depth > 0 ? "rgba(23,212,164,.45)" : "#6d7180"} />
      <path d={front} fill={`url(#${id}t)`} stroke="rgba(60,64,80,.5)" strokeWidth={2} />
      {/* the lattice of the shaft */}
      {Array.from({ length: 7 }, (_, i) => (
        <line key={i} x1={cx - fw * 0.2} x2={cx + fw * 0.2} y1={h * (0.1 + i * 0.05)} y2={h * (0.12 + i * 0.05)} stroke="rgba(80,84,100,.35)" strokeWidth={3} />
      ))}
    </svg>
  );
};

/** An artifact as the set draws it, `turn` degrees round (the plan's spin at this frame). */
export const Artifact: React.FC<P & { model: Model; emblem?: Emblem }> = ({ model, ...p }) => {
  if (model === "cylinder") return <Cylinder {...p} />;
  if (model === "coin") return <Coin {...p} emblem={p.emblem} />;
  if (model === "column") return <Column {...p} />;
  if (model === "tablet") return <Tablet {...p} />;
  if (model === "ziggurat") return <Ziggurat {...p} />;
  if (model === "book") return <Book {...p} />;
  if (model === "dome") return <Dome {...p} />;
  return <Tower {...p} />;
};

/** The size each artifact is drawn at in the world (width, height), so a coin is round and a column tall. */
export const MODEL_SIZE: Record<Model, [number, number]> = {
  cylinder: [620, 300],
  coin: [360, 360],
  column: [300, 560],
  tablet: [420, 380],
  ziggurat: [560, 420],
  book: [560, 400],
  dome: [420, 520],
  tower: [360, 520],
};
