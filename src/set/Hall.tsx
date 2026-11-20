// Draws a set plan (space.ts): Bidar's hall of arches, lit in turquoise,
// gilding and warm lamps, its stone floor, the episode's labels and objects, and over them
// the source line and the channel badge; then the bed, the narrator and the
// sound of every move.
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { GULZAR, VAZIR, clamped } from "../kit";
import type { Timeline } from "../props";
import { Artifact } from "./models";
import { MUSEUM, Plinth, RopeBarrier, Tazhib, Vitrine } from "./props/Museum";
import { MapBoard } from "./MapBoard";
import { ACCENT, CHIP_LEAD, CX, FLOOR, H, HZ, NAVY, NEAR, TAG_ROOM, TAG_SIZE, TOP_ROOM, W, chipBlock, chipRoom, cyclePeriod, poseAt, presence, project, speedAt, stateAt, textAlpha, type Hud, type Line, type Obj, type Plan, type Pose } from "./space";

/** the hall's own gradient: turquoise to violet to pink, Bidar's border on the site and the panel */
export const EDGE = `linear-gradient(120deg, ${MUSEUM.goldDeep}, ${MUSEUM.goldLight} 28%, ${ACCENT.turq} 62%, ${MUSEUM.gold})`;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** the sky of the hall, dark navy, the horizon a little lighter */
const SKY = `linear-gradient(180deg, ${NAVY.hall} 0%, ${NAVY.night} ${(HZ / H) * 100 - 6}%, #1a3f8a ${(HZ / H) * 100}%, ${NAVY.deep} ${(HZ / H) * 100 + 4}%, #040b22 100%)`;

// ---------- the hall ----------
/** The arches down both sides, a far gate, in depth order. */
const ARCHES: { x: number; z: number; w: number; h: number; far?: boolean }[] = [
  ...Array.from({ length: 12 }, (_, k) => [-1, 1].map((side) => ({ x: -66 + side * 1150, z: 300 + k * 1000, w: 700, h: 1550 }))).flat(),
  { x: -66, z: 14000, w: 2600, h: 3600, far: true },
];
const archPath = (w: number, h: number) => `M 0 ${h} V ${h * 0.42} C 0 ${h * 0.17}, ${w * 0.3} ${h * 0.06}, ${w / 2} 0 C ${w * 0.7} ${h * 0.06}, ${w} ${h * 0.17}, ${w} ${h * 0.42} V ${h}`;

const Arch: React.FC<{ a: (typeof ARCHES)[number]; pose: Pose; i: number }> = ({ a, pose, i }) => {
  const p = project([a.x, FLOOR, a.z], pose);
  if (!p) return null;
  const [sx, sy, s] = p;
  const w = a.w * s;
  const h = a.h * s;
  if (sx + w / 2 < -200 || sx - w / 2 > W + 200 || w < 4) return null;
  const depth = 1000 / s;
  const alpha = a.far ? 0.55 : clamp01(1.15 - depth / 9000) * 0.9;
  const id = `arch${i}`;
  return (
    <svg width={w + 8} height={h + 8} viewBox={`-4 -4 ${a.w + 8} ${a.h + 8}`} style={{ position: "absolute", left: sx - w / 2 - 4, top: sy - h - 4, opacity: alpha, overflow: "visible" }}>
      <defs>
        <linearGradient id={`${id}s`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={ACCENT.turq} />
          <stop offset="0.55" stopColor="#58d8cc" />
          <stop offset="1" stopColor={ACCENT.turq} />
        </linearGradient>
        <linearGradient id={`${id}w`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#1e4a9a" />
          <stop offset="0.45" stopColor="#163a80" />
          <stop offset="1" stopColor="#0a1c4a" />
        </linearGradient>
        <pattern id={`${id}t`} width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="none" stroke="rgba(10,20,50,.7)" strokeWidth="3" />
          <path d="M30 8 L52 30 L30 52 L8 30 Z" fill="none" stroke="rgba(120,200,220,.35)" strokeWidth="2.5" />
          <circle cx="30" cy="30" r="5" fill="rgba(244,220,154,.4)" />
        </pattern>
        <linearGradient id={`${id}n`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#3a2a18" />
          <stop offset="0.25" stopColor="#0b1430" />
          <stop offset="1" stopColor="#050a1c" />
        </linearGradient>
        <radialGradient id={`${id}f`} cx="0.5" cy="0.55" r="0.6">
          <stop offset="0" stopColor="rgba(255,214,150,.10)" />
          <stop offset="1" stopColor="rgba(255,214,150,0)" />
        </radialGradient>
      </defs>
      {/* the wall the arch is cut into: lapis tiles, lit by the lamp under the arch and falling into shadow above */}
      <rect x={-a.w * 0.16} y={-a.h * 0.06} width={a.w * 1.32} height={a.h * 1.06} fill={`url(#${id}w)`} />
      <rect x={-a.w * 0.16} y={-a.h * 0.06} width={a.w * 1.32} height={a.h * 1.06} fill={`url(#${id}t)`} opacity={0.55} />
      {/* the niche: its recess dark, with the warm light of its lamp on the floor of it */}
      <path d={`${archPath(a.w, a.h)} Z`} fill={`url(#${id}n)`} />
      <path d={`${archPath(a.w, a.h)} Z`} fill={`url(#${id}f)`} />
      {/* the tile band: turquoise tiles set edge to edge, a gilded line down their middle */}
      <path d={archPath(a.w, a.h)} fill="none" stroke="#0b3f4c" strokeWidth={a.far ? 74 : 56} opacity={0.9} />
      <path d={archPath(a.w, a.h)} fill="none" stroke={`url(#${id}s)`} strokeWidth={a.far ? 60 : 44} strokeDasharray={a.far ? "96 10" : "70 8"} opacity={0.92} />
      <path d={archPath(a.w, a.h)} fill="none" stroke={MUSEUM.goldLight} strokeWidth={a.far ? 8 : 6} opacity={0.9} />
    </svg>
  );
};

/** The floor: a fine grid in true perspective, brighter near the camera. */
const Floor: React.FC<{ pose: Pose }> = ({ pose }) => {
  const segs: [number, number, number, number][] = [];
  const near = pose.z + NEAR + 60;
  const far = pose.z + 14000;
  const seg = (a: [number, number, number], b: [number, number, number]) => {
    const p = project(a, pose);
    const q = project(b, pose);
    if (p && q) segs.push([p[0], p[1], q[0], q[1]]);
  };
  for (let x = -3300; x <= 3300; x += 300) seg([x - 66, FLOOR, near], [x - 66, FLOOR, far]);
  for (let z = Math.ceil(near / 400) * 400; z < pose.z + 11000; z += 400) seg([-3600, FLOOR, z], [3600, FLOOR, z]);
  const grid = segs.length;
  for (const x of [-66 - 470, -66 + 470]) seg([x, FLOOR, near], [x, FLOOR, far]);
  const aisle = segs.splice(grid);
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="floorline" gradientUnits="userSpaceOnUse" x1="0" y1={HZ} x2="0" y2={H}>
          <stop offset="0" stopColor="rgba(255,214,150,0)" />
          <stop offset="0.35" stopColor="rgba(255,214,150,.10)" />
          <stop offset="1" stopColor="rgba(216,178,90,.34)" />
        </linearGradient>
        <linearGradient id="aisle" gradientUnits="userSpaceOnUse" x1="0" y1={HZ} x2="0" y2={H}>
          <stop offset="0" stopColor="rgba(255,214,150,0)" />
          <stop offset="0.3" stopColor="rgba(255,214,150,.55)" />
          <stop offset="0.7" stopColor="rgba(216,178,90,.6)" />
          <stop offset="1" stopColor="rgba(244,220,154,.6)" />
        </linearGradient>
      </defs>
      {segs.map(([a, b, c, d], i) => (
        <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="url(#floorline)" strokeWidth={2} />
      ))}
      {/* the lit aisle down the middle of the hall: two lines of light on the floor, and their glow */}
      {aisle.map(([a, b, c, d], i) => (
        <g key={`aisle${i}`}>
          <line x1={a} y1={b} x2={c} y2={d} stroke="url(#aisle)" strokeWidth={46} opacity={0.18} strokeLinecap="round" />
          <line x1={a} y1={b} x2={c} y2={d} stroke="url(#aisle)" strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
};

/** Motes of dust in the light, drifting up slowly: the air of the hall. */
const MOTES = Array.from({ length: 70 }, (_, i) => {
  const r = (n: number) => {
    const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  return { x: -1700 + 3300 * r(1), y: -950 + 1500 * r(2), z: 250 + 9000 * r(3), sp: 4 + 8 * r(4), ph: 6.28 * r(5), big: r(6) };
});
/** In a loop (`cycle` frames, set/loop.ts) every mote bobs and glints on the cycle instead of drifting away, so the last frame's air is the first's. */
const Dust: React.FC<{ pose: Pose; frame: number; cycle?: number }> = ({ pose, frame, cycle }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    {MOTES.map((m, i) => {
      const t = frame / 30;
      const th = cycle ? (2 * Math.PI * frame) / cycle : 0;
      const y = cycle ? m.y - (30 + 40 * m.big) * Math.sin(th + m.ph) : ((m.y - m.sp * t * 10 + 950) % 1500) - 950;
      const p = project([m.x + 40 * (cycle ? Math.sin(th + m.ph * 2) : Math.sin(t * 0.5 + m.ph)), y, m.z], pose);
      if (!p) return null;
      const a = clamp01(1.1 - 1000 / p[2] / 9000) * (0.35 + 0.4 * m.big) * (0.6 + 0.4 * (cycle ? Math.sin(2 * th + m.ph) : Math.sin(t * 1.3 + m.ph)));
      return <circle key={i} cx={p[0]} cy={p[1]} r={Math.min(9, (1.6 + 2.6 * m.big) * p[2] + 0.5)} fill={m.big > 0.7 ? "#fff0c8" : "#ffd9a0"} opacity={a} />;
    })}
  </svg>
);

/** The hall alone (sky, arches, floor, dust) for a camera: the tile draws it under its object. */
export const HallScene: React.FC<{ pose: Pose; frame: number; field?: { field: string; deep: string; light: string } }> = ({ pose, frame, field }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: field ? `linear-gradient(180deg, ${field.field} 0%, ${field.field} 38%, ${field.deep} 100%)` : SKY }} />
    <AbsoluteFill style={{ background: `radial-gradient(900px 420px at ${CX}px ${HZ}px, rgba(255,214,150,.22), rgba(255,214,150,0) 70%), radial-gradient(700px 900px at ${CX + 260}px 260px, rgba(216,178,90,.16), rgba(216,178,90,0) 70%)` }} />
    {ARCHES.map((a, i) => ({ a, i })).reverse().map(({ a, i }) => (
      <Arch key={i} a={a} pose={pose} i={i} />
    ))}
    <Floor pose={pose} />
    <Dust pose={pose} frame={frame} />
  </AbsoluteFill>
);

// ---------- the things in the hall ----------
const TextLines: React.FC<{ lines: Line[]; color?: string; lead?: number; force?: string }> = ({ lines, color = NAVY.ink, lead = 1.45, force }) => (
  <>
    {lines.map((l, i) => (
      <div key={i} style={{ fontFamily: VAZIR, fontWeight: l.weight, fontSize: l.size, lineHeight: lead, color: force ?? l.color ?? color, whiteSpace: "nowrap", textAlign: "center" }}>
        {l.text}
      </div>
    ))}
  </>
);

/** The right answer's mark: a white disc on the slab's corner, a tick or a cross in the answer's colour, popping in with its light. */
const Mark: React.FC<{ kind: "check" | "cross"; color: string; win: number }> = ({ kind, color, win }) => {
  const k = win < 0.6 ? 0.4 + win * 1.4 : 1.24 - 0.24 * Math.min(1, (win - 0.6) / 0.4);
  return (
    <div style={{ position: "absolute", left: -30, top: -34, width: 104, height: 104, borderRadius: "50%", background: "#f4f6ff", border: `6px solid ${color}`, boxShadow: `0 0 36px ${color}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: Math.min(1, win * 1.6), transform: `scale(${k})` }}>
      <svg width={60} height={60} viewBox="0 0 24 24">
        {kind === "check" ? <path d="M4.5 12.5 L10 18 L19.5 6.5" fill="none" stroke={color} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" /> : <path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke={color} strokeWidth={3.8} strokeLinecap="round" />}
      </svg>
    </div>
  );
};

const Slab: React.FC<{ o: Obj; frame: number; s: number; total: number; cycle?: number }> = ({ o, frame, s, total, cycle }) => {
  const st = stateAt(o, frame);
  const ta = textAlpha(s);
  const accent = ACCENT[st.accent];
  // soft bars only for a slab far away; one the camera comes too near just fades (no empty glass)
  const ghosts = s < 1 ? 1 - ta : 0;
  // a slight shine that runs across the glass every few seconds
  // in a loop it runs on the cycle (never cut at the end); else it stops in the last 40 frames
  const period = cyclePeriod(150, cycle);
  const shine = cycle ? ((((frame - o.from) % period) + period) % period) / period : frame > total - 40 ? 0 : ((frame - o.from) % 150) / 150;
  // the right answer: the glass fills with its colour and its letters turn dark
  const win = st.win;
  return (
    <div style={{ position: "relative", width: o.w, height: o.h, borderRadius: 40, padding: 4, background: st.glow > 0.05 ? `linear-gradient(120deg, ${accent}, ${accent} 40%, ${ACCENT.gold})` : EDGE, boxShadow: win > 0.05 ? `0 0 ${70 + 60 * win}px ${accent}, 0 40px 80px rgba(0,0,0,.5)` : `0 0 ${30 + 70 * st.glow}px rgba(255,214,150,${0.18 + 0.4 * st.glow}), 0 40px 80px rgba(0,0,0,.5)` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 36, overflow: "hidden", background: `linear-gradient(165deg, ${NAVY.panel2} 0%, ${NAVY.panel} 45%, ${NAVY.night} 100%)` }}>
        {win > 0.02 ? <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${accent} 0%, ${accent} 60%, ${accent}cc 100%)`, opacity: win }} /> : null}
        {/* the label's gilded corners, as on an illuminated page (the upper right is the tag's) */}
        {s >= 0.5 ? (
          <>
            {o.tag ? null : <div style={{ position: "absolute", top: 10, right: 10, opacity: 0.85 * ta }}><Tazhib size={58} turn={0} /></div>}
            <div style={{ position: "absolute", top: 10, left: 10, opacity: 0.85 * ta }}><Tazhib size={58} turn={3} /></div>
            <div style={{ position: "absolute", bottom: 10, left: 10, opacity: 0.85 * ta }}><Tazhib size={58} turn={2} /></div>
            <div style={{ position: "absolute", bottom: 10, right: 10, opacity: 0.85 * ta }}><Tazhib size={58} turn={1} /></div>
          </>
        ) : null}
        {/* light from above, and the running shine */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0) 38%)" }} />
        <div style={{ position: "absolute", top: -o.h, bottom: -o.h, width: 120, left: -200 + (o.w + 400) * shine, transform: "rotate(18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.08), rgba(255,255,255,0))" }} />
        {st.glow > 0.02 ? <div style={{ position: "absolute", inset: 0, background: `radial-gradient(closest-side at 50% 50%, ${accent}33, ${accent}00)`, opacity: st.glow }} /> : null}
        {o.tag ? (
          <div style={{ position: "absolute", top: 26, right: 30, padding: "4px 24px 10px", borderRadius: 30, background: accent, color: NAVY.dark, fontFamily: VAZIR, fontWeight: 900, fontSize: TAG_SIZE, direction: "rtl", opacity: ta, whiteSpace: "nowrap" }}>{o.tag}</div>
        ) : null}
        <div style={{ position: "absolute", left: 40, right: 40, top: o.tag ? TAG_ROOM : TOP_ROOM, bottom: chipRoom(o.chip), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", opacity: ta }}>
          {o.image ? <Img src={o.image.src} style={{ height: o.image.h, width: "auto", borderRadius: 10, marginBottom: 18, boxShadow: "0 16px 40px rgba(0,0,0,.5)", background: "#fff", padding: 8 }} /> : null}
          <TextLines lines={o.lines ?? []} force={win > 0.5 ? NAVY.dark : undefined} />
        </div>
        {o.chip?.length ? (
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 22, display: "flex", justifyContent: "center", opacity: ta }}>
            <div style={{ height: chipBlock(o.chip), boxSizing: "border-box", padding: "4px 26px 14px", borderRadius: 24, background: "rgba(244,246,255,.10)", border: "2px solid rgba(244,246,255,.22)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl" }}>
              {o.chip.map((l, i) => (
                <div key={i} style={{ fontFamily: VAZIR, fontWeight: l.weight, fontSize: l.size, lineHeight: CHIP_LEAD, color: "#c3cbe6", whiteSpace: "nowrap", textAlign: "center" }}>
                  <bdi>{l.text}</bdi>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {/* far away: soft bars where the lines will be */}
        {ghosts > 0.02 && (o.lines?.length ?? 0) > 0 ? (
          <div style={{ position: "absolute", inset: "30% 16%", display: "flex", flexDirection: "column", gap: 34, alignItems: "center", opacity: ghosts * 0.8 }}>
            {(o.lines ?? []).slice(0, 3).map((_, i) => (
              <div key={i} style={{ height: 30, width: `${88 - i * 18}%`, borderRadius: 15, background: "rgba(169,180,214,.22)" }} />
            ))}
          </div>
        ) : null}
      </div>
      {o.mark && win > 0.02 ? <Mark kind={o.mark} color={accent} win={win} /> : null}
    </div>
  );
};

const Ring: React.FC<{ o: Obj; frame: number }> = ({ o, frame }) => {
  const secs = o.secs ?? 3;
  const start = o.start ?? o.from;
  // before its count: a full turquoise ring with «؟», breathing slowly
  const waiting = frame < start;
  const t = Math.max(0, frame - start) / 30;
  const left = Math.max(1, secs - Math.floor(t));
  const p = waiting ? 1 : clamp01(1 - t / secs);
  const pulse = waiting ? 0.5 + 0.5 * Math.sin((frame - o.from) / 9) : interpolate((frame - start) % 30, [0, 10], [1, 0], clamped);
  const color = waiting || left >= 3 ? ACCENT.turq : left === 2 ? ACCENT.gold : ACCENT.wrong;
  const size = o.w;
  return (
    <div style={{ position: "relative", width: size, height: size, transform: `scale(${1 + 0.06 * pulse})` }}>
      <svg width={size} height={size} viewBox="0 0 280 280" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={140} cy={140} r={116} fill="rgba(6,16,31,.85)" stroke="rgba(244,246,255,.12)" strokeWidth={20} />
        <circle cx={140} cy={140} r={116} fill="none" stroke={color} strokeWidth={20} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} style={{ filter: `drop-shadow(0 0 ${10 + 14 * pulse}px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: o.word?.size ?? 130, color, lineHeight: 1 }}>{waiting ? "؟" : "۰۱۲۳۴۵۶۷۸۹"[left]}</div>
    </div>
  );
};

const Stamp: React.FC<{ o: Obj; frame: number }> = ({ o, frame }) => {
  const accent = ACCENT[o.accent ?? "turq"];
  const t = frame - o.from;
  const k = t < 5 ? 2.0 - 1.06 * (t / 5) : t < 9 ? 0.94 + 0.09 * ((t - 5) / 4) : t < 13 ? 1.03 - 0.03 * ((t - 9) / 4) : 1;
  return (
    <div style={{ width: o.w, height: o.h, borderRadius: o.h / 2, border: `8px solid ${accent}`, background: "rgba(6,16,31,.88)", display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${o.tilt ?? 0}deg) scale(${k})`, boxShadow: `0 0 50px ${accent}88` }}>
      <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: o.word?.size ?? 80, color: accent, direction: "rtl", whiteSpace: "nowrap", lineHeight: 1.2, paddingBottom: 8 }}>{o.word?.text}</span>
    </div>
  );
};

const Medal: React.FC<{ o: Obj; frame: number; s: number }> = ({ o, frame, s }) => {
  const st = stateAt(o, frame);
  const accent = ACCENT[st.accent];
  return (
    <div style={{ width: o.w, height: o.h, borderRadius: "50%", padding: 6, background: EDGE, boxShadow: `0 0 ${40 + 60 * st.glow}px ${accent}66` }}>
      <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: `radial-gradient(circle at 40% 35%, ${NAVY.panel2}, ${NAVY.night})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: o.word?.size ?? 120, color: accent, lineHeight: 1, opacity: textAlpha(s) > 0 ? 1 : 0.7 }}>{o.word?.text}</span>
      </div>
    </div>
  );
};

const Burst: React.FC<{ o: Obj; frame: number }> = ({ o, frame }) => {
  const t = frame - o.from;
  const colors = [ACCENT.right, ACCENT.gold, ACCENT.turq, ACCENT.wrong, MUSEUM.goldLight];
  return (
    <div style={{ position: "relative", width: o.w, height: o.h }}>
      {Array.from({ length: 22 }, (_, k) => {
        const ang = (k / 22) * Math.PI * 2 + k * 0.3;
        const d = (o.w / 2) * (1 - (1 - Math.min(1, t / 20)) ** 3) * (0.6 + 0.4 * ((k * 7) % 5) / 4);
        const a = interpolate(t, [12, 28], [1, 0], clamped);
        return <div key={k} style={{ position: "absolute", left: o.w / 2 + Math.cos(ang) * d - 8, top: o.h / 2 + Math.sin(ang) * d - 8, width: 16, height: 16, borderRadius: k % 2 ? 8 : 3, background: colors[k % colors.length], opacity: a, boxShadow: `0 0 12px ${colors[k % colors.length]}` }} />;
      })}
    </div>
  );
};

/** An artifact turning in the light, a soft pool of light under it, and a slow bob so a held shot still breathes. */
const ArtifactThing: React.FC<{ o: Obj; frame: number; cased: boolean; cycle?: number }> = ({ o, frame, cased, cycle }) => {
  const t = (frame - o.from) / 30;
  const turn = (o.spin?.from ?? 0) + (o.spin?.speed ?? 24) * t;
  // the museum's way: the object stands on a plinth in a glass case, a warm lamp over it; it turns slowly and does not float
  const ph = Math.max(34, Math.round(o.h * 0.2));
  // the case and the plinth are for the object a scene is about (the cylinder of «باور یا سند؟»). An object that stands
  // against a map board has no room for them: they lay over the words under it in the first samples of «مرز ایران»
  return (
    <div style={{ position: "relative", width: o.w, height: o.h }}>
      {cased ? (
        <>
          <div style={{ position: "absolute", left: -o.w * 0.08, top: o.h - ph * 0.42, width: o.w * 1.16, height: ph }}>
            <Plinth w={Math.round(o.w * 1.16)} h={ph} />
          </div>
          <div style={{ position: "absolute", left: -o.w * 0.06, top: -o.h * 0.12, width: o.w * 1.12, height: o.h * 1.14 }}>
            <Vitrine w={Math.round(o.w * 1.12)} h={Math.round(o.h * 1.14)} frame={frame} period={cyclePeriod(180, cycle)} />
          </div>
        </>
      ) : null}
      <div style={{ position: "relative", width: o.w, height: o.h, filter: `drop-shadow(0 22px 26px rgba(0,0,0,.6)) drop-shadow(0 0 30px rgba(${MUSEUM.warm},.28))` }}>
        <Artifact id={o.id} model={o.model ?? "coin"} emblem={o.emblem} w={o.w} h={o.h} turn={turn} frame={frame} />
      </div>
    </div>
  );
};

/** One object where the camera sees it, with its light pool and its reflection on the floor. */
const Thing: React.FC<{ o: Obj; pose: Pose; frame: number; total: number; cased: boolean; cycle?: number }> = ({ o, pose, frame, total, cased, cycle }) => {
  const pr = presence(o, frame);
  if (pr.a <= 0) return null;
  const st = stateAt(o, frame);
  const p = project([o.at[0], o.at[1] + st.dy + pr.lift, o.at[2] + st.dz], pose);
  if (!p) return null;
  const [sx, sy, s0] = p;
  const s = s0 * pr.k;
  // the camera flying through a slab: it fades as it fills the lens
  const through = clamp01((1.7 - s0) / 0.4);
  const alpha = pr.a * (1 - 0.6 * st.dim) * through;
  if (alpha <= 0.01) return null;
  const accent = ACCENT[st.accent];
  const floor = o.kind === "slab" || o.kind === "medal" || o.kind === "artifact" || o.kind === "map" ? project([o.at[0], FLOOR, o.at[2] + st.dz], pose) : null;
  const mirror = o.kind === "slab" || o.kind === "map" ? project([o.at[0], 2 * FLOOR - (o.at[1] + st.dy + pr.lift + o.h / 2), o.at[2] + st.dz], pose) : null;
  return (
    <>
      {floor ? (
        <div style={{ position: "absolute", left: floor[0] - o.w * floor[2] * 0.75, top: floor[1] - o.w * floor[2] * 0.12, width: o.w * floor[2] * 1.5, height: o.w * floor[2] * 0.24, borderRadius: "50%", background: `radial-gradient(closest-side, ${accent}${Math.round(60 + 80 * st.glow).toString(16).padStart(2, "0")}, ${accent}00)`, opacity: alpha }} />
      ) : null}
      {mirror ? (
        <div style={{ position: "absolute", left: mirror[0] - (o.w * mirror[2]) / 2, top: mirror[1], width: o.w * mirror[2], height: o.h * mirror[2] * 0.5, borderRadius: 30 * mirror[2], background: `linear-gradient(180deg, ${accent}2a, rgba(216,178,90,.08) 40%, rgba(0,0,0,0))`, opacity: alpha * 0.9 }} />
      ) : null}
      <div style={{ position: "absolute", left: sx, top: sy, width: o.w, height: o.h, transform: `translate(-50%, -50%) scale(${s}) perspective(1600px) rotateY(${-pose.yaw * 0.5}deg)`, opacity: alpha }}>
        {o.kind === "slab" ? <Slab o={o} frame={frame} s={s0} total={total} cycle={cycle} /> : o.kind === "artifact" ? <ArtifactThing o={o} frame={frame} cased={cased} cycle={cycle} /> : o.kind === "map" && o.map ? <MapBoard id={o.id} w={o.w} h={o.h} map={o.map} frame={frame} /> : o.kind === "ring" ? <Ring o={o} frame={frame} /> : o.kind === "stamp" ? <Stamp o={o} frame={frame} /> : o.kind === "medal" ? <Medal o={o} frame={frame} s={s0} /> : <Burst o={o} frame={frame} />}
      </div>
    </>
  );
};

// ---------- over the hall ----------
/**
 * The channel badge (the owner, 2026-11-13): «بیدار» in its own Nastaliq, a
 * tiny heart and a tiny follow mark, in a small glass pill; in the bottom safe
 * area, for a moment at the close, never in the middle.
 */
export const Badge: React.FC<{ h: Hud; frame: number }> = ({ h, frame }) => {
  const t = frame - h.from;
  const k = t < 6 ? 0.7 + 0.36 * (1 - (1 - t / 6) ** 3) : t < 12 ? 1.06 - 0.06 * ((t - 6) / 6) : 1;
  const a = Math.min(1, t / 4, (h.to - frame) / 6);
  const beat = 1 + 0.12 * Math.max(0, Math.sin(((t - 14) / 30) * Math.PI * 2)) * (t > 14 ? 1 : 0);
  return (
    <div style={{ position: "absolute", left: h.box.x, top: h.box.y, width: h.box.w, height: h.box.h, borderRadius: h.box.h / 2, padding: 3, background: EDGE, opacity: Math.max(0, a), transform: `scale(${k})`, transformOrigin: "0% 50%", boxShadow: "0 12px 30px rgba(0,0,0,.45)" }}>
      <div style={{ width: "100%", height: "100%", borderRadius: h.box.h / 2, background: "rgba(6,16,31,.92)", display: "flex", alignItems: "center", justifyContent: "center", gap: 18, direction: "rtl" }}>
        <span style={{ fontFamily: GULZAR, fontSize: 44, lineHeight: 1.1, color: ACCENT.turq, transform: "translateY(-4px)" }}>بیدار</span>
        <svg width={34} height={34} viewBox="0 0 24 24" style={{ transform: `scale(${beat})` }}>
          <path d="M12 21 C 5 15.5, 2 12, 2 8.2 C 2 5.3, 4.3 3, 7.1 3 C 9.1 3, 10.9 4.2, 12 5.9 C 13.1 4.2, 14.9 3, 16.9 3 C 19.7 3, 22 5.3, 22 8.2 C 22 12, 19 15.5, 12 21 Z" fill="#e0523a" />
        </svg>
        <svg width={34} height={34} viewBox="0 0 24 24">
          <circle cx={12} cy={12} r={10.5} fill="none" stroke={ACCENT.turq} strokeWidth={2.4} />
          <path d="M12 7 V17 M7 12 H17" stroke={ACCENT.turq} strokeWidth={2.6} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

/**
 * A source line of Persian and Latin: the Persian words before the first Latin
 * letter in the paragraph's own order, the rest (titles, their quotes and
 * semicolons) isolated left to right, so «"Life of Crassus";» keeps its marks.
 */
const Mixed: React.FC<{ text: string }> = ({ text }) => {
  let k = text.search(/[A-Za-z]/);
  if (k < 0) return <bdi>{text}</bdi>;
  // an opening quote or bracket just before the title goes with it; no Persian word before it: the whole line left to right
  while (k > 0 && "«\"(".includes(text[k - 1])) k -= 1;
  if (!/[ء-ۓ]/.test(text.slice(0, k))) k = 0;
  return (
    <>
      {k > 0 ? <bdi>{text.slice(0, k)}</bdi> : null}
      <bdi dir="ltr">{text.slice(k)}</bdi>
    </>
  );
};

const SourceBox: React.FC<{ h: Hud; frame: number; align?: "flex-start" | "flex-end" }> = ({ h, frame, align = "flex-end" }) => {
  const a = Math.min(1, (frame - h.from) / 8, (h.to - frame) / 6);
  return (
    <div style={{ position: "absolute", left: h.box.x, top: h.box.y, width: h.box.w, height: h.box.h, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: align, direction: "rtl", opacity: Math.max(0, a), transform: `translateY(${(1 - Math.max(0, a)) * 12}px)` }}>
      {(h.lines ?? []).map((l, i) => (
        <div key={i} style={{ fontFamily: VAZIR, fontWeight: l.weight, fontSize: l.size, lineHeight: 1.35, color: l.color ?? NAVY.muted, whiteSpace: "nowrap", direction: /^[a-z0-9.]+$/i.test(l.text) ? "ltr" : "rtl" }}>
          {h.align === "start" ? <Mixed text={l.text} /> : <bdi>{l.text}</bdi>}
        </div>
      ))}
    </div>
  );
};

/** A set Reel: the hall, the plan's things, the badge and the source, the bed, the narrator and the effects. */
export const Hall: React.FC<{ plan: Plan; tl: Timeline; music?: string }> = ({ plan, tl, music }) => {
  const frame = useCurrentFrame();
  const pose = poseAt(plan.shots, plan.punches, frame);
  const speed = speedAt(plan.shots, plan.punches, frame);
  const blur = Math.min(9, Math.max(0, (speed - 30) / 22));
  // objects get their plinth and glass case unless the Reel has a map board they stand against
  const cased = !plan.objects.some((o) => o.kind === "map");
  const order = plan.objects
    .map((o) => ({ o, d: project([o.at[0], o.at[1], o.at[2] + stateAt(o, frame).dz], pose)?.[2] ?? 0 }))
    .filter((x) => x.d > 0)
    .sort((a, b) => a.d - b.d);
  return (
    <AbsoluteFill style={{ background: NAVY.deep, overflow: "hidden" }}>
      {/* the sky of the hall and its horizon's light */}
      <AbsoluteFill style={{ background: SKY }} />
      <AbsoluteFill style={{ background: `radial-gradient(900px 420px at ${CX - pose.yaw * 18}px ${HZ}px, rgba(255,214,150,.22), rgba(255,214,150,0) 70%), radial-gradient(700px 900px at ${CX + 260 - pose.yaw * 10}px 260px, rgba(216,178,90,.16), rgba(216,178,90,0) 70%)` }} />
      <AbsoluteFill style={{ filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
        {ARCHES.map((a, i) => ({ a, i })).reverse().map(({ a, i }) => (
          <Arch key={i} a={a} pose={pose} i={i} />
        ))}
        <Floor pose={pose} />
        <Dust pose={pose} frame={frame} cycle={plan.cycle} />
        {order.map(({ o }) => (
          <Thing key={o.id} o={o} pose={pose} frame={frame} total={plan.total} cased={cased} cycle={plan.cycle} />
        ))}
      </AbsoluteFill>
      {/* the lamps' pool on the stone floor in front of the camera, so the lower part of the hall is lit, not black */}
      <AbsoluteFill style={{ background: `radial-gradient(760px 330px at ${CX - pose.yaw * 8}px ${HZ + 520}px, rgba(${MUSEUM.warm},.17), rgba(${MUSEUM.warm},0) 72%)` }} />
      {/* the edges fall into shadow, so the light stays on the label */}
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 46%, rgba(0,0,0,0) 66%, rgba(2,4,12,.42) 100%)" }} />
      {/* the museum's rope across the bottom of the frame, under the platforms' caption rows: the lower part is never bare floor */}
      <RopeBarrier width={W} drift={-pose.yaw * 5} />
      {plan.hud.map((h) => (frame >= h.from && frame < h.to ? h.kind === "badge" ? <Badge key={h.id} h={h} frame={frame} /> : <SourceBox key={h.id} h={h} frame={frame} align={h.align === "start" ? "flex-start" : "flex-end"} /> : null))}
      {music ? <Audio src={staticFile(music)} /> : null}
      {tl.voice.map((v, i) => (
        <Sequence key={`${v.file}-${i}`} from={v.from} durationInFrames={v.frames ?? Infinity} layout="none">
          <Audio src={staticFile(v.file)} {...(v.trim ? { trimBefore: v.trim } : {})} />
        </Sequence>
      ))}
      {plan.sfx.map((s, i) => (
        <Sequence key={`sfx${i}`} from={Math.max(0, Math.round(s.at))} durationInFrames={66} layout="none">
          <Audio src={staticFile(`sfx/${s.name}.wav`)} volume={s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
