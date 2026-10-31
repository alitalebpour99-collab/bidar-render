// «پنج‌تایی»: five things of the site's pages, counted down from five to one.
// The first sample is «پنج دستاوردِ ایران برای جهان» (bidar lib/knowledge/
// gifts.ts, only the ones marked «واقعیت مستند»). A gallery at night: each
// item is a gold line drawing drawn on with the pen (an ice house, a squinch
// under a dome, the royal road with its stations, a vertical windmill whose
// blades turn, a qanat in section with its water running), a large numeral
// stamped in, the name, the site's own line and one figure. A gold blade wipes
// from one to the next. The close lists all five (a card worth keeping) and
// asks which one the viewer did not know; the last frames go back to the start.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { DESIGN_BOTTOM, DESIGN_TOP, FPS, Mark, RAIL, SIDE, Sfx, SourceLine, VAZIR, W, clamped, ease, easeInOut, fade, faDigits, grow, leave, rise, slam } from "./kit";
import type { Base } from "./props";
import { Stage, beatAt } from "./Safe";

/** `icon`: a drawing of the thing itself (the gifts), or «star» for an episode of people or places: no face, no picture of anyone. `tier` may be empty (no chip). */
export type FiveItem = { n: string; icon: "yakhchal" | "squinch" | "road" | "windmill" | "qanat" | "star"; name: string; line: string; figure: string; tier: string };
export type FiveProps = Omit<Base, "format" | "hook"> & {
  format: "five";
  hook: string;
  sub: string;
  items: FiveItem[];
  close: { q: string; a: string };
};

export const GALLERY = {
  deep: "#040917",
  night: "#0a1733",
  night2: "#11254d",
  gold: "#e8c56a",
  gold2: "#b8913f",
  ink: "#f5efe0",
  muted: "#9fb0d0",
  water: "#6fd3e8",
  chip: "#1c3a2c",
  chipInk: "#9fe3bf",
};

const Ground: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const a = 50 + 10 * Math.sin(frame / 90);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 1300px at ${a}% 40%, ${GALLERY.night2}, ${GALLERY.night} 45%, ${GALLERY.deep} 100%)` }}>
      {/* a faint lattice like a girih screen, drifting */}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(45deg, rgba(232,197,106,.035) 0 2px, transparent 2px 64px), repeating-linear-gradient(-45deg, rgba(232,197,106,.035) 0 2px, transparent 2px 64px)", backgroundPosition: `${frame * 0.4}px ${frame * 0.25}px` }} />
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,.6) 100%)", opacity: interpolate(frame, [0, total], [0.8, 1]) }} />
    </AbsoluteFill>
  );
};

// ---------- the line drawings (420 × 420, drawn on from `at`) ----------
type Draw = { at: number };
const stroke = (frame: number, at: number, len = 28) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - grow(frame, at, len) });
const G = { fill: "none", stroke: GALLERY.gold, strokeWidth: 4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** The ice house: a tall stepped cone, its door, the pit under it, the shade wall beside it. */
const Yakhchal: React.FC<Draw> = ({ at }) => {
  const frame = useCurrentFrame();
  const sparkle = (k: number) => 0.4 + 0.6 * Math.abs(Math.sin((frame + k * 13) / 11));
  return (
    <svg width={420} height={420} viewBox="0 0 420 420">
      <path d="M40 330 H380" {...G} {...stroke(frame, at, 14)} />
      <path d="M120 330 C 140 230, 170 120, 210 60 C 250 120, 280 230, 300 330" {...G} strokeWidth={5} {...stroke(frame, at + 4, 30)} />
      {[0, 1, 2, 3, 4].map((k) => {
        const y = 300 - k * 46;
        const half = 86 - k * 15;
        return <path key={k} d={`M${210 - half} ${y} Q 210 ${y - 10} ${210 + half} ${y}`} {...G} strokeWidth={2.5} opacity={0.7} {...stroke(frame, at + 12 + k * 3, 14)} />;
      })}
      <path d="M192 330 V300 A18 18 0 0 1 228 300 V330" {...G} {...stroke(frame, at + 18, 14)} />
      <path d="M150 330 V380 H270 V330" {...G} strokeDasharray="8 10" opacity={fade(frame, at + 24, 10) * 0.7} />
      <path d="M318 330 V180 H372 V330" {...G} strokeWidth={3} {...stroke(frame, at + 22, 18)} />
      {[[190, 362], [232, 368], [210, 350]].map(([x, y], k) => (
        <path key={k} d={`M${x - 8} ${y} H${x + 8} M${x} ${y - 8} V${y + 8}`} stroke={GALLERY.water} strokeWidth={3} strokeLinecap="round" opacity={fade(frame, at + 30, 8) * sparkle(k)} />
      ))}
    </svg>
  );
};

/** The squinch: a square room, the arches across its corners, the octagon and the dome on it. */
const Squinch: React.FC<Draw> = ({ at }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={420} height={420} viewBox="0 0 420 420">
      <path d="M70 360 V200 H350 V360" {...G} {...stroke(frame, at, 20)} />
      <path d="M40 360 H380" {...G} {...stroke(frame, at, 12)} />
      {/* the squinches: concentric arches in the two upper corners */}
      {[0, 1, 2].map((k) => (
        <React.Fragment key={k}>
          <path d={`M${70 + k * 8} 200 Q ${70 + k * 8} ${150 + k * 6} ${120 - k * 4} ${150 + k * 6}`} {...G} strokeWidth={3} {...stroke(frame, at + 10 + k * 3, 12)} />
          <path d={`M${350 - k * 8} 200 Q ${350 - k * 8} ${150 + k * 6} ${300 + k * 4} ${150 + k * 6}`} {...G} strokeWidth={3} {...stroke(frame, at + 10 + k * 3, 12)} />
        </React.Fragment>
      ))}
      {/* the octagon's ring, then the dome */}
      <path d="M120 150 H300" {...G} {...stroke(frame, at + 20, 10)} />
      <path d="M120 150 C 120 60, 300 60, 300 150" {...G} strokeWidth={5} {...stroke(frame, at + 24, 24)} />
      <path d="M210 72 V40" {...G} {...stroke(frame, at + 40, 8)} />
      {/* bricks, in courses, fading in */}
      {[0, 1, 2, 3].map((k) => (
        <path key={k} d={`M${70} ${232 + k * 32} H350`} stroke={GALLERY.gold2} strokeWidth={1.5} opacity={fade(frame, at + 30 + k * 2, 8) * 0.6} />
      ))}
      <path d="M180 360 V290 A30 30 0 0 1 240 290 V360" {...G} {...stroke(frame, at + 16, 14)} />
    </svg>
  );
};

/** The royal road: from one end to the other, its stations, a rider's light running along it. */
const Road: React.FC<Draw> = ({ at }) => {
  const frame = useCurrentFrame();
  const d = "M380 300 C 320 300, 300 210, 240 220 S 160 330, 100 250 S 60 140, 40 120";
  const run = interpolate(frame, [at + 30, at + 100], [0, 1], { ...clamped, easing: easeInOut });
  // the stations, at fixed points of the curve's length (approximate positions)
  const stations: [number, number][] = [
    [380, 300],
    [300, 262],
    [240, 220],
    [168, 300],
    [100, 250],
    [40, 120],
  ];
  return (
    <svg width={420} height={420} viewBox="0 0 420 420">
      <path d={d} {...G} strokeWidth={10} opacity={0.18} />
      <path d={d} {...G} strokeWidth={5} {...stroke(frame, at, 36)} />
      <path d={d} fill="none" stroke={GALLERY.ink} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={`0.05 1`} strokeDashoffset={-run * 0.95} opacity={frame >= at + 30 ? 1 : 0} />
      {stations.map(([x, y], k) => (
        <g key={k} opacity={fade(frame, at + 8 + k * 4, 6)}>
          <circle cx={x} cy={y} r={k === 0 || k === stations.length - 1 ? 14 : 9} fill={GALLERY.deep} stroke={GALLERY.gold} strokeWidth={4} />
        </g>
      ))}
    </svg>
  );
};

/** The vertical windmill of Nashtifan: the tall wall open to the wind, the axle, the blades turning. */
const Windmill: React.FC<Draw> = ({ at }) => {
  const frame = useCurrentFrame();
  const spin = Math.max(0, frame - (at + 26)) / 9;
  return (
    <svg width={420} height={420} viewBox="0 0 420 420">
      <path d="M40 370 H380" {...G} {...stroke(frame, at, 12)} />
      <path d="M90 370 V70 H130 V370" {...G} {...stroke(frame, at + 4, 22)} />
      <path d="M290 370 V70 H330 V370" {...G} {...stroke(frame, at + 6, 22)} />
      <path d="M130 90 H290 M130 330 H290" {...G} strokeWidth={3} {...stroke(frame, at + 14, 14)} />
      <path d="M210 60 V380" {...G} strokeWidth={3} {...stroke(frame, at + 18, 14)} />
      {/* the blades, as their edges seen turning round the axle */}
      {Array.from({ length: 6 }, (_, k) => {
        const a = spin + (k * Math.PI) / 3;
        const x = 210 + Math.sin(a) * 70;
        const front = Math.cos(a) > 0;
        return <rect key={k} x={x - 7} y={100} width={14} height={222} rx={4} fill={front ? GALLERY.gold : "none"} stroke={GALLERY.gold} strokeWidth={2} opacity={fade(frame, at + 22, 10) * (front ? 0.9 : 0.35)} />;
      })}
      {/* the wind */}
      {[0, 1, 2].map((k) => {
        const u = ((frame / 30 + k / 3) % 1 + 1) % 1;
        return <path key={k} d={`M${380 - u * 120} ${150 + k * 60} h-60`} stroke={GALLERY.muted} strokeWidth={3} strokeLinecap="round" opacity={fade(frame, at + 30, 10) * Math.sin(Math.PI * u) * 0.7} />;
      })}
    </svg>
  );
};

/** The qanat in section: the mountain, the shafts down to the gently falling tunnel, the water out in the plain. */
const Qanat: React.FC<Draw> = ({ at }) => {
  const frame = useCurrentFrame();
  const flow = (frame - at) / 40;
  return (
    <svg width={420} height={420} viewBox="0 0 420 420">
      {/* the ground: the mountain on the right (the source), the plain on the left */}
      <path d="M10 210 H120 C 200 200, 260 150, 330 80 L 410 40" {...G} {...stroke(frame, at, 26)} />
      {/* the water table under the mountain */}
      <path d="M300 300 C 340 290, 380 280, 410 270" stroke={GALLERY.water} strokeWidth={3} strokeDasharray="6 8" fill="none" opacity={fade(frame, at + 10, 10) * 0.8} />
      {/* the shafts, the mother well deepest */}
      {[
        [150, 205, 236],
        [200, 186, 246],
        [250, 158, 258],
        [300, 112, 272],
        [345, 74, 290],
      ].map(([x, top, bottom], k) => (
        <path key={k} d={`M${x} ${top} V${bottom}`} {...G} strokeWidth={3} {...stroke(frame, at + 12 + k * 3, 12)} />
      ))}
      {/* the tunnel, falling gently to the outlet */}
      <path d="M345 292 L 120 230" {...G} strokeWidth={6} {...stroke(frame, at + 26, 18)} />
      {/* the water in it, running toward the plain */}
      <path d="M345 292 L 120 230" fill="none" stroke={GALLERY.water} strokeWidth={4} strokeLinecap="round" pathLength={1} strokeDasharray="0.06 0.09" strokeDashoffset={flow} opacity={fade(frame, at + 40, 10)} />
      {/* the outlet and its stream across the plain */}
      <path d="M120 230 C 100 226, 80 222, 20 222" fill="none" stroke={GALLERY.water} strokeWidth={5} strokeLinecap="round" {...stroke(frame, at + 44, 16)} />
      {[40, 70, 96].map((x, k) => (
        <path key={k} d={`M${x} 210 v-26 m-10 10 l10 -10 l10 10`} {...G} strokeWidth={2.5} opacity={fade(frame, at + 54 + k * 3, 8)} />
      ))}
    </svg>
  );
};

/** An eight-pointed girih star (two squares turned on each other), drawn on line by line, its rosette turning slowly: for people and places. */
const Star: React.FC<Draw> = ({ at }) => {
  const frame = useCurrentFrame();
  const sq = (turn: number) => {
    const pts = [0, 1, 2, 3].map((k) => {
      const a = turn + (k * Math.PI) / 2;
      return `${(210 + 150 * Math.cos(a)).toFixed(1)} ${(210 + 150 * Math.sin(a)).toFixed(1)}`;
    });
    return `M${pts.join(" L")} Z`;
  };
  const spin = (frame - at) * 0.25;
  return (
    <svg width={420} height={420} viewBox="0 0 420 420">
      <path d={sq(Math.PI / 4)} {...G} strokeWidth={5} {...stroke(frame, at, 22)} />
      <path d={sq(0)} {...G} strokeWidth={5} {...stroke(frame, at + 8, 22)} />
      <circle cx={210} cy={210} r={92} {...G} strokeWidth={2.5} opacity={0.75} {...stroke(frame, at + 18, 18)} />
      <g transform={`rotate(${spin} 210 210)`} opacity={fade(frame, at + 26, 10)}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
          <path key={k} d="M210 150 Q 226 180 210 210 Q 194 180 210 150 Z" {...G} strokeWidth={2.5} transform={`rotate(${k * 45} 210 210)`} />
        ))}
      </g>
      <circle cx={210} cy={210} r={10} fill={GALLERY.gold} opacity={fade(frame, at + 30, 8)} />
    </svg>
  );
};

const ICONS: Record<string, React.FC<Draw>> = { yakhchal: Yakhchal, squinch: Squinch, road: Road, windmill: Windmill, qanat: Qanat, star: Star };

/** The opening: the title, and the five numbers in a row, «۱» still hidden. */
const Opening: React.FC<{ p: FiveProps; until: number; loop?: boolean }> = ({ p, until, loop }) => {
  const frame = useCurrentFrame();
  const out = loop ? 1 : leave(frame, until + 4, 8);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <div style={{ position: "absolute", top: DESIGN_TOP + 220, left: SIDE, right: SIDE, textAlign: "center", direction: "rtl", fontFamily: VAZIR, fontWeight: 900, fontSize: 112, lineHeight: 1.3, color: GALLERY.ink, textWrap: "balance", transform: `scale(${loop ? 1 : interpolate(frame, [0, 45], [1.05, 1], { ...clamped, easing: ease })})` } as React.CSSProperties}>
        {p.hook}
      </div>
      <div style={{ position: "absolute", top: DESIGN_TOP + 720, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 22, direction: "rtl" }}>
        {p.items.map((it, i) => {
          const last = i === p.items.length - 1;
          const at = loop ? -30 : -6 + i * 3;
          return (
            <div key={i} style={{ width: 150, height: 190, borderRadius: 22, border: `4px solid ${last ? GALLERY.gold : "rgba(232,197,106,.45)"}`, background: last ? "rgba(232,197,106,.12)" : "rgba(4,9,23,.5)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: 110, color: last ? GALLERY.gold : GALLERY.muted, transform: `scale(${slam(frame, at, 1.4)})`, opacity: fade(frame, at, 3), boxShadow: last ? `0 0 ${30 + 20 * Math.sin(frame / 6)}px rgba(232,197,106,.45)` : "none" }}>
              {last ? "؟" : it.n}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: DESIGN_TOP + 980, left: 0, right: 0, textAlign: "center", direction: "rtl", fontFamily: VAZIR, fontWeight: 800, fontSize: 58, color: GALLERY.gold, opacity: loop ? 1 : fade(frame, 18, 10) }}>{p.sub}</div>
    </div>
  );
};

export const Five: React.FC<FiveProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const start = beatAt(tl, "start");
  const beats = p.items.map((it) => beatAt(tl, `n${Number(it.n.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))))}`));
  const close = beatAt(tl, "end");
  const now = beats.findLastIndex((b) => frame >= b.from - 6);
  const loopFrom = tl.total - 14;
  const sourceFrom = close.from + 34;
  return (
    <Stage ground={<Ground total={tl.total} />} tl={tl} music={p.music}>
      <Sfx at={0} name="whoosh" volume={0.24} />
      {p.items.map((_, i) => (
        <Sfx key={`o${i}`} at={4 + i * 4} name="pop" volume={0.18} />
      ))}
      {beats.map((b, i) => (
        <React.Fragment key={i}>
          <Sfx at={b.from - 8} name="swish" volume={0.3} />
          <Sfx at={b.from} name="hit" volume={0.46} />
          <Sfx at={b.from + 6} name="draw" volume={0.3} />
          <Sfx at={b.from + 26} name="chime" volume={0.12} />
        </React.Fragment>
      ))}
      <Sfx at={close.from - 6} name="whoosh" volume={0.3} />

      <Mark color={GALLERY.gold} sub={p.series} subColor={GALLERY.muted} />

      {frame < beats[0].from + 8 ? <Opening p={p} until={beats[0].from - 4} /> : null}

      {/* where the count is: five slots, the current one lit */}
      {frame >= beats[0].from - 6 && frame < close.from + 10 ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 148, left: SIDE, right: SIDE, display: "flex", justifyContent: "space-between", alignItems: "center", direction: "rtl", opacity: Math.min(fade(frame, beats[0].from - 6, 8), leave(frame, close.from + 10, 10)) }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 38, color: GALLERY.ink }}>{p.hook}</div>
          <div style={{ display: "flex", gap: 10 }}>
            {p.items.map((it, i) => (
              <div key={i} style={{ width: 54, height: 54, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: 30, background: i === now ? GALLERY.gold : i < now ? "rgba(232,197,106,.25)" : "transparent", color: i === now ? GALLERY.deep : GALLERY.gold, border: `2px solid ${GALLERY.gold}` }}>
                {it.n}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* one item at a time */}
      {p.items.map((it, i) => {
        const b = beats[i];
        const next = beats[i + 1]?.from ?? close.from;
        if (frame < b.from - 8 || frame > next + 4) return null;
        const Icon = ICONS[it.icon] ?? Star;
        const out = leave(frame, next + 2, 8);
        const nameSize = it.name.length > 18 ? 86 : it.name.length > 10 ? 98 : 120;
        return (
          <div key={i} style={{ position: "absolute", inset: 0, opacity: out }}>
            {/* the numeral, stamped in, with its outline spreading */}
            <div style={{ position: "absolute", top: DESIGN_TOP + 230, right: SIDE - 20, width: 300, height: 420, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl" }}>
              <div style={{ position: "absolute", fontFamily: VAZIR, fontWeight: 900, fontSize: 400, lineHeight: 1, color: "transparent", WebkitTextStroke: `3px ${GALLERY.gold}`, opacity: interpolate(frame, [b.from, b.from + 16], [0.8, 0], clamped), transform: `scale(${interpolate(frame, [b.from, b.from + 16], [1, 1.5], clamped)})` }}>{it.n}</div>
              <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 400, lineHeight: 1, color: GALLERY.gold, textShadow: "0 18px 50px rgba(0,0,0,.5)", transform: `scale(${slam(frame, b.from, 2.2)})` }}>{it.n}</div>
            </div>
            {/* the drawing */}
            <div style={{ position: "absolute", top: DESIGN_TOP + 200, left: SIDE - 30, width: 620, height: 620, borderRadius: 60, background: "radial-gradient(circle at 50% 45%, rgba(232,197,106,.10), rgba(232,197,106,0) 70%)", display: "flex", alignItems: "center", justifyContent: "center", transform: `translateY(${rise(frame, b.from - 4, 30, 16)}px)` }}>
              <div style={{ transform: "scale(1.42)" }}>
                <Icon at={b.from + 4} />
              </div>
            </div>
            {/* the name, the site's line, the figure and its trust label */}
            <div style={{ position: "absolute", top: DESIGN_TOP + 860, left: SIDE, right: RAIL - 50, direction: "rtl" }}>
              <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: nameSize, lineHeight: 1.25, color: GALLERY.ink, opacity: fade(frame, b.from + 2, 6), transform: `translateY(${rise(frame, b.from + 2, 40, 14)}px)` }}>{it.name}</div>
              <div style={{ height: 6, width: `${42 * grow(frame, b.from + 6, 18)}%`, background: GALLERY.gold, borderRadius: 3, marginTop: 14 }} />
              <div style={{ fontFamily: VAZIR, fontWeight: 600, fontSize: it.line.length > 70 ? 50 : 56, lineHeight: 1.55, color: GALLERY.ink, marginTop: 26, opacity: fade(frame, b.from + 14, 10), transform: `translateY(${rise(frame, b.from + 14, 24, 14)}px)` }}>{it.line}</div>
              <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 34, flexWrap: "wrap", opacity: fade(frame, b.from + 26, 8), transform: `scale(${slam(frame, b.from + 26, 1.25)})`, transformOrigin: "100% 50%" }}>
                <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 46, color: GALLERY.deep, background: GALLERY.gold, borderRadius: 18, padding: "8px 26px 14px" }}>{it.figure}</span>
                {it.tier ? <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 30, color: GALLERY.chipInk, background: GALLERY.chip, borderRadius: 30, padding: "6px 20px 10px" }}>{it.tier}</span> : null}
              </div>
            </div>
          </div>
        );
      })}

      {/* the gold blade between two items */}
      {beats.slice(1).map((b, i) => {
        const t = frame - (b.from - 10);
        if (t < 0 || t > 14) return null;
        const x = interpolate(t, [0, 14], [W + 200, -600], { easing: easeInOut });
        return <div key={i} style={{ position: "absolute", top: -200, left: x, width: 260, height: 2400, background: `linear-gradient(90deg, rgba(232,197,106,0), ${GALLERY.gold} 40%, #fff4cf 50%, ${GALLERY.gold} 60%, rgba(232,197,106,0))`, transform: "rotate(12deg)", opacity: 0.85 }} />;
      })}

      {/* the close: all five, and the question */}
      {frame >= close.from - 6 ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 200, left: SIDE, right: SIDE, direction: "rtl", opacity: Math.min(fade(frame, close.from - 6, 10), leave(frame, loopFrom + 6, 8)) }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 64, color: GALLERY.gold, textAlign: "center", marginBottom: 34 }}>{p.hook}</div>
          {[...p.items].reverse().map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 26, padding: "16px 26px 20px", marginBottom: 16, borderRadius: 24, background: "rgba(245,239,224,.06)", border: "2px solid rgba(232,197,106,.3)", opacity: fade(frame, close.from + i * 4, 8), transform: `translateX(${-rise(frame, close.from + i * 4, 60, 14)}px)` }}>
              <span style={{ width: 82, height: 82, borderRadius: 41, flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: GALLERY.gold, color: GALLERY.deep, fontFamily: VAZIR, fontWeight: 900, fontSize: 52 }}>{it.n}</span>
              <span style={{ flex: 1, fontFamily: VAZIR, fontWeight: 800, fontSize: 46, color: GALLERY.ink }}>{it.name}</span>
              <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 30, color: GALLERY.muted, textAlign: "left" }}>{it.figure}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
            <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "22px 46px 28px", borderRadius: 40, background: GALLERY.gold, color: GALLERY.deep, fontFamily: VAZIR, fontWeight: 900, transform: `scale(${slam(frame, close.from + 24, 1.3)})`, opacity: fade(frame, close.from + 24, 4) }}>
              <span style={{ fontSize: 52 }}>{p.close.q}</span>
              <span style={{ fontSize: 38, fontWeight: 800 }}>{p.close.a}</span>
            </div>
          </div>
        </div>
      ) : null}

      <SourceLine text={p.source} opacity={Math.min(fade(frame, sourceFrom, 12), leave(frame, loopFrom + 6, 8))} color="rgba(245,239,224,.7)" strong={GALLERY.gold} y={DESIGN_BOTTOM - 150} />

      {/* the loop: back to the opening */}
      {frame >= loopFrom ? (
        <div style={{ position: "absolute", inset: 0, opacity: fade(frame, loopFrom, 12) }}>
          <Opening p={p} until={start.to} loop />
        </div>
      ) : null}
    </Stage>
  );
};
