// «شهرها در گذرِ دوره‌ها»: one city of the atlas (bidar lib/atlas/cities.ts) on a
// brass astrolabe. Its engraved rings turn into place; the atlas's periods
// before 1979 sit round the rim in order (the oldest at the top, onward to the
// left, as a Persian line runs); a brass index rides the limb from each period
// that held the city to the next, and its segment lights up, in gold where the
// city was a capital. The city's name stands in the middle; the period read
// by the index is written above, with its years. No map, no image: drawn
// rings and type only, light for GitHub's software GL (no blur, no filter).
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { DESIGN_TOP, FPS, Mark, SIDE, Sfx, SourceLine, VAZIR, W, clamped, ease, easeInOut, fade, glide, grow, leave, rise, seriesLine } from "./kit";
import type { CityProps } from "./props";
import { Captions, Stage, beatAt } from "./Safe";

/** The night and the brass (hue 225 of lib/social/hues.ts: a deep blue). */
export const BRASS = {
  night: "#0c1736",
  night2: "#050a1d",
  brass: "#c39a45",
  brass2: "#e6c473",
  brassDark: "#7c5c22",
  brassDeep: "#3c2c10",
  plate: "#132447",
  plate2: "#0b1630",
  lit: "#9cc2ff",
  litDeep: "#3f6fd6",
  gold: "#f2cf6e",
  ink: "#eef2fb",
  muted: "#9fb0d6",
};

const CX = 540;
const CY = 884;
/** the rings, from the outside in */
const R = { out: 408, limb: 376, seg: 372, segIn: 274, inner: 268, plate: 244 };

const rad = (deg: number) => (deg * Math.PI) / 180;
const pt = (r: number, deg: number): [number, number] => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];

/** A band of the ring between two radii and two angles (degrees, SVG's clockwise sense). */
function band(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = pt(r1, a0);
  const [x1, y1] = pt(r1, a1);
  const [x2, y2] = pt(r0, a1);
  const [x3, y3] = pt(r0, a0);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M${x0} ${y0}A${r1} ${r1} 0 ${large} ${sweep} ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${large} ${1 - sweep} ${x3} ${y3}Z`;
}

/** A period's name in at most two balanced lines, for its segment. */
function twoLines(name: string): string[] {
  const words = name.split(/\s+/).filter(Boolean);
  if (name.length <= 9 || words.length < 2) return [name];
  let best = 1;
  let diff = Infinity;
  for (let i = 1; i < words.length; i += 1) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (d < diff) {
      diff = d;
      best = i;
    }
  }
  return [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

const Ground: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, total], [42, 48]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 1500px at 50% ${y}%, #172a5c 0%, ${BRASS.night} 52%, ${BRASS.night2} 100%)` }}>
      {/* faint engraved circles far round the instrument, like the lines of a star chart */}
      <AbsoluteFill style={{ background: "repeating-radial-gradient(circle at 50% 44%, rgba(230,196,115,.035) 0 2px, transparent 2px 64px)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 44%, rgba(156,194,255,.10), rgba(0,0,0,0) 70%)" }} />
    </AbsoluteFill>
  );
};

/** The limb: a brass band with a scale of degrees, turning slowly once it has settled. */
const Limb: React.FC<{ turn: number }> = ({ turn }) => (
  <g transform={`rotate(${turn} ${CX} ${CY})`}>
    <circle cx={CX} cy={CY} r={(R.out + R.limb) / 2} fill="none" stroke="url(#brassRing)" strokeWidth={R.out - R.limb} />
    <circle cx={CX} cy={CY} r={R.out} fill="none" stroke={BRASS.brassDeep} strokeWidth="3" />
    <circle cx={CX} cy={CY} r={R.limb} fill="none" stroke={BRASS.brassDeep} strokeWidth="2.4" />
    {Array.from({ length: 120 }, (_, i) => {
      const a = i * 3;
      const major = i % 5 === 0;
      const [x0, y0] = pt(R.out - 3, a);
      const [x1, y1] = pt(R.out - (major ? 20 : 11), a);
      return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={BRASS.brassDeep} strokeWidth={major ? 2.6 : 1.4} opacity={major ? 0.9 : 0.7} />;
    })}
  </g>
);

/** The plate in the middle: deep blue, engraved with the circles and lines of an astrolabe's tympan. */
const Plate: React.FC<{ turn: number }> = ({ turn }) => (
  <g>
    <circle cx={CX} cy={CY} r={R.plate} fill="url(#plate)" />
    <g transform={`rotate(${turn} ${CX} ${CY})`} stroke="rgba(230,196,115,.16)" strokeWidth="1.6" fill="none">
      {[0.18, 0.36, 0.54, 0.72, 0.9].map((k, i) => (
        <circle key={`a${i}`} cx={CX} cy={CY + R.plate * 0.22 * (1 - k)} r={R.plate * k} />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const [x, y] = pt(R.plate, i * 30);
        return <line key={`l${i}`} x1={CX} y1={CY} x2={x} y2={y} opacity=".7" />;
      })}
      <circle cx={CX} cy={CY} r={R.plate * 0.62} strokeDasharray="4 7" />
    </g>
    <circle cx={CX} cy={CY} r={R.plate} fill="none" stroke={BRASS.brass} strokeWidth="3" />
  </g>
);

export const City: React.FC<CityProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const hook = beatAt(tl, "start");
  const note = beatAt(tl, "note");
  const endB = beatAt(tl, "end");
  const n = Math.max(1, p.periods.length);
  const step = 360 / n;
  // the oldest at the top, the next to its left (counter-clockwise on screen)
  const mid = (i: number) => -90 - (i + 0.5) * step;
  const held = p.periods.map((x, i) => ({ ...x, i })).filter((x) => x.held);
  const firstPeriod = held.length ? beatAt(tl, held[0].id).from : note.from;

  // the rings turn into place during the hook
  const settle = (from: number, len: number, by: number) => interpolate(frame, [from, from + len], [by, 0], { ...clamped, easing: easeInOut });
  const limbTurn = settle(0, 54, 64) + Math.max(0, frame - 54) * 0.03;
  const ringTurn = settle(4, 58, -82);
  const plateTurn = settle(8, 56, 40) - Math.max(0, frame - 64) * 0.02;
  // the instrument is there from the first frame, already turning
  const ringO = interpolate(frame, [0, 10], [0.88, 1], clamped);

  // the index on the limb: from period to period
  const now = held.findLastIndex((x) => frame >= beatAt(tl, x.id).from);
  const target = now >= 0 ? mid(held[now].i) : mid(held[0]?.i ?? 0) + 30;
  const prev = now > 0 ? mid(held[now - 1].i) : mid(held[0]?.i ?? 0) + 30;
  const moveFrom = now >= 0 ? beatAt(tl, held[now].id).from : 0;
  const indexAngle = prev + (target - prev) * glide(frame, moveFrom, 14);
  const indexO = fade(frame, firstPeriod - 10, 10);

  const labels = useMemo(() => p.periods.map((x) => twoLines(x.name)), [p.periods]);
  const reading = now >= 0 && frame < note.from ? held[now] : null;
  const sourceFrom = tl.total - Math.round(2.6 * FPS);
  const nameLines = twoLines(p.city.name).length > 1 && p.city.name.length > 10 ? twoLines(p.city.name) : [p.city.name];
  const nameSize = nameLines.length > 1 ? 74 : p.city.name.length > 6 ? 88 : 104;
  const glow = grow(frame, note.from + 4, 30);

  return (
    <Stage ground={<Ground total={tl.total} />} tl={tl} music={p.music}>
      <Sfx at={2} name="tick" volume={0.2} />
      <Sfx at={30} name="tick" volume={0.2} />
      <Sfx at={58} name="tick" volume={0.24} />
      {held.map((x) => (
        <React.Fragment key={x.id}>
          <Sfx at={beatAt(tl, x.id).from} name="tick" volume={0.2} />
          <Sfx at={beatAt(tl, x.id).from + 10} name="pop" volume={x.capital ? 0.28 : 0.16} />
        </React.Fragment>
      ))}
      <Sfx at={note.from + 2} name="rise" volume={0.2} />

      <Mark color={BRASS.brass2} sub={p.series} subColor={BRASS.muted} />

      {/* the hook, from the first frame, as the rings turn into place */}
      <div style={{ position: "absolute", top: DESIGN_TOP + 130, right: SIDE, left: SIDE, direction: "rtl", opacity: leave(frame, hook.to + 4, 10), transform: `translateY(${-interpolate(frame, [hook.to - 6, hook.to + 4], [0, 40], clamped)}px)` }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: (p.hook?.text ?? "").length > 34 ? 70 : 80, lineHeight: 1.28, color: BRASS.ink, textWrap: "balance" } as React.CSSProperties}>{p.hook?.text ?? p.city.name}</div>
        <div style={{ height: 8, marginTop: 14, width: `${interpolate(frame, [0, hook.to], [14, 56], clamped)}%`, background: BRASS.brass2, borderRadius: 4 }} />
      </div>

      {/* what the index reads: the period, its years, and «پایتخت» */}
      {held.map((x) => {
        const b = beatAt(tl, x.id);
        const until = Math.min(b.to, note.from);
        const o = Math.min(fade(frame, b.from, 8), leave(frame, until + 2, 8));
        if (o <= 0) return null;
        return (
          <div key={x.id} style={{ position: "absolute", top: DESIGN_TOP + 126, right: SIDE, left: SIDE, direction: "rtl", opacity: o, transform: `translateY(${rise(frame, b.from, 40, 14)}px)` }}>
            <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 30, color: BRASS.muted }}>{p.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
              <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: x.name.length > 13 ? 70 : 84, lineHeight: 1.25, color: BRASS.ink }}>{x.name}</span>
              {x.capital ? <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 34, color: BRASS.night2, background: BRASS.gold, borderRadius: 30, padding: "4px 22px", opacity: fade(frame, b.from + 10, 6) }}>{p.capitalLabel}</span> : null}
            </div>
            <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 44, color: x.capital ? BRASS.gold : BRASS.lit }}>{x.years}</div>
          </div>
        );
      })}
      {/* where the city is, in the atlas's words */}
      {frame >= note.from ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 126, right: SIDE, left: SIDE, direction: "rtl", opacity: fade(frame, note.from, 10), transform: `translateY(${rise(frame, note.from, 40, 14)}px)` }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 30, color: BRASS.muted }}>
            {p.label}: {p.count}
          </div>
          <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: `${p.city.name}، ${p.city.note}`.length > 18 ? 64 : 76, lineHeight: 1.25, color: BRASS.ink }}>
            {p.city.name}، {p.city.note}
          </div>
          {p.city.outside ? <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 38, color: BRASS.gold, marginTop: 4 }}>{p.city.outside}</div> : null}
        </div>
      ) : null}

      {/* the astrolabe */}
      <svg width={W} height={1400} style={{ position: "absolute", left: 0, top: 0, opacity: ringO, overflow: "visible" }}>
        <defs>
          <linearGradient id="brassRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0d58e" />
            <stop offset=".35" stopColor={BRASS.brass} />
            <stop offset=".65" stopColor="#a87e32" />
            <stop offset="1" stopColor="#6d4f1b" />
          </linearGradient>
          <linearGradient id="brassSeg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7d5f26" />
            <stop offset="1" stopColor="#4d3914" />
          </linearGradient>
          <radialGradient id="plate" cx="45%" cy="40%" r="70%">
            <stop offset="0" stopColor={BRASS.plate} />
            <stop offset="1" stopColor={BRASS.plate2} />
          </radialGradient>
          <radialGradient id="litSeg" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="#cfe1ff" />
            <stop offset="1" stopColor={BRASS.lit} />
          </radialGradient>
        </defs>
        {/* the throne (the hanging lug) at the top */}
        <g opacity={ringO}>
          <path d={`M${CX - 44} ${CY - R.out + 8}Q${CX} ${CY - R.out - 46} ${CX + 44} ${CY - R.out + 8}Z`} fill="url(#brassRing)" stroke={BRASS.brassDeep} strokeWidth="3" />
          <circle cx={CX} cy={CY - R.out - 30} r={11} fill={BRASS.brassDeep} stroke="url(#brassRing)" strokeWidth="5" />
        </g>
        <Limb turn={limbTurn} />
        {/* the ring of periods */}
        <g transform={`rotate(${ringTurn} ${CX} ${CY})`}>
          <circle cx={CX} cy={CY} r={(R.seg + R.segIn) / 2} fill="none" stroke="#2a1f0b" strokeWidth={R.seg - R.segIn + 4} />
          {p.periods.map((x, i) => {
            const a0 = -90 - i * step - 0.8;
            const a1 = -90 - (i + 1) * step + 0.8;
            // a period that never held the city stays dark (no lighting is timed for it)
            const at = x.held ? beatAt(tl, x.id).from + 6 : 0;
            const u = x.held ? interpolate(frame, [at, at + 12], [0, 1], { ...clamped, easing: ease }) : 0;
            const fill = x.capital ? BRASS.gold : "url(#litSeg)";
            return (
              <g key={x.id}>
                <path d={band(R.segIn, R.seg, a1, a0)} fill="url(#brassSeg)" stroke={BRASS.brassDeep} strokeWidth="1.6" />
                {u > 0 ? <path d={band(R.segIn + 3, R.seg - 3, a0 - (a0 - a1) * u, a0)} fill={fill} opacity={0.95} /> : null}
                {/* a capital: a small star engraved on the inner ring, beside its segment, clear of its name */}
                {x.capital && u >= 1 ? (
                  <g transform={`translate(${pt((R.inner + R.plate) / 2, mid(i))[0]} ${pt((R.inner + R.plate) / 2, mid(i))[1]})`}>
                    <rect x={-6} y={-6} width={12} height={12} fill={BRASS.gold} stroke={BRASS.brassDeep} strokeWidth="1.4" />
                    <rect x={-6} y={-6} width={12} height={12} fill={BRASS.gold} stroke={BRASS.brassDeep} strokeWidth="1.4" transform="rotate(45)" />
                  </g>
                ) : null}
              </g>
            );
          })}
          <circle cx={CX} cy={CY} r={R.seg} fill="none" stroke={BRASS.brass} strokeWidth="3" />
          <circle cx={CX} cy={CY} r={R.segIn} fill="none" stroke={BRASS.brass} strokeWidth="3" />
        </g>
        {/* the inner ring with the segments' divisions */}
        <circle cx={CX} cy={CY} r={(R.inner + R.plate) / 2} fill="none" stroke="url(#brassRing)" strokeWidth={R.inner - R.plate} />
        {p.periods.map((_, i) => {
          const [x0, y0] = pt(R.inner, -90 - i * step + ringTurn);
          const [x1, y1] = pt(R.plate + 2, -90 - i * step + ringTurn);
          return <line key={`d${i}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke={BRASS.brassDeep} strokeWidth="2.4" />;
        })}
        <Plate turn={plateTurn} />
        {/* the index riding the limb */}
        {indexO > 0 ? (
          <g opacity={indexO} transform={`rotate(${indexAngle + 90} ${CX} ${CY})`}>
            {/* its tip on the segment's outer edge: the name under it stays readable */}
            <path d={`M${CX} ${CY - R.seg - 1}L${CX - 20} ${CY - R.out - 22}L${CX + 20} ${CY - R.out - 22}Z`} fill={BRASS.brass2} stroke={BRASS.brassDeep} strokeWidth="3" strokeLinejoin="round" />
            <circle cx={CX} cy={CY - R.out - 10} r={6} fill={BRASS.brassDeep} />
          </g>
        ) : null}
        {/* the whole rim glows once every period has been read */}
        {glow > 0 ? <circle cx={CX} cy={CY} r={(R.seg + R.segIn) / 2} fill="none" stroke={BRASS.gold} strokeWidth={R.seg - R.segIn} opacity={0.08 * glow} /> : null}
      </svg>

      {/* the periods' names on their segments, upright */}
      {p.periods.map((x, i) => {
        const [lx, ly] = pt((R.seg + R.segIn) / 2, mid(i) + ringTurn);
        const at = x.held ? beatAt(tl, x.id).from + 8 : Infinity;
        const lit = frame >= at;
        const color = lit ? (x.capital ? "#3a2606" : "#0b1a3d") : x.held ? "#e9d39a" : "rgba(233,211,154,.55)";
        return (
          <div key={x.id} style={{ position: "absolute", left: lx - 76, top: ly - 40, width: 152, height: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", textAlign: "center", opacity: ringO, fontFamily: VAZIR, fontWeight: lit ? 900 : 700, fontSize: 24, lineHeight: 1.18, color }}>
            {labels[i].map((l, j) => (
              <span key={j} style={{ whiteSpace: "nowrap" }}>
                {l}
              </span>
            ))}
          </div>
        );
      })}

      {/* the city in the middle */}
      <div style={{ position: "absolute", left: CX - 230, top: CY - 150, width: 460, height: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", textAlign: "center", opacity: interpolate(frame, [0, 12], [0.85, 1], clamped) }}>
        {nameLines.map((l, i) => (
          <div key={i} style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: nameSize, lineHeight: 1.18, color: BRASS.ink, whiteSpace: "nowrap" }}>
            {l}
          </div>
        ))}
        <div style={{ width: 120, height: 3, background: BRASS.brass, margin: "16px 0 14px", opacity: 0.8 }} />
        <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 36, color: BRASS.gold, opacity: fade(frame, firstPeriod, 10) }}>{p.count}</div>
      </div>

      <Captions tl={tl} look={{ ink: BRASS.ink, now: BRASS.gold, band: "rgba(5,10,29,.78)", border: "1.5px solid rgba(230,196,115,.35)" }} bottom={1440} until={endB.from + 4} />
      <SourceLine text={p.source} opacity={fade(frame, sourceFrom, 12)} color={BRASS.muted} strong={BRASS.brass2} />
    </Stage>
  );
};

/** The city's tile: the brass rings on the night, the city's name in the middle, its count of periods. */
export const CityTile: React.FC<{ title: string; mark?: string; kicker?: string; series: string }> = ({ title, mark, kicker, series }) => {
  const top = (1920 - 1080) / 2;
  const cy = top + 560;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1100px 1200px at 50% 50%, #172a5c, ${BRASS.night2})`, direction: "rtl" }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="tileBrass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0d58e" />
            <stop offset=".5" stopColor={BRASS.brass} />
            <stop offset="1" stopColor="#6d4f1b" />
          </linearGradient>
        </defs>
        <circle cx={540} cy={cy} r={360} fill="none" stroke="url(#tileBrass)" strokeWidth="34" />
        <circle cx={540} cy={cy} r={300} fill="none" stroke="#3c2c10" strokeWidth="70" />
        {Array.from({ length: 14 }, (_, i) => {
          const a = rad(-90 - i * (360 / 14));
          return <line key={i} x1={540 + 265 * Math.cos(a)} y1={cy + 265 * Math.sin(a)} x2={540 + 335 * Math.cos(a)} y2={cy + 335 * Math.sin(a)} stroke={BRASS.brass} strokeWidth="3" />;
        })}
        <circle cx={540} cy={cy} r={258} fill={BRASS.plate2} stroke={BRASS.brass} strokeWidth="4" />
      </svg>
      <div style={{ position: "absolute", top: top + 70, right: 116, left: 116, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 38, color: BRASS.brass2 }}>{kicker ?? seriesLine(series)}</span>
        <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 28, color: BRASS.muted, direction: "ltr" }}>bidar.ahura.cloud</span>
      </div>
      <div style={{ position: "absolute", top: cy - 200, left: 290, right: 290, height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center" }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: title.length > 8 ? 78 : 104, lineHeight: 1.2, color: BRASS.ink, textWrap: "balance" } as React.CSSProperties}>{title}</div>
        {mark ? <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 40, color: BRASS.gold }}>{mark}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
