// Draws a set plan (space.ts): Bidar's hall of arches, lit in turquoise,
// violet and pink, its glossy floor, the episode's glass slabs, and over them
// the source line and the channel badge; then the bed, the narrator and the
// sound of every move.
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { GULZAR, VAZIR, clamped } from "../kit";
import type { Timeline } from "../props";
import { ACCENT, CX, FLOOR, H, HZ, NAVY, NEAR, TAG_SIZE, W, poseAt, presence, project, speedAt, stateAt, textAlpha, type Hud, type Line, type Obj, type Plan, type Pose } from "./space";

/** the hall's own gradient: turquoise to violet to pink, Bidar's border on the site and the panel */
export const EDGE = `linear-gradient(120deg, ${ACCENT.turq}, ${ACCENT.violet} 55%, #ff4d8d)`;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** the sky of the hall, dark navy, the horizon a little lighter */
const SKY = `linear-gradient(180deg, ${NAVY.hall} 0%, ${NAVY.night} ${(HZ / H) * 100 - 6}%, #0b1d3a ${(HZ / H) * 100}%, ${NAVY.deep} ${(HZ / H) * 100 + 4}%, #050b1d 100%)`;

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
          <stop offset="0.55" stopColor={ACCENT.violet} />
          <stop offset="1" stopColor="#ff4d8d" />
        </linearGradient>
        <radialGradient id={`${id}f`} cx="0.5" cy="0.55" r="0.6">
          <stop offset="0" stopColor="rgba(23,212,164,.10)" />
          <stop offset="1" stopColor="rgba(23,212,164,0)" />
        </radialGradient>
      </defs>
      <path d={`${archPath(a.w, a.h)} Z`} fill={`url(#${id}f)`} />
      <path d={archPath(a.w, a.h)} fill="none" stroke={`url(#${id}s)`} strokeWidth={a.far ? 10 : 7} />
      <path d={archPath(a.w, a.h)} fill="none" stroke={`url(#${id}s)`} strokeWidth={a.far ? 34 : 26} opacity={0.16} />
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
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id="floorline" gradientUnits="userSpaceOnUse" x1="0" y1={HZ} x2="0" y2={H}>
          <stop offset="0" stopColor="rgba(23,212,164,0)" />
          <stop offset="0.35" stopColor="rgba(23,212,164,.10)" />
          <stop offset="1" stopColor="rgba(123,97,255,.26)" />
        </linearGradient>
      </defs>
      {segs.map(([a, b, c, d], i) => (
        <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="url(#floorline)" strokeWidth={2} />
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
const Dust: React.FC<{ pose: Pose; frame: number }> = ({ pose, frame }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    {MOTES.map((m, i) => {
      const t = frame / 30;
      const y = ((m.y - m.sp * t * 10 + 950) % 1500) - 950;
      const p = project([m.x + 40 * Math.sin(t * 0.5 + m.ph), y, m.z], pose);
      if (!p) return null;
      const a = clamp01(1.1 - 1000 / p[2] / 9000) * (0.35 + 0.4 * m.big) * (0.6 + 0.4 * Math.sin(t * 1.3 + m.ph));
      return <circle key={i} cx={p[0]} cy={p[1]} r={Math.min(9, (1.6 + 2.6 * m.big) * p[2] + 0.5)} fill={m.big > 0.7 ? "#bfefff" : "#9ff5df"} opacity={a} />;
    })}
  </svg>
);

/** The hall alone (sky, arches, floor, dust) for a camera: the tile draws it under its object. */
export const HallScene: React.FC<{ pose: Pose; frame: number }> = ({ pose, frame }) => (
  <AbsoluteFill>
    <AbsoluteFill style={{ background: SKY }} />
    <AbsoluteFill style={{ background: `radial-gradient(900px 420px at ${CX}px ${HZ}px, rgba(23,212,164,.22), rgba(23,212,164,0) 70%), radial-gradient(700px 900px at ${CX + 260}px 260px, rgba(123,97,255,.16), rgba(123,97,255,0) 70%)` }} />
    {ARCHES.map((a, i) => ({ a, i })).reverse().map(({ a, i }) => (
      <Arch key={i} a={a} pose={pose} i={i} />
    ))}
    <Floor pose={pose} />
    <Dust pose={pose} frame={frame} />
  </AbsoluteFill>
);

// ---------- the things in the hall ----------
const TextLines: React.FC<{ lines: Line[]; color?: string; lead?: number }> = ({ lines, color = NAVY.ink, lead = 1.45 }) => (
  <>
    {lines.map((l, i) => (
      <div key={i} style={{ fontFamily: VAZIR, fontWeight: l.weight, fontSize: l.size, lineHeight: lead, color: l.color ?? color, whiteSpace: "nowrap", textAlign: "center" }}>
        {l.text}
      </div>
    ))}
  </>
);

const Slab: React.FC<{ o: Obj; frame: number; s: number }> = ({ o, frame, s }) => {
  const st = stateAt(o, frame);
  const ta = textAlpha(s);
  const accent = ACCENT[st.accent];
  const ghosts = 1 - ta;
  // a slight shine that runs across the glass every few seconds
  const shine = ((frame - o.from) % 150) / 150;
  return (
    <div style={{ width: o.w, height: o.h, borderRadius: 40, padding: 4, background: st.glow > 0.05 ? `linear-gradient(120deg, ${accent}, ${accent} 40%, ${ACCENT.violet})` : EDGE, boxShadow: `0 0 ${30 + 70 * st.glow}px rgba(23,212,164,${0.18 + 0.4 * st.glow}), 0 40px 80px rgba(0,0,0,.5)` }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 36, overflow: "hidden", background: `linear-gradient(165deg, ${NAVY.panel2} 0%, ${NAVY.panel} 45%, ${NAVY.night} 100%)` }}>
        {/* light from above, and the running shine */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,.10), rgba(255,255,255,0) 38%)" }} />
        <div style={{ position: "absolute", top: -o.h, bottom: -o.h, width: 120, left: -200 + (o.w + 400) * shine, transform: "rotate(18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.08), rgba(255,255,255,0))" }} />
        {st.glow > 0.02 ? <div style={{ position: "absolute", inset: 0, background: `radial-gradient(closest-side at 50% 50%, ${accent}33, ${accent}00)`, opacity: st.glow }} /> : null}
        {o.tag ? (
          <div style={{ position: "absolute", top: 26, right: 30, padding: "4px 24px 10px", borderRadius: 30, background: accent, color: NAVY.dark, fontFamily: VAZIR, fontWeight: 900, fontSize: TAG_SIZE, direction: "rtl", opacity: ta, whiteSpace: "nowrap" }}>{o.tag}</div>
        ) : null}
        <div style={{ position: "absolute", left: 40, right: 40, top: o.tag ? 92 : 24, bottom: o.chip ? 86 : 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", opacity: ta }}>
          {o.image ? <Img src={o.image.src} style={{ height: o.image.h, width: "auto", borderRadius: 10, marginBottom: 18, boxShadow: "0 16px 40px rgba(0,0,0,.5)", background: "#fff", padding: 8 }} /> : null}
          <TextLines lines={o.lines ?? []} />
        </div>
        {o.chip ? (
          <div style={{ position: "absolute", left: 30, right: 30, bottom: 22, display: "flex", justifyContent: "center", opacity: ta }}>
            <div style={{ padding: "2px 22px 8px", borderRadius: 22, background: "rgba(244,246,255,.08)", border: "2px solid rgba(244,246,255,.16)", fontFamily: VAZIR, fontWeight: o.chip.weight, fontSize: o.chip.size, color: NAVY.muted, direction: "rtl", whiteSpace: "nowrap" }}>
              <bdi>{o.chip.text}</bdi>
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
    </div>
  );
};

const Ring: React.FC<{ o: Obj; frame: number }> = ({ o, frame }) => {
  const secs = o.secs ?? 3;
  const t = (frame - o.from) / 30;
  const left = Math.max(1, secs - Math.floor(t));
  const p = clamp01(1 - t / secs);
  const pulse = interpolate((frame - o.from) % 30, [0, 10], [1, 0], clamped);
  const color = left >= 3 ? ACCENT.turq : left === 2 ? ACCENT.gold : "#ff4d8d";
  const size = o.w;
  return (
    <div style={{ position: "relative", width: size, height: size, transform: `scale(${1 + 0.06 * pulse})` }}>
      <svg width={size} height={size} viewBox="0 0 280 280" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={140} cy={140} r={116} fill="rgba(6,16,31,.85)" stroke="rgba(244,246,255,.12)" strokeWidth={20} />
        <circle cx={140} cy={140} r={116} fill="none" stroke={color} strokeWidth={20} strokeLinecap="round" pathLength={1} strokeDasharray={`${p} 1`} style={{ filter: `drop-shadow(0 0 ${10 + 14 * pulse}px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: o.word?.size ?? 130, color, lineHeight: 1 }}>{"۰۱۲۳۴۵۶۷۸۹"[left]}</div>
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
  const colors = [ACCENT.right, ACCENT.gold, ACCENT.turq, "#ff4d8d", ACCENT.violet];
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

/** One object where the camera sees it, with its light pool and its reflection on the floor. */
const Thing: React.FC<{ o: Obj; pose: Pose; frame: number }> = ({ o, pose, frame }) => {
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
  const floor = o.kind === "slab" || o.kind === "medal" ? project([o.at[0], FLOOR, o.at[2] + st.dz], pose) : null;
  const mirror = o.kind === "slab" ? project([o.at[0], 2 * FLOOR - (o.at[1] + st.dy + pr.lift + o.h / 2), o.at[2] + st.dz], pose) : null;
  return (
    <>
      {floor ? (
        <div style={{ position: "absolute", left: floor[0] - o.w * floor[2] * 0.75, top: floor[1] - o.w * floor[2] * 0.12, width: o.w * floor[2] * 1.5, height: o.w * floor[2] * 0.24, borderRadius: "50%", background: `radial-gradient(closest-side, ${accent}${Math.round(60 + 80 * st.glow).toString(16).padStart(2, "0")}, ${accent}00)`, opacity: alpha }} />
      ) : null}
      {mirror ? (
        <div style={{ position: "absolute", left: mirror[0] - (o.w * mirror[2]) / 2, top: mirror[1], width: o.w * mirror[2], height: o.h * mirror[2] * 0.5, borderRadius: 30 * mirror[2], background: `linear-gradient(180deg, ${accent}2a, rgba(123,97,255,.08) 40%, rgba(0,0,0,0))`, opacity: alpha * 0.9 }} />
      ) : null}
      <div style={{ position: "absolute", left: sx, top: sy, width: o.w, height: o.h, transform: `translate(-50%, -50%) scale(${s}) perspective(1600px) rotateY(${-pose.yaw * 0.5}deg)`, opacity: alpha }}>
        {o.kind === "slab" ? <Slab o={o} frame={frame} s={s0} /> : o.kind === "ring" ? <Ring o={o} frame={frame} /> : o.kind === "stamp" ? <Stamp o={o} frame={frame} /> : o.kind === "medal" ? <Medal o={o} frame={frame} s={s0} /> : <Burst o={o} frame={frame} />}
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
          <path d="M12 21 C 5 15.5, 2 12, 2 8.2 C 2 5.3, 4.3 3, 7.1 3 C 9.1 3, 10.9 4.2, 12 5.9 C 13.1 4.2, 14.9 3, 16.9 3 C 19.7 3, 22 5.3, 22 8.2 C 22 12, 19 15.5, 12 21 Z" fill="#ff4d8d" />
        </svg>
        <svg width={34} height={34} viewBox="0 0 24 24">
          <circle cx={12} cy={12} r={10.5} fill="none" stroke={ACCENT.turq} strokeWidth={2.4} />
          <path d="M12 7 V17 M7 12 H17" stroke={ACCENT.turq} strokeWidth={2.6} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

const SourceBox: React.FC<{ h: Hud; frame: number }> = ({ h, frame }) => {
  const a = Math.min(1, (frame - h.from) / 8, (h.to - frame) / 6);
  return (
    <div style={{ position: "absolute", left: h.box.x, top: h.box.y, width: h.box.w, height: h.box.h, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", direction: "rtl", opacity: Math.max(0, a), transform: `translateY(${(1 - Math.max(0, a)) * 12}px)` }}>
      {(h.lines ?? []).map((l, i) => (
        <div key={i} style={{ fontFamily: VAZIR, fontWeight: l.weight, fontSize: l.size, lineHeight: 1.35, color: l.color ?? NAVY.muted, whiteSpace: "nowrap", direction: /^[a-z0-9.]+$/i.test(l.text) ? "ltr" : "rtl" }}>
          <bdi>{l.text}</bdi>
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
  const order = plan.objects
    .map((o) => ({ o, d: project(o.at, pose)?.[2] ?? 0 }))
    .filter((x) => x.d > 0)
    .sort((a, b) => a.d - b.d);
  return (
    <AbsoluteFill style={{ background: NAVY.deep, overflow: "hidden" }}>
      {/* the sky of the hall and its horizon's light */}
      <AbsoluteFill style={{ background: SKY }} />
      <AbsoluteFill style={{ background: `radial-gradient(900px 420px at ${CX - pose.yaw * 18}px ${HZ}px, rgba(23,212,164,.22), rgba(23,212,164,0) 70%), radial-gradient(700px 900px at ${CX + 260 - pose.yaw * 10}px 260px, rgba(123,97,255,.16), rgba(123,97,255,0) 70%)` }} />
      <AbsoluteFill style={{ filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined }}>
        {ARCHES.map((a, i) => ({ a, i })).reverse().map(({ a, i }) => (
          <Arch key={i} a={a} pose={pose} i={i} />
        ))}
        <Floor pose={pose} />
        <Dust pose={pose} frame={frame} />
        {order.map(({ o }) => (
          <Thing key={o.id} o={o} pose={pose} frame={frame} />
        ))}
      </AbsoluteFill>
      {/* the edges fall into shadow, so the light stays on the slab */}
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 46%, rgba(0,0,0,0) 62%, rgba(2,4,12,.55) 100%)" }} />
      {plan.hud.map((h) => (frame >= h.from && frame < h.to ? h.kind === "badge" ? <Badge key={h.id} h={h} frame={frame} /> : <SourceBox key={h.id} h={h} frame={frame} /> : null))}
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
