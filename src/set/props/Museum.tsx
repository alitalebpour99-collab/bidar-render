// The museum's own furniture for Bidar's night hall, each drawn in code (SVG)
// and listed in props/manifest.json for Ahura's shared asset library:
//   Plinth       a stone plinth with a gilded lip, for an object to stand on
//   Vitrine      the glass case round an object, with the lamp's cone from above
//   RopeBarrier  two brass posts and a cinnabar rope across the bottom of the frame
//   Tazhib       a gilded corner flourish for a label, as on an illuminated page
import React from "react";

export const MUSEUM = { lapis: "#12306e", lapisDeep: "#061230", turq: "#2ec4b6", gold: "#d8b25a", goldLight: "#f4dc9a", goldDeep: "#8a6a24", warm: "255,214,150", cinnabar: "#c8452f", cinnabarDeep: "#7a1f14", parchment: "#efe3c6", stone: "#3c4a6b", stoneDeep: "#1c2740" };

export const Plinth: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }}>
    <defs>
      <linearGradient id="plinth-top" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={MUSEUM.goldDeep} />
        <stop offset="0.5" stopColor={MUSEUM.goldLight} />
        <stop offset="1" stopColor={MUSEUM.goldDeep} />
      </linearGradient>
      <linearGradient id="plinth-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5a6c96" />
        <stop offset="0.25" stopColor={MUSEUM.stone} />
        <stop offset="1" stopColor={MUSEUM.stoneDeep} />
      </linearGradient>
    </defs>
    <ellipse cx={w / 2} cy={h * 0.96} rx={w * 0.56} ry={h * 0.16} fill="rgba(0,0,0,.45)" />
    <path d={`M${w * 0.06} ${h * 0.22} H${w * 0.94} L${w * 0.88} ${h} H${w * 0.12} Z`} fill="url(#plinth-body)" />
    <rect x={0} y={0} width={w} height={h * 0.24} rx={h * 0.06} fill="url(#plinth-top)" />
    <rect x={0} y={h * 0.2} width={w} height={h * 0.05} fill="rgba(0,0,0,.35)" />
  </svg>
);

/** `period`: the frames of one sweep of the shine (180; a loop's divides its cycle, set/space.ts cyclePeriod). */
export const Vitrine: React.FC<{ w: number; h: number; frame: number; period?: number }> = ({ w, h, frame, period = 180 }) => {
  const shine = ((((frame % period) + period) % period) / period) * (w + 240) - 120;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="vit-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={`rgba(${MUSEUM.warm},.34)`} />
          <stop offset="1" stopColor={`rgba(${MUSEUM.warm},0)`} />
        </linearGradient>
        <linearGradient id="vit-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,.16)" />
          <stop offset="0.5" stopColor="rgba(255,255,255,.02)" />
          <stop offset="1" stopColor="rgba(255,255,255,.10)" />
        </linearGradient>
        <clipPath id="vit-clip">
          <rect x={0} y={0} width={w} height={h} rx={14} />
        </clipPath>
      </defs>
      {/* the lamp's cone falling into the case */}
      <path d={`M${w * 0.4} ${-h * 0.5} L${w * 0.6} ${-h * 0.5} L${w * 1.02} ${h} L${-w * 0.02} ${h} Z`} fill="url(#vit-cone)" />
      <rect x={0} y={0} width={w} height={h} rx={14} fill="url(#vit-glass)" stroke="rgba(255,255,255,.34)" strokeWidth={3} />
      <g clipPath="url(#vit-clip)">
        <rect x={shine} y={-20} width={70} height={h + 40} fill="rgba(255,255,255,.07)" transform={`skewX(-16)`} />
      </g>
      <line x1={10} y1={8} x2={10} y2={h - 8} stroke="rgba(255,255,255,.4)" strokeWidth={2} />
    </svg>
  );
};

export const RopeBarrier: React.FC<{ width: number; drift?: number }> = ({ width: W, drift = 0 }) => {
  const H = 300;
  const x1 = 150 + drift;
  const x2 = W - 150 + drift;
  const post = (x: number, key: string) => (
    <g key={key}>
      <ellipse cx={x} cy={H - 16} rx={64} ry={15} fill="rgba(0,0,0,.5)" />
      <ellipse cx={x} cy={H - 24} rx={56} ry={13} fill="url(#rope-brass)" />
      <rect x={x - 11} y={74} width={22} height={H - 98} fill="url(#rope-brass)" />
      <rect x={x - 17} y={62} width={34} height={16} rx={6} fill="url(#rope-brass)" />
      <circle cx={x} cy={46} r={22} fill="url(#rope-ball)" />
    </g>
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, bottom: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="rope-brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={MUSEUM.goldDeep} />
          <stop offset="0.45" stopColor={MUSEUM.goldLight} />
          <stop offset="1" stopColor={MUSEUM.goldDeep} />
        </linearGradient>
        <radialGradient id="rope-ball" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff2c4" />
          <stop offset="0.5" stopColor={MUSEUM.gold} />
          <stop offset="1" stopColor={MUSEUM.goldDeep} />
        </radialGradient>
        <linearGradient id="rope-velvet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2604a" />
          <stop offset="0.5" stopColor={MUSEUM.cinnabar} />
          <stop offset="1" stopColor={MUSEUM.cinnabarDeep} />
        </linearGradient>
        <linearGradient id="rope-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(4,10,28,0)" />
          <stop offset="1" stopColor="rgba(4,10,28,.72)" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#rope-floor)" />
      {/* the rope hangs between the posts */}
      <path d={`M${x1} 78 C ${x1 + (x2 - x1) * 0.25} 210, ${x1 + (x2 - x1) * 0.75} 210, ${x2} 78`} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth={30} transform="translate(0 12)" strokeLinecap="round" />
      <path d={`M${x1} 78 C ${x1 + (x2 - x1) * 0.25} 210, ${x1 + (x2 - x1) * 0.75} 210, ${x2} 78`} fill="none" stroke="url(#rope-velvet)" strokeWidth={26} strokeLinecap="round" />
      <path d={`M${x1} 72 C ${x1 + (x2 - x1) * 0.25} 204, ${x1 + (x2 - x1) * 0.75} 204, ${x2} 72`} fill="none" stroke="rgba(255,190,170,.35)" strokeWidth={4} strokeLinecap="round" />
      {post(x1, "a")}
      {post(x2, "b")}
    </svg>
  );
};

/** A gilded corner flourish: `turn` 0 is the upper right corner, then clockwise. */
export const Tazhib: React.FC<{ size: number; turn?: 0 | 1 | 2 | 3; color?: string }> = ({ size, turn = 0, color = MUSEUM.gold }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: `rotate(${turn * 90}deg)` }}>
    <path d="M100 0 V46 C92 30, 80 22, 62 20 C76 14, 88 8, 100 0 Z" fill={color} opacity=".9" />
    <path d="M100 0 H54 C70 8, 78 20, 80 38 C86 24, 92 12, 100 0 Z" fill={color} opacity=".9" />
    <circle cx="66" cy="34" r="7" fill="none" stroke={color} strokeWidth="3" />
    <path d="M52 6 C34 6, 22 10, 8 4 M94 48 C94 66, 90 78, 96 92" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
  </svg>
);
