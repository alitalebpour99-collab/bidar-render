// «مرزهای ایران، دوره به دوره»: the extents Bidar's historical atlas draws for
// each period (public/data/iran-eras.json of the site, historical-basemaps,
// approximate), one after another, and at the end today's border drawn in gold.
// Its own look: a lapis sea edge to edge, turquoise eras, gold for today, a
// stamp «گسترهٔ تقریبی» on every past line. The map moves from the first frame.
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BORDERS, GRATICULE, IRAN, LAND, draw, fit, mix, push, shapeOf, type View } from "./geo";
import { DESIGN_BOTTOM, DESIGN_TOP, FPS, Mark, RAIL, SIDE, Sfx, SourceLine, VAZIR, W, clamped, during, ease, fade, glide, grow, leave, rise, shake, slam } from "./kit";
import type { BordersProps, BordersStop } from "./props";
import { Captions, Stage, beatAt, beatNow } from "./Safe";

export const LAPIS = { sea: "#0a1a3f", deep: "#050d26", land: "#182c5e", land2: "#1f3770", ink: "#edf1f7", muted: "#9aaac8", gold: "#e8c56a", turq: "#3fb6c9", line: "rgba(237,241,247,.12)" };

// the map's centre on the screen: between the era's name above and the captions below
const CX = 540;
const CY = 940;
// how far the camera pushes in during a beat
const DRIFT = 0.045;

type Shot = { id: string; view: View; stop?: BordersStop };

function shots(p: BordersProps): Shot[] {
  const iranClose = fit(IRAN, 520, 420);
  const list: Shot[] = [{ id: p.beats[0].id, view: iranClose }];
  for (const b of p.beats.slice(1)) {
    const stop = p.stops.find((s) => s.at === b.id);
    if (stop) list.push({ id: b.id, view: stop.era === "today" ? fit(IRAN, 700, 560) : fit(shapeOf(stop.era), 1000, 720), stop });
    else list.push({ id: b.id, view: push(list[list.length - 1].view, 0.82) });
  }
  return list;
}

/** The camera at a frame: eased from the last beat's end into this beat's view, then drifting in. */
function camera(list: Shot[], tl: NonNullable<BordersProps["tl"]>, frame: number): View {
  const k = Math.max(0, list.findLastIndex((s) => frame >= beatAt(tl, s.id).from));
  const { from, to } = beatAt(tl, list[k].id);
  const inBeat = Math.min(1, (frame - from) / Math.max(1, to - from));
  if (k === 0) return push(list[0].view, 1.22 - 0.22 * inBeat * 1.4);
  const prev = push(list[k - 1].view, k - 1 === 0 ? 1.22 - 0.22 * 1.4 : 1 + DRIFT);
  const target = push(list[k].view, 1 + DRIFT * inBeat);
  return mix(prev, target, glide(frame, from, 34));
}

const Ground: React.FC<{ p: BordersProps; list: Shot[] }> = ({ p, list }) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const v = camera(list, tl, frame);
  const m = draw(v, CX, CY);
  const now = beatNow(tl, frame);
  const stops = p.stops;
  const todayStop = stops.find((s) => s.era === "today");
  const todayAt = todayStop ? beatAt(tl, todayStop.at).from : tl.total;
  const gold = grow(frame, todayAt + 8, 40);
  const waves = frame * 0.6;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1300px 1500px at 50% 46%, ${LAPIS.sea}, ${LAPIS.deep})` }}>
      {/* the sea moves: faint swell lines drifting */}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(172deg, rgba(63,182,201,.05) 0 2px, transparent 2px 46px)", backgroundPosition: `${waves}px ${waves * 0.4}px`, opacity: 0.8 }} />
      <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          {stops.map((s, i) => {
            const { from } = beatAt(tl, s.at);
            const c = s.capital ? m.at(...s.capital.lonlat) : [CX, CY];
            return (
              <clipPath key={i} id={`reveal-${i}`}>
                <circle cx={c[0]} cy={c[1]} r={interpolate(frame, [from + 2, from + 34], [30, 1700], { ...clamped, easing: ease })} />
              </clipPath>
            );
          })}
        </defs>
        <path d={m.d(GRATICULE)} fill="none" stroke="rgba(237,241,247,.05)" strokeWidth="1.2" />
        <path d={m.d(LAND)} fill={LAPIS.land} stroke="rgba(237,241,247,.16)" strokeWidth="1.2" />
        <path d={m.d(BORDERS)} fill="none" stroke="rgba(237,241,247,.10)" strokeWidth="1.2" />
        {stops.map((s, i) => {
          if (s.era === "today") return null;
          const { from, to } = beatAt(tl, s.at);
          const next = stops[i + 1] ? beatAt(tl, stops[i + 1].at) : null;
          const shown = frame >= from && frame < to;
          // the line before stays one beat as a dashed ghost, so the change is seen
          const ghost = !shown && next && frame >= next.from && frame < next.to ? interpolate(frame, [next.from, next.from + 20], [0.9, 0.5], clamped) : 0;
          if (!shown && !ghost) return null;
          const d = m.d(shapeOf(s.era));
          return (
            <g key={s.at}>
              {shown ? (
                <g clipPath={`url(#reveal-${i})`} opacity={leave(frame, to + 8, 14)}>
                  <path d={d} fill="rgba(63,182,201,.36)" stroke="none" />
                  <path d={d} fill="none" stroke={LAPIS.turq} strokeWidth="10" opacity=".55" filter="url(#glow)" />
                  <path d={d} fill="none" stroke={LAPIS.turq} strokeWidth="3.4" strokeLinejoin="round" />
                </g>
              ) : (
                <path d={d} fill="none" stroke={LAPIS.turq} strokeWidth="2.4" strokeDasharray="10 9" opacity={ghost} />
              )}
            </g>
          );
        })}
        {/* today's Iran: a faint reference line while the past is shown, then drawn in gold */}
        <path d={m.d(IRAN)} fill="none" stroke={LAPIS.ink} strokeWidth="1.6" strokeDasharray="5 6" opacity={(now === p.beats[0].id ? 0.75 : 0.32) * (1 - gold)} />
        {gold > 0 ? (
          <g>
            <path d={m.d(IRAN)} fill="rgba(232,197,106,.13)" opacity={gold} />
            <path d={m.d(IRAN)} fill="none" stroke={LAPIS.gold} strokeWidth="12" opacity={0.5 * gold} filter="url(#glow)" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - gold} />
            <path d={m.d(IRAN)} fill="none" stroke={LAPIS.gold} strokeWidth="5" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - gold} />
          </g>
        ) : null}
        {/* the capital of the beat */}
        {stops.map((s) => {
          if (!s.capital) return null;
          const { from, to } = beatAt(tl, s.at);
          const o = during(frame, from + 40, to + 4, 10);
          if (o <= 0) return null;
          const [x, y] = m.at(...s.capital.lonlat);
          const ring = ((frame - from - 40) % 45) / 45;
          const left = x > 700;
          return (
            <g key={`c-${s.at}`} opacity={o}>
              <circle cx={x} cy={y} r={12 + ring * 34} fill="none" stroke={LAPIS.gold} strokeWidth="2.4" opacity={1 - ring} />
              <circle cx={x} cy={y} r={10} fill={LAPIS.gold} stroke={LAPIS.deep} strokeWidth="3" />
              <text x={left ? x - 22 : x + 22} y={y + 11} textAnchor={left ? "end" : "start"} fill={LAPIS.ink} stroke={LAPIS.deep} strokeWidth="7" paintOrder="stroke" style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 32 }}>
                {s.capital.name}
              </text>
            </g>
          );
        })}
      </svg>
      {/* the names above and the captions below stay readable over any land */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${LAPIS.deep}f2 0%, ${LAPIS.deep}b8 17%, ${LAPIS.deep}00 33%, ${LAPIS.deep}00 66%, ${LAPIS.deep}cc 80%, ${LAPIS.deep}f5 100%)` }} />
    </AbsoluteFill>
  );
};

/** The stamp on every past line: these are not surveyed borders. */
const Stamp: React.FC<{ text: string; at: number; until: number }> = ({ text, at, until }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const s = slam(frame, at, 2.4);
  const o = Math.min(fade(frame, at, 3), leave(frame, until, 12));
  return (
    <div style={{ position: "absolute", left: SIDE - 6, top: 880, width: 250, height: 250, opacity: o, transform: `rotate(-13deg) scale(${s})` }}>
      <svg width="250" height="250" viewBox="0 0 250 250" style={{ position: "absolute", inset: 0 }}>
        <circle cx="125" cy="125" r="118" fill="rgba(5,13,38,.72)" stroke={LAPIS.gold} strokeWidth="5" />
        <circle cx="125" cy="125" r="104" fill="none" stroke={LAPIS.gold} strokeWidth="1.6" strokeDasharray="5 6" />
        <circle cx="125" cy="125" r="70" fill="none" stroke={LAPIS.gold} strokeWidth="1.4" opacity=".6" />
      </svg>
      <div style={{ position: "absolute", inset: 30, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: 40, lineHeight: 1.25, color: LAPIS.gold, direction: "rtl" }}>{text}</div>
    </div>
  );
};

/** The line of time: the stops from right (oldest) to left (today), a gold bead at the one shown. */
const TimeLine: React.FC<{ p: BordersProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const first = beatAt(tl, p.stops[0].at).from;
  const x0 = W - SIDE - 30;
  const x1 = SIDE + 30;
  const xs = p.stops.map((_, i) => x0 + ((x1 - x0) * i) / Math.max(1, p.stops.length - 1));
  const k = Math.max(0, p.stops.findLastIndex((s) => frame >= beatAt(tl, s.at).from));
  const prevX = xs[Math.max(0, k - 1)];
  const bead = frame < first ? x0 : prevX + (xs[k] - prevX) * glide(frame, beatAt(tl, p.stops[k].at).from, 26);
  const o = fade(frame, first - 4, 12);
  const y = 1160;
  return (
    <div style={{ position: "absolute", left: 0, top: y, width: W, height: 90, opacity: o }}>
      <svg width={W} height="90" style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} x2={x1} y1="20" y2="20" stroke="rgba(237,241,247,.28)" strokeWidth="3" />
        <line x1={x0} x2={bead} y1="20" y2="20" stroke={LAPIS.gold} strokeWidth="4" />
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy="20" r={i <= k && frame >= first ? 8 : 6} fill={i <= k && frame >= first ? LAPIS.gold : LAPIS.deep} stroke={i <= k && frame >= first ? LAPIS.gold : "rgba(237,241,247,.5)"} strokeWidth="2.5" />
        ))}
        <circle cx={bead} cy="20" r="14" fill={LAPIS.gold} opacity=".35" />
      </svg>
      {p.stops.map((s, i) => (
        <div key={s.at} style={{ position: "absolute", top: 40, left: xs[i] - 110, width: 220, textAlign: "center", fontFamily: VAZIR, fontWeight: i === k ? 800 : 500, fontSize: 27, color: i === k ? LAPIS.ink : LAPIS.muted, direction: "rtl", whiteSpace: "nowrap" }}>
          {s.tick}
        </div>
      ))}
    </div>
  );
};

export const Borders: React.FC<BordersProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const list = useMemo(() => shots(p), [p]);
  const hook = beatAt(tl, p.beats[0].id);
  const closeBeat = p.beats[p.beats.length - 1].id;
  const close = beatAt(tl, closeBeat);
  const firstStop = beatAt(tl, p.stops[0].at).from;
  const today = p.stops.find((s) => s.era === "today");
  const todayAt = today ? beatAt(tl, today.at).from : close.from;
  const stampAt = firstStop + 26;
  const sh = shake(frame, stampAt + 6, 9);
  const sourceFrom = tl.total - Math.round(2.6 * FPS);
  return (
    <Stage ground={<Ground p={p} list={list} />} tl={tl} music={p.music} offset={sh}>
      <Sfx at={0} name="hit" />
      {tl.order.slice(1).map((id) => (
        <Sfx key={id} at={beatAt(tl, id).from - 4} name="whoosh" />
      ))}
      <Sfx at={stampAt} name="stamp" />
      {today ? <Sfx at={todayAt + 8} name="draw" /> : null}
      {p.stops.filter((s) => s.capital).map((s) => (
        <Sfx key={`pop-${s.at}`} at={beatAt(tl, s.at).from + 40} name="pop" />
      ))}

      <Mark color={LAPIS.gold} sub={p.series} subColor={LAPIS.ink} />

      {/* the hook: readable on the very first frame, the map already moving under it */}
      <div style={{ position: "absolute", top: DESIGN_TOP + 150, right: SIDE, left: SIDE, direction: "rtl", opacity: leave(frame, hook.to + 4, 10), transform: `translateY(${-interpolate(frame, [hook.to - 6, hook.to + 4], [0, 50], clamped)}px)` }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 104, lineHeight: 1.3, color: LAPIS.ink }}>{p.hook}</div>
        <div style={{ height: 10, marginTop: 18, width: `${interpolate(frame, [0, hook.to], [18, 64], clamped)}%`, background: LAPIS.gold, borderRadius: 5 }} />
      </div>

      {/* the era shown: its years, its name, its line */}
      {p.stops.map((s) => {
        const { from, to } = beatAt(tl, s.at);
        const o = during(frame, from, to + 2, 9);
        if (o <= 0) return null;
        const isToday = s.era === "today";
        return (
          <div key={s.at} style={{ position: "absolute", top: DESIGN_TOP + 140, right: SIDE, left: SIDE, direction: "rtl", opacity: o, transform: `translateY(${rise(frame, from, 60, 16) - interpolate(frame, [to - 8, to + 2], [0, 40], clamped)}px)` }}>
            <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 46, color: isToday ? LAPIS.gold : LAPIS.turq, opacity: fade(frame, from + 4, 10) }}>{s.years}</div>
            <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 132, lineHeight: 1.2, color: LAPIS.ink, letterSpacing: 0 }}>{s.name}</div>
            {s.line ? (
              <div style={{ fontFamily: VAZIR, fontWeight: 500, fontSize: 38, lineHeight: 1.5, color: LAPIS.muted, marginTop: 6, opacity: fade(frame, from + 52, 12), transform: `translateX(${-rise(frame, from + 52, 30, 14)}px)` }}>{s.line}</div>
            ) : null}
          </div>
        );
      })}

      {/* the close: what the lines are, and what comes next */}
      {frame >= close.from ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 150, right: SIDE, left: SIDE, direction: "rtl", opacity: fade(frame, close.from, 10), transform: `translateY(${rise(frame, close.from, 50, 16)}px)` }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 44, color: LAPIS.turq }}>{p.series}</div>
          <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 84, lineHeight: 1.35, color: LAPIS.ink, marginTop: 6 }}>{p.close}</div>
        </div>
      ) : null}

      <Stamp text={p.stamp} at={stampAt} until={todayAt + 6} />
      <TimeLine p={p} />
      <Captions tl={tl} look={{ ink: LAPIS.ink, now: LAPIS.gold, band: "rgba(5,13,38,.66)", border: "1.5px solid rgba(232,197,106,.28)" }} bottom={DESIGN_BOTTOM - 168} />
      <SourceLine text={p.source} opacity={fade(frame, sourceFrom, 12)} color={LAPIS.muted} strong={LAPIS.gold} />
    </Stage>
  );
};

/** The Reel's length comes from its narrator (timeline.ts); this is the floor while nothing is known. */
export const bordersMin = 30 * FPS;
export { RAIL };
