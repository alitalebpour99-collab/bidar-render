// «سفر یک واژه»: one word travelling over the map, from its first form to the
// languages that took it, and home again. Each stop shows the word in its own
// script (Avestan, Greek, Latin, Persian) with what it meant there; the forms,
// glosses and sources are the episode's data (samples/word-1.json).
// Its own look: a night-teal sky, a map in deep teal, a mint trail that the
// camera follows from city to city, and amber for the word's return.
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadSerif } from "@remotion/google-fonts/NotoSerif";
import { loadFont as loadAvestan } from "@remotion/google-fonts/NotoSansAvestan";
import { BORDERS, GRATICULE, LAND, draw, mix, type View } from "./geo";
import { DESIGN_BOTTOM, DESIGN_TOP, FPS, Mark, RAIL, SIDE, Sfx, SourceLine, VAZIR, W, clamped, during, ease, fade, glide, grow, leave, rise, slam } from "./kit";
import type { WordProps, WordStop } from "./props";
import { Captions, Stage, beatAt } from "./Safe";

const { fontFamily: SERIF } = loadSerif("normal", { weights: ["400", "600"], subsets: ["latin", "latin-ext", "greek"] });
loadSerif("italic", { weights: ["400", "600"], subsets: ["latin", "latin-ext", "greek"] });
const { fontFamily: AVESTAN } = loadAvestan("normal", { weights: ["400"], subsets: ["avestan"] });

export const NIGHT = { sky: "#04191d", deep: "#020c0f", land: "#0f444b", land2: "#145560", ink: "#e9f6f4", muted: "#8fb8b3", mint: "#5fe0cf", amber: "#f2c46d", line: "rgba(233,246,244,.12)" };

// where the stop sits on the screen: under the card, over the captions
const CX = 540;
const CY = 1010;
// how wide a stop's view is, in degrees of longitude
const SPAN = 38;
const scaleOf = (deg: number) => W / ((deg * Math.PI) / 180);

const viewAt = ([lon, lat]: [number, number], deg = SPAN): View => ({ lon, lat, scale: scaleOf(deg) });
const far = (a: [number, number], b: [number, number]) => Math.hypot(a[0] - b[0], a[1] - b[1]);

type Leg = { from: [number, number]; to: [number, number]; at: number; len: number };

/** The camera: at the hook's home first, then from stop to stop, pulling back on a long hop. */
function camera(p: WordProps, frame: number): { v: View; legs: Leg[] } {
  const tl = p.tl!;
  const home = p.hookAt ?? p.stops[0].lonlat;
  const legs: Leg[] = [];
  let prev = home;
  for (const s of p.stops) {
    legs.push({ from: prev, to: s.lonlat, at: beatAt(tl, s.at).from, len: 40 });
    prev = s.lonlat;
  }
  // before the first stop the camera drifts from the hook's home toward the first stop
  const hookEnd = beatAt(tl, p.stops[0].at).from;
  if (frame < hookEnd) {
    const t = interpolate(frame, [0, hookEnd + 30], [0, 0.18], clamped);
    const v = mix(viewAt(home, SPAN * 0.85), viewAt(p.stops[0].lonlat), t);
    return { v, legs };
  }
  const k = legs.findLastIndex((l) => frame >= l.at);
  const leg = legs[k];
  const t = glide(frame, leg.at, leg.len);
  const d = far(leg.from, leg.to);
  // the farther the hop, the more the camera pulls back half-way
  const back = 1 + Math.min(1.6, d / 22) * Math.sin(Math.PI * t);
  const start = k === 0 ? mix(viewAt(home, SPAN * 0.85), viewAt(p.stops[0].lonlat), interpolate(leg.at, [0, hookEnd + 30], [0, 0.18], clamped)) : viewAt(leg.from);
  const v = mix(start, viewAt(leg.to), t);
  const inBeat = (frame - leg.at) / FPS;
  return { v: { ...v, scale: (v.scale / back) * (1 + 0.012 * Math.max(0, inBeat)) }, legs };
}

/** A curved hop between two screen points, bowed upward. */
const arc = (a: [number, number], b: [number, number]) => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.28;
  return { d: `M${a[0]} ${a[1]} Q${mx} ${my} ${b[0]} ${b[1]}`, at: (t: number): [number, number] => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * mx + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * my + t * t * b[1]] };
};

const Ground: React.FC<{ p: WordProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { v, legs } = camera(p, frame);
  const m = draw(v, CX, CY);
  const stars = useMemo(() => Array.from({ length: 70 }, (_, i) => ({ x: (Math.sin(i * 91.7) * 0.5 + 0.5) * W, y: (Math.sin(i * 37.3 + 1) * 0.5 + 0.5) * 1920, r: 1 + (i % 3) * 0.7, ph: i * 0.7 })), []);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1400px 1600px at 50% 52%, ${NIGHT.sky}, ${NIGHT.deep})` }}>
      <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="wglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={NIGHT.ink} opacity={0.12 + 0.12 * Math.sin(frame / 18 + s.ph)} />
        ))}
        <path d={m.d(GRATICULE)} fill="none" stroke="rgba(95,224,207,.06)" strokeWidth="1.2" />
        <path d={m.d(LAND)} fill={NIGHT.land} stroke="rgba(95,224,207,.32)" strokeWidth="1.5" />
        <path d={m.d(BORDERS)} fill="none" stroke="rgba(233,246,244,.08)" strokeWidth="1.1" />
        {/* the trail: each hop draws as the camera flies it, then stays */}
        {legs.slice(1).map((l, i) => {
          if (frame < l.at) return null;
          const a = arc(m.at(...l.from), m.at(...l.to));
          const t = glide(frame, l.at, l.len);
          const home = i === legs.length - 2;
          const color = home ? NIGHT.amber : NIGHT.mint;
          const head = a.at(t);
          return (
            <g key={i}>
              <path d={a.d} fill="none" stroke={color} strokeWidth="9" opacity=".35" filter="url(#wglow)" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} />
              <path d={a.d} fill="none" stroke={color} strokeWidth="3.4" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - t} />
              {t < 1 ? <circle cx={head[0]} cy={head[1]} r="11" fill={color} filter="url(#wglow)" /> : null}
              {t < 1 ? <circle cx={head[0]} cy={head[1]} r="6" fill="#fff" /> : null}
            </g>
          );
        })}
        {/* the cities the word reached */}
        {p.stops.map((s, i) => {
          const at = legs[i].at + (i === 0 ? 0 : legs[i].len - 6);
          if (frame < at) return null;
          const [x, y] = m.at(...s.lonlat);
          const ring = ((frame - at) % 50) / 50;
          const home = i === p.stops.length - 1;
          const color = home ? NIGHT.amber : NIGHT.mint;
          const left = x > 640;
          return (
            <g key={s.at} opacity={fade(frame, at, 6)}>
              <circle cx={x} cy={y} r={14 + ring * 40} fill="none" stroke={color} strokeWidth="2.4" opacity={0.8 * (1 - ring)} />
              <circle cx={x} cy={y} r="11" fill={color} stroke={NIGHT.deep} strokeWidth="3" />
              <text x={left ? x - 24 : x + 24} y={y + 12} textAnchor={left ? "end" : "start"} fill={NIGHT.ink} stroke={NIGHT.deep} strokeWidth="7" paintOrder="stroke" style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 34 }}>
                {s.place}
              </text>
            </g>
          );
        })}
      </svg>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${NIGHT.deep}f2 0%, ${NIGHT.deep}c4 22%, ${NIGHT.deep}00 40%, ${NIGHT.deep}00 66%, ${NIGHT.deep}cc 80%, ${NIGHT.deep}f5 100%)` }} />
    </AbsoluteFill>
  );
};

/** The word in its own script, revealed by a wipe in its own reading direction (Persian letters must stay joined). */
const Form: React.FC<{ s: WordStop; at: number; home: boolean }> = ({ s, at, home }) => {
  const frame = useCurrentFrame();
  const t = grow(frame, at + 4, 22);
  const rtl = s.script === "avestan" || s.script === "persian";
  const style: React.CSSProperties =
    s.script === "avestan"
      ? { fontFamily: AVESTAN, fontSize: 118, lineHeight: 1.5 }
      : s.script === "persian"
        ? { fontFamily: VAZIR, fontWeight: 900, fontSize: 190, lineHeight: 1.25 }
        : { fontFamily: SERIF, fontStyle: s.script === "latin" ? "italic" : "normal", fontWeight: 600, fontSize: s.form.length > 9 ? 124 : 146, lineHeight: 1.25 };
  const clip = rtl ? `inset(-20% 0 -20% ${(1 - t) * 100}%)` : `inset(-20% ${(1 - t) * 100}% -20% 0)`;
  return (
    <div style={{ direction: rtl ? "rtl" : "ltr", textAlign: "right", color: home ? NIGHT.amber : NIGHT.ink, clipPath: clip, whiteSpace: "nowrap", textShadow: `0 0 40px ${home ? "rgba(242,196,109,.35)" : "rgba(95,224,207,.25)"}`, ...style }}>{s.form}</div>
  );
};

export const Word: React.FC<WordProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const hook = beatAt(tl, p.beats[0].id);
  const closeId = p.beats[p.beats.length - 1].id;
  const close = beatAt(tl, closeId);
  const sourceFrom = tl.total - Math.round(2.6 * FPS);
  return (
    <Stage ground={<Ground p={p} />} tl={tl} music={p.music}>
      <Sfx at={0} name="hit" volume={0.4} />
      <Sfx at={1} name="chime" volume={0.18} />
      {p.stops.map((s, i) => (
        <React.Fragment key={s.at}>
          <Sfx at={beatAt(tl, s.at).from - 4} name={i === 0 ? "rise" : "whoosh"} />
          <Sfx at={beatAt(tl, s.at).from + (i === 0 ? 4 : 34)} name="chime" volume={i === p.stops.length - 1 ? 0.3 : 0.2} />
        </React.Fragment>
      ))}
      <Sfx at={close.from - 2} name="swish" />
      {p.stops.map((_, i) => (
        <Sfx key={`t${i}`} at={close.from + 16 + i * 7} name="tick" />
      ))}

      <Mark color={NIGHT.mint} sub={p.series} subColor={NIGHT.ink} />

      {/* the hook: the word everybody knows, big from the first frame */}
      <div style={{ position: "absolute", top: DESIGN_TOP + 140, right: SIDE, left: SIDE, direction: "rtl", opacity: leave(frame, hook.to + 4, 10), transform: `translateY(${-interpolate(frame, [hook.to - 6, hook.to + 4], [0, 60], clamped)}px)` }}>
        {p.hookWord ? (
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 600, fontSize: 176, lineHeight: 1.15, color: NIGHT.ink, direction: "ltr", textAlign: "right", letterSpacing: interpolate(frame, [0, hook.to], [6, 0], clamped), textShadow: "0 0 50px rgba(95,224,207,.3)" }}>{p.hookWord}</div>
        ) : null}
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 76, lineHeight: 1.4, color: NIGHT.ink, marginTop: 16 }}>{p.hook}</div>
        <div style={{ height: 8, marginTop: 20, width: `${interpolate(frame, [0, hook.to], [12, 58], clamped)}%`, background: NIGHT.mint, borderRadius: 4 }} />
      </div>

      {/* each stop: the language and the time, the form in its own script, how it is read, what it meant */}
      {p.stops.map((s, i) => {
        const { from, to } = beatAt(tl, s.at);
        const o = during(frame, from, to + 2, 9);
        if (o <= 0) return null;
        const home = i === p.stops.length - 1;
        return (
          <div key={s.at} style={{ position: "absolute", top: DESIGN_TOP + 130, right: SIDE, left: SIDE, direction: "rtl", opacity: o, transform: `translateY(${rise(frame, from, 50, 14) - interpolate(frame, [to - 8, to + 2], [0, 40], clamped)}px)` }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 18, fontFamily: VAZIR }}>
              <span style={{ fontWeight: 900, fontSize: 50, color: home ? NIGHT.amber : NIGHT.mint }}>{s.lang}</span>
              <span style={{ fontWeight: 500, fontSize: 34, color: NIGHT.muted }}>{s.when}</span>
            </div>
            <Form s={s} at={from} home={home} />
            {s.roman ? <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 48, color: NIGHT.muted, direction: "ltr", textAlign: "right", opacity: fade(frame, from + 24, 10), marginTop: -6 }}>{s.roman}</div> : null}
            <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 46, lineHeight: 1.5, color: NIGHT.ink, marginTop: 14, opacity: fade(frame, from + 50, 10), transform: `translateY(${rise(frame, from + 50, 24, 12)}px)` }}>
              <span style={{ color: home ? NIGHT.amber : NIGHT.mint }}>یعنی: </span>
              {s.gloss}
            </div>
          </div>
        );
      })}

      {/* the close: the whole road in one line, and the line to send it on */}
      {frame >= close.from ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 140, right: SIDE, left: SIDE, direction: "rtl", opacity: fade(frame, close.from, 10) }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px 10px", direction: "rtl" }}>
            {p.stops.map((s, i) => (
              <span key={s.at} style={{ display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
                <span style={{ padding: "6px 22px 10px", borderRadius: 30, border: `2px solid ${i === p.stops.length - 1 ? NIGHT.amber : "rgba(95,224,207,.55)"}`, background: "rgba(2,12,15,.6)", color: i === p.stops.length - 1 ? NIGHT.amber : NIGHT.ink, fontFamily: s.script === "persian" ? VAZIR : SERIF, fontStyle: s.script === "latin" ? "italic" : "normal", fontWeight: s.script === "persian" ? 900 : 600, fontSize: 40, direction: s.script === "persian" || s.script === "avestan" ? "rtl" : "ltr", opacity: fade(frame, close.from + 16 + i * 7, 6), transform: `scale(${slam(frame, close.from + 16 + i * 7, 1.4)})` }}>
                  {s.script === "avestan" ? s.roman ?? s.form : s.form}
                </span>
                {i < p.stops.length - 1 ? <span style={{ color: NIGHT.mint, fontFamily: VAZIR, fontSize: 40, opacity: fade(frame, close.from + 20 + i * 7, 6) }}>←</span> : null}
              </span>
            ))}
          </div>
          {p.cta ? <div style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 26, opacity: fade(frame, close.from + 54, 10), transform: `translateY(${rise(frame, close.from + 54, 30, 14)}px)` }}>
            <svg width="96" height="96" viewBox="0 0 24 24" style={{ flex: "none", transform: `translate(${-interpolate(frame, [close.from + 60, close.from + 100], [0, 26], { ...clamped, easing: ease })}px, ${-interpolate(frame, [close.from + 60, close.from + 100], [0, 14], { ...clamped, easing: ease })}px) rotate(-12deg)` }}>
              <path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z M10 13l4.5-4.5" fill="none" stroke={NIGHT.amber} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 62, lineHeight: 1.4, color: NIGHT.ink }}>{p.cta}</div>
          </div> : null}
        </div>
      ) : null}

      <Captions tl={tl} look={{ ink: NIGHT.ink, now: NIGHT.mint, band: "rgba(2,12,15,.7)", border: "1.5px solid rgba(95,224,207,.3)" }} bottom={DESIGN_BOTTOM - 168} />
      <SourceLine text={p.source} opacity={fade(frame, sourceFrom, 12)} color={NIGHT.muted} strong={NIGHT.mint} />
    </Stage>
  );
};
export { RAIL };
