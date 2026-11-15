// The map board of «مرز ایران، دوره به دوره»: a glass board standing in the
// hall with Bidar's base map in it (Natural Earth 1:110m) and the extents the
// site sends (Cliopatria, Seshat, CC BY 4.0), one after another: each grows
// out from its capital, the one before stays a moment as a dashed ghost, a
// short-lived peak comes in coral, and today's border is drawn in gold at the
// end. In the hook the map zooms out and back in (the owner's brief: «نقشه‌ای
// که در ۳ ثانیه بزرگ و کوچک می‌شود»). It writes no text: the names and years
// are on the slabs, measured (plans), where the gate can check them.
import React from "react";
import { interpolate } from "remotion";
import { BORDERS, GRATICULE, IRAN, LAND, draw, fit, mix, push, type View } from "../geo";
import { clamped, ease, easeInOut } from "../kit";
import type { MapSpec, MapStop } from "./space";
import { ACCENT, NAVY } from "./space";

const SEA = "#0a1a3f";
const LANDC = "#182c5e";
const GOLD = "#e8c56a";
const CORAL = "#ff8a65";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const feat = (g: unknown): any => ({ type: "Feature", properties: {}, geometry: g });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const shapeOf = (s: MapStop): any => (s.today ? feat(s.geometry ?? IRAN.geometry) : s.peak ? { type: "FeatureCollection", features: [feat(s.geometry), feat(s.peak)] } : feat(s.geometry));

/** The stop on the board at a frame (the last one begun). */
export const stopAt = (m: MapSpec, f: number) => Math.max(0, m.stops.reduce((k, s, i) => (f >= s.from ? i : k), 0));

export const MapBoard: React.FC<{ id: string; w: number; h: number; map: MapSpec; frame: number }> = ({ id, w, h, map, frame }) => {
  const iw = w - 8;
  const ih = h - 8;
  const views = map.stops.map((s) => fit(shapeOf(s), iw * 0.84, ih * 0.76));
  const k = stopAt(map, frame);
  const s = map.stops[k];
  let v: View;
  if (frame < map.zoom) {
    // the hook: from close on today's Iran, out wide over the whole region, and in on the first extent
    const close = push(fit(IRAN, iw * 0.84, ih * 0.76), 1.15);
    const wide = push(views[0], 0.62);
    const u = frame / map.zoom;
    v = u < 0.5 ? mix(close, wide, easeInOut(u / 0.5)) : mix(wide, views[0], easeInOut((u - 0.5) / 0.5));
  } else {
    const prev = views[Math.max(0, k - 1)];
    const glideIn = k === 0 ? 1 : interpolate(frame, [s.from - 4, s.from + 16], [0, 1], { ...clamped, easing: easeInOut });
    // a slow push inside each stop, so the map is never still
    const drift = 1 + 0.0016 * Math.max(0, frame - s.from);
    v = push(mix(prev, views[k], glideIn), Math.min(drift, 1.12));
  }
  const m = draw(v, iw / 2, ih / 2);
  const grow = interpolate(frame, [s.from, s.from + 22], [40, 1600], { ...clamped, easing: ease });
  const centre = s.capital ? m.at(...s.capital) : [iw / 2, ih / 2];
  const ghost = k > 0 ? interpolate(frame, [s.from, s.from + 26], [0.8, 0], clamped) : 0;
  const before = k > 0 ? map.stops[k - 1] : null;
  const peakIn = s.peak ? interpolate(frame, [s.from + 30, s.from + 46], [0, 1], clamped) : 0;
  const gold = s.today ? interpolate(frame, [s.from, s.from + 34], [0, 1], { ...clamped, easing: ease }) : 0;
  const swell = (frame * 0.6) % 46;
  return (
    <div style={{ width: w, height: h, borderRadius: 40, padding: 4, background: `linear-gradient(120deg, ${ACCENT.turq}, ${ACCENT.violet} 55%, #ff4d8d)`, boxShadow: "0 0 60px rgba(23,212,164,.25), 0 40px 80px rgba(0,0,0,.5)" }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 36, overflow: "hidden", background: `radial-gradient(900px 900px at 50% 45%, ${SEA}, ${NAVY.deep})` }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(172deg, rgba(63,182,201,.05) 0 2px, transparent 2px 46px)", backgroundPosition: `${swell}px ${swell * 0.4}px` }} />
        <svg width={iw} height={ih} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <clipPath id={`${id}rv`}>
              <circle cx={centre[0]} cy={centre[1]} r={grow} />
            </clipPath>
            <filter id={`${id}gl`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
          </defs>
          <path d={m.d(GRATICULE)} fill="none" stroke="rgba(237,241,247,.06)" strokeWidth={1.2} />
          <path d={m.d(LAND)} fill={LANDC} stroke="rgba(237,241,247,.18)" strokeWidth={1.2} />
          <path d={m.d(BORDERS)} fill="none" stroke="rgba(237,241,247,.10)" strokeWidth={1.2} />
          {before && !before.today && ghost > 0 ? <path d={m.d(feat(before.geometry))} fill="none" stroke={ACCENT.turq} strokeWidth={3} strokeDasharray="12 10" opacity={ghost} /> : null}
          {!s.today ? (
            <g clipPath={`url(#${id}rv)`}>
              <path d={m.d(feat(s.geometry))} fill="rgba(23,212,164,.34)" />
              <path d={m.d(feat(s.geometry))} fill="none" stroke={ACCENT.turq} strokeWidth={12} opacity={0.5} filter={`url(#${id}gl)`} />
              <path d={m.d(feat(s.geometry))} fill="none" stroke={ACCENT.turq} strokeWidth={4} strokeLinejoin="round" />
              {s.peak && peakIn > 0 ? (
                <g opacity={peakIn}>
                  <path d={m.d(feat(s.peak))} fill="rgba(255,138,101,.32)" />
                  <path d={m.d(feat(s.peak))} fill="none" stroke={CORAL} strokeWidth={4} strokeDasharray="14 9" strokeLinejoin="round" />
                </g>
              ) : null}
            </g>
          ) : null}
          {/* today's Iran: a faint dashed reference under the past, drawn in gold at the end */}
          <path d={m.d(feat(map.today ?? IRAN.geometry))} fill="none" stroke="#edf1f7" strokeWidth={2} strokeDasharray="6 7" opacity={0.45 * (1 - gold)} />
          {gold > 0 ? (
            <g>
              <path d={m.d(feat(map.today ?? IRAN.geometry))} fill="rgba(232,197,106,.16)" opacity={gold} />
              <path d={m.d(feat(map.today ?? IRAN.geometry))} fill="none" stroke={GOLD} strokeWidth={14} opacity={0.5 * gold} filter={`url(#${id}gl)`} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - gold} />
              <path d={m.d(feat(map.today ?? IRAN.geometry))} fill="none" stroke={GOLD} strokeWidth={6} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - gold} />
            </g>
          ) : null}
          {s.capital && !s.today ? (
            <g opacity={interpolate(frame, [s.from + 16, s.from + 26], [0, 1], clamped)}>
              <circle cx={centre[0]} cy={centre[1]} r={14 + ((frame - s.from) % 40) * 0.9} fill="none" stroke={GOLD} strokeWidth={3} opacity={1 - ((frame - s.from) % 40) / 40} />
              <circle cx={centre[0]} cy={centre[1]} r={13} fill={GOLD} stroke={NAVY.deep} strokeWidth={4} />
            </g>
          ) : null}
        </svg>
        {/* light from above on the glass */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0) 30%)" }} />
      </div>
    </div>
  );
};
