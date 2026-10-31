// «پرچم‌های ایران»: one flag of the site's /iran/flags as a vexillologist's
// technical drawing. A drafting sheet (a fine olive grid), the flag's frame,
// its centre lines and dimension lines drawn first; then the flag is built
// from the site's own picture, layer by layer in the file's order
// (src/data/flags.json, sync-data.mjs): the field wipes in, each stripe after
// it while the colour swatches come up with their names and codes as the site
// gives them, and a compass sweeps the emblem in. A reconstruction is stamped
// «بازسازیِ تقریبی» in the site's contested amber; a documented flag gets the
// site's trust label. At the end the finished flag waves gently on its pole.
// Kept light for GitHub's software GL: no map, no blur, no filter.
import React, { useMemo } from "react";
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import flagsJson from "./data/flags.json";
import { DESIGN_TOP, FPS, Mark, SIDE, Sfx, SourceLine, VAZIR, W, clamped, ease, fade, glide, grow, leave, noDot, rise, seriesLine, shake, slam } from "./kit";
import type { FlagProps } from "./props";
import { Captions, Stage, beatAt } from "./Safe";

type FlagLayer = { kind: "field" | "stripe" | "emblem"; svg: string; box?: number[] };
type FlagFile = { box: number[]; defs: string; layers: FlagLayer[] };
const FLAGS = flagsJson as unknown as Record<string, FlagFile>;

/** The drafting sheet (hue 105 of lib/social/hues.ts: olive). */
export const SHEET = {
  paper: "#f1f0e2",
  paper2: "#e2e1cb",
  grid: "rgba(104,118,38,.10)",
  grid2: "rgba(104,118,38,.24)",
  ink: "#262a1c",
  ink2: "#4f553a",
  olive: "#66751c",
  olive2: "#93a23a",
  /** the site's contested amber, darkened to read on paper */
  amber: "#a8740f",
  /** the site's verified green, darkened to read on paper */
  green: "#23885a",
};

/** The site's picture of the flag, by the file the props name. */
export function flagFile(file: string): FlagFile {
  const name = String(file).split("/").pop() ?? "";
  const f = FLAGS[name];
  if (!f) throw new Error(`the flag's picture «${name}» is not in this bundle (node sync-data.mjs <bidar>)`);
  return f;
}

/** The whole flag as one picture (for the waving cloth): the site's SVG, as it is. */
const asImage = (f: FlagFile) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f.box.join(" ")}" preserveAspectRatio="none">${f.defs}${f.layers.map((l) => l.svg).join("")}</svg>`)}`;

// the drawing on the design frame: its middle, the largest box it may fill, and the column it
// shares with the swatches and the emblem's line, between the title and the captions
const CX = 540;
const MAX_W = 860;
const MAX_H = 520;
/** (it ends above where a caption of two lines begins) */
const COLUMN = { top: 466, bottom: 1250 };
/** below the flag: the swatches, then the emblem's line */
const SWATCH_GAP = 66;
const LEGEND_GAP = 130;

/** A wedge from the top, clockwise, of `deg` degrees, in the flag's own units: the compass's sweep. */
function sector(cx: number, cy: number, r: number, deg: number): string {
  if (deg >= 359.9) return `M${cx - r} ${cy - r}h${2 * r}v${2 * r}h${-2 * r}z`;
  const a = ((deg - 90) * Math.PI) / 180;
  const x = cx + r * Math.cos(a);
  const y = cy + r * Math.sin(a);
  return `M${cx} ${cy}L${cx} ${cy - r}A${r} ${r} 0 ${deg > 180 ? 1 : 0} 1 ${x} ${y}Z`;
}

const Ground: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, total], [0, 24]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1300px 1600px at 50% 42%, ${SHEET.paper} 0%, #ebeada 60%, ${SHEET.paper2} 100%)` }}>
      {/* the drafting grid: a fine line every 24 px, a strong one every 120 */}
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${SHEET.grid} 1px, transparent 1px), linear-gradient(90deg, ${SHEET.grid} 1px, transparent 1px), linear-gradient(${SHEET.grid2} 1.5px, transparent 1.5px), linear-gradient(90deg, ${SHEET.grid2} 1.5px, transparent 1.5px)`, backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px", backgroundPosition: `${drift}px ${drift * 0.6}px` }} />
      <AbsoluteFill style={{ background: "radial-gradient(1300px 1700px at 50% 46%, transparent 62%, rgba(80,86,40,.22) 100%)" }} />
    </AbsoluteFill>
  );
};

/** An arrowhead at (x, y) pointing along angle `a` (radians). */
const arrow = (x: number, y: number, a: number, s = 14) => `M${x} ${y}L${x - s * Math.cos(a - 0.38)} ${y - s * Math.sin(a - 0.38)}M${x} ${y}L${x - s * Math.cos(a + 0.38)} ${y - s * Math.sin(a + 0.38)}`;

/** The construction drawn before the flag: its frame, centre lines, diagonals, dimension lines, the stripe divisions. */
const Construction: React.FC<{ x: number; y: number; w: number; h: number; cuts: number[]; at: { draw: number; dims: number; fadeOut: number } }> = ({ x, y, w, h, cuts, at }) => {
  const frame = useCurrentFrame();
  const draw = grow(frame, at.draw, 34);
  const dims = grow(frame, at.dims, 26);
  const o = interpolate(frame, [at.fadeOut, at.fadeOut + 14], [1, 0], clamped);
  if (o <= 0) return null;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const top = y - 52;
  const right = x + w + 54;
  const len = (a: number) => ({ pathLength: 1, strokeDasharray: "1 1", strokeDashoffset: 1 - a });
  return (
    <svg width={W} height={1400} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: o }}>
      {/* the frame of the flag, in graphite */}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke={SHEET.ink} strokeWidth="2.4" {...len(draw)} />
      {/* centre lines, dash-dot, past the frame */}
      <path d={`M${x - 46} ${cy}H${x + w + 46}`} stroke={SHEET.olive} strokeWidth="1.8" strokeDasharray="22 7 3 7" opacity={draw} fill="none" />
      <path d={`M${cx} ${y - 30}V${y + h + 30}`} stroke={SHEET.olive} strokeWidth="1.8" strokeDasharray="22 7 3 7" opacity={draw} fill="none" />
      {/* the diagonals, faint */}
      <path d={`M${x} ${y}L${x + w} ${y + h}M${x + w} ${y}L${x} ${y + h}`} stroke={SHEET.olive} strokeWidth="1.1" opacity={0.45 * draw} fill="none" {...len(draw)} />
      {/* the width above, the height on the right, with extension lines and arrows */}
      <g opacity={dims} stroke={SHEET.ink2} strokeWidth="1.8" fill="none">
        <path d={`M${x} ${y - 8}V${top - 12}M${x + w} ${y - 8}V${top - 12}`} />
        <path d={`M${x + w / 2} ${top}H${x + w / 2 - (w / 2) * dims}M${x + w / 2} ${top}H${x + w / 2 + (w / 2) * dims}`} />
        {dims > 0.95 ? <path d={`${arrow(x, top, Math.PI)}${arrow(x + w, top, 0)}`} /> : null}
        <path d={`M${x + w + 8} ${y}H${right + 12}M${x + w + 8} ${y + h}H${right + 12}`} />
        <path d={`M${right} ${cy}V${cy - (h / 2) * dims}M${right} ${cy}V${cy + (h / 2) * dims}`} />
        {dims > 0.95 ? <path d={`${arrow(right, y, -Math.PI / 2)}${arrow(right, y + h, Math.PI / 2)}`} /> : null}
        {/* where the stripes divide the height */}
        {cuts.map((c, i) => (
          <path key={i} d={`M${right - 10} ${y + c}H${right + 10}M${x + w + 8} ${y + c}H${right - 14}`} strokeDasharray="4 5" opacity={fade(frame, at.dims + 18 + i * 5, 8)} />
        ))}
      </g>
      {/* small circles where the centre lines cross the frame */}
      {[
        [cx, y],
        [cx, y + h],
        [x, cy],
        [x + w, cy],
      ].map(([a, b], i) => (
        <circle key={i} cx={a} cy={b} r={5} fill={SHEET.paper} stroke={SHEET.olive} strokeWidth="1.8" opacity={draw} />
      ))}
    </svg>
  );
};

/** The compass that draws the emblem in: its needle at the centre, its pencil on the circle, sweeping round once. */
const Compass: React.FC<{ cx: number; cy: number; r: number; turn: number; o: number }> = ({ cx, cy, r, turn, o }) => {
  const a = ((turn - 90) * Math.PI) / 180;
  const px = cx + r * Math.cos(a);
  const py = cy + r * Math.sin(a);
  // the hinge stands above the middle of the two points
  const mx = (cx + px) / 2;
  const my = (cy + py) / 2;
  const hx = mx + (-(py - cy) / r) * r * 0.08;
  const hy = my - r * 0.62;
  return (
    <svg width={W} height={1400} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: o }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={SHEET.olive} strokeWidth="2" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, turn / 360)} transform={`rotate(-90 ${cx} ${cy})`} />
      <path d={`M${cx} ${cy}L${hx} ${hy}L${px} ${py}`} fill="none" stroke="#3a3e2c" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${cx} ${cy}L${hx} ${hy}L${px} ${py}`} fill="none" stroke="#b9bfa3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
      <circle cx={hx} cy={hy} r={11} fill="#3a3e2c" stroke="#b9bfa3" strokeWidth="2" />
      <rect x={hx - 5} y={hy - 38} width={10} height={28} rx={4} fill="#3a3e2c" />
      <circle cx={cx} cy={cy} r={4} fill={SHEET.ink} />
      <circle cx={px} cy={py} r={5} fill={SHEET.olive} />
    </svg>
  );
};

/** The site's stamp on a reconstruction, or its trust label on a documented flag. */
const Stamp: React.FC<{ text: string; color: string; at: number; size: number }> = ({ text, color, at, size }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const s = slam(frame, at, 2.3);
  const words = text.split(/\s+/);
  return (
    <div style={{ width: size, height: size, position: "relative", opacity: fade(frame, at, 3), transform: `rotate(-12deg) scale(${s})` }}>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ position: "absolute", inset: 0 }}>
        <circle cx="100" cy="100" r="94" fill="rgba(241,240,226,.82)" stroke={color} strokeWidth="6" />
        <circle cx="100" cy="100" r="82" fill="none" stroke={color} strokeWidth="2" strokeDasharray="5 5" />
      </svg>
      <div style={{ position: "absolute", inset: size * 0.17, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", direction: "rtl", fontFamily: VAZIR, fontWeight: 900, fontSize: size * (words.length > 1 ? 0.16 : 0.19), lineHeight: 1.25, color }}>{text}</div>
    </div>
  );
};

/** The finished flag on its pole, waving: the site's picture cut in narrow strips, each lifted on a travelling wave and shaded by its slope. */
const Waving: React.FC<{ src: string; w: number; h: number; from: number }> = ({ src, w, h, from }) => {
  const frame = useCurrentFrame();
  // strips on whole pixels, each a pixel wider than its share, so no seam of the paper shows between them
  const n = Math.max(24, Math.round(w / 13));
  const sw = w / n;
  const edge = (i: number) => Math.round(i * sw);
  const full = h * 0.045;
  const amp = interpolate(frame, [from, from + 24], [0, full], { ...clamped, easing: ease });
  const t = (frame - from) / FPS;
  // the pole is on the right (a Persian flag is read from the right): the cloth is held there and moves most at the far end
  const at = (e: number) => {
    const d = 1 - e / w;
    const ph = d * Math.PI * 2.2 - t * 3.1;
    return { dy: amp * d * Math.sin(ph), shade: Math.cos(ph) * Math.min(1, d * 1.6) * (amp / full) * 0.15 };
  };
  const tint = (s: number) => (s > 0 ? `rgba(255,255,240,${s.toFixed(3)})` : `rgba(20,24,10,${(-s * 1.3).toFixed(3)})`);
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      {Array.from({ length: n }, (_, i) => {
        const l = edge(i);
        const r = edge(i + 1);
        const a = at(l);
        const b = at(r);
        const m = at((l + r) / 2);
        return (
          <div key={i} style={{ position: "absolute", left: l, top: 0, width: r - l + 1, height: h, overflow: "hidden", transform: `translateY(${m.dy.toFixed(1)}px)` }}>
            <div style={{ position: "absolute", left: -l, top: 0, width: Math.round(w), height: h, backgroundImage: `url("${src}")`, backgroundSize: `${Math.round(w)}px ${h}px` }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${tint(a.shade)}, ${tint(b.shade)})` }} />
          </div>
        );
      })}
    </div>
  );
};

export const Flag: React.FC<FlagProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const f = p.flag;
  const file = useMemo(() => flagFile(f.file), [f.file]);
  const src = useMemo(() => asImage(file), [file]);
  const [bx, by, bw, bh] = file.box;
  const k = Math.min(MAX_W / bw, MAX_H / bh);
  const w = bw * k;
  const h = bh * k;
  const x = CX - w / 2;
  // a wide flag is short: the whole column moves down so it sits a little above the middle
  const block = h + SWATCH_GAP + LEGEND_GAP + 64;
  const y = COLUMN.top + Math.max(0, (COLUMN.bottom - COLUMN.top - block) * 0.42);
  const CY = y + h / 2;

  const hook = beatAt(tl, "start");
  const fieldB = beatAt(tl, "field");
  const colorsB = beatAt(tl, "colors");
  const emblemB = beatAt(tl, "emblem");
  const stampB = beatAt(tl, "stamp");
  const endB = beatAt(tl, "end");
  const meaningFrom = beatAt(tl, "m1").from;

  // the layers: the field first (or, without one, the first stripe), the stripes one after another, the emblem by the compass
  const fields = file.layers.filter((l) => l.kind === "field");
  const stripes = file.layers.filter((l) => l.kind === "stripe");
  const emblem = file.layers.filter((l) => l.kind === "emblem");
  const firstOnField = fields.length ? null : stripes[0] ?? null;
  const later = stripes.filter((s) => s !== firstOnField);
  const fieldAt = fieldB.from + 6;
  const stripeAt = (i: number) => colorsB.from + 8 + i * Math.max(10, Math.min(18, (colorsB.to - colorsB.from - 30) / Math.max(1, later.length)));
  const sweepFrom = emblemB.from + 6;
  const sweepLen = Math.max(30, Math.min(48, emblemB.to - emblemB.from - 10));
  const turn = interpolate(frame, [sweepFrom, sweepFrom + sweepLen], [0, 360], { ...clamped, easing: ease });
  const compassO = Math.min(fade(frame, sweepFrom - 8, 8), leave(frame, sweepFrom + sweepLen + 14, 12));
  // where the stripes divide the height (the construction's ticks)
  const cuts = [...new Set(stripes.flatMap((s) => (s.box ? [s.box[1] - by, s.box[1] + s.box[3] - by] : [])).filter((c) => c > 1 && c < bh - 1).map((c) => Math.round(c * k)))];
  const waveAt = endB.from;
  const flat = interpolate(frame, [waveAt + 4, waveAt + 16], [1, 0], clamped);
  const wave = 1 - flat;
  // a slow push into the finished drawing while its meaning is said
  const push = interpolate(frame, [meaningFrom, endB.from], [1, 1.035], clamped);

  /** One layer of the site's picture, revealed from the right (a Persian hand starts there). */
  const layer = (l: FlagLayer, i: number, at: number, len = 16) => {
    const u = interpolate(frame, [at, at + len], [0, 1], { ...clamped, easing: ease });
    if (u <= 0) return null;
    return (
      <svg key={i} viewBox={`${bx} ${by} ${bw} ${bh}`} width={w} height={h} preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: 0, clipPath: `inset(0 0 0 ${(1 - u) * 100}%)` }} dangerouslySetInnerHTML={{ __html: file.defs + l.svg }} />
    );
  };
  const r = Math.min(bw, bh) * 0.42;
  const emblemSvg = (
    <svg viewBox={`${bx} ${by} ${bw} ${bh}`} width={w} height={h} preserveAspectRatio="none" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <clipPath id="flag-sweep">
          <path d={sector(bx + bw / 2, by + bh / 2, Math.hypot(bw, bh), turn)} />
        </clipPath>
      </defs>
      <g clipPath="url(#flag-sweep)" dangerouslySetInnerHTML={{ __html: file.defs + emblem.map((l) => l.svg).join("") }} />
    </svg>
  );
  const stampColor = f.approx ? SHEET.amber : SHEET.green;
  const stampText = f.approx ? f.approx.stamp : f.tierLabel;
  const stampAt = stampB.from + 6;
  const sh = shake(frame, stampAt + 6, 7);
  const sourceFrom = tl.total - Math.round(2.6 * FPS);
  const titleIn = fieldB.from;
  const hookText = p.hook?.text ?? f.name;

  return (
    <Stage ground={<Ground total={tl.total} />} tl={tl} music={p.music} offset={sh}>
      <Img src={src} style={{ position: "absolute", width: 2, height: 2, opacity: 0 }} />
      <Sfx at={2} name="draw" volume={0.22} />
      <Sfx at={fieldAt} name="draw" />
      {later.map((_, i) => (
        <Sfx key={`s${i}`} at={stripeAt(i)} name="draw" volume={0.22} />
      ))}
      {f.colors.map((_, i) => (
        <Sfx key={`c${i}`} at={colorsB.from + 10 + i * 9} name="pop" volume={0.18} />
      ))}
      <Sfx at={sweepFrom} name="swish" />
      <Sfx at={stampAt} name="stamp" />
      <Sfx at={waveAt + 4} name="whoosh" volume={0.18} />

      <Mark color={SHEET.olive} sub={p.series} subColor={SHEET.ink2} />

      {/* the hook, from the first frame, over the empty drawing */}
      <div style={{ position: "absolute", top: DESIGN_TOP + 130, right: SIDE, left: SIDE, direction: "rtl", opacity: leave(frame, hook.to + 4, 10), transform: `translateY(${-interpolate(frame, [hook.to - 6, hook.to + 4], [0, 40], clamped)}px)` }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: hookText.length > 30 ? 76 : 88, lineHeight: 1.3, color: SHEET.ink, textWrap: "balance" } as React.CSSProperties}>{hookText}</div>
        <div style={{ height: 8, marginTop: 14, width: `${interpolate(frame, [0, hook.to], [14, 56], clamped)}%`, background: SHEET.olive, borderRadius: 4 }} />
      </div>

      {/* the sheet's title: the series and its number, the flag's name and years */}
      {frame >= titleIn - 2 ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 122, right: SIDE, left: SIDE, direction: "rtl", opacity: fade(frame, titleIn, 10), transform: `translateY(${rise(frame, titleIn, 40, 16)}px)` }}>
          {/* no «·» beside Persian figures (it reads as a zero: «ایران ۰ ۱ از ۹»), and no rule either (it reads as «|»): a Persian comma */}
          <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 30, color: SHEET.olive }}>
            {noDot(p.title)}، {p.sheet}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 26, flexWrap: "wrap", marginTop: 4 }}>
            <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: f.name.length > 14 ? 74 : 90, lineHeight: 1.2, color: SHEET.ink }}>{f.name}</span>
            <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 42, color: SHEET.ink2 }}>{f.years}</span>
          </div>
        </div>
      ) : null}

      {/* the drawing */}
      <Construction x={x} y={y} w={w} h={h} cuts={cuts} at={{ draw: 4, dims: 20, fadeOut: waveAt }} />
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, opacity: flat, transform: `scale(${push})`, transformOrigin: "50% 50%" }}>
        {fields.map((l, i) => layer(l, i, fieldAt, 20))}
        {firstOnField ? layer(firstOnField, 50, fieldAt, 20) : null}
        {later.map((l, i) => layer(l, 100 + i, stripeAt(i), 14))}
        {frame >= sweepFrom ? emblemSvg : null}
        {/* the centre lines go on over the colours while the flag is built, and leave it clean for its meaning */}
        <svg width={w} height={h} style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(fade(frame, fieldAt + 12, 10), leave(frame, meaningFrom + 10, 14)) }}>
          <path d={`M0 ${h / 2}H${w}M${w / 2} 0V${h}`} stroke="rgba(10,12,4,.32)" strokeWidth="3" strokeDasharray="22 7 3 7" fill="none" />
          <path d={`M0 ${h / 2}H${w}M${w / 2} 0V${h}`} stroke="rgba(250,250,235,.75)" strokeWidth="1.4" strokeDasharray="22 7 3 7" fill="none" />
        </svg>
        <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 1.5px rgba(38,42,28,${0.5 * fade(frame, fieldAt, 10)})` }} />
      </div>
      {compassO > 0 ? <Compass cx={CX} cy={CY} r={r * k} turn={turn} o={compassO} /> : null}

      {/* the end: the flag on its pole, waving */}
      {wave > 0 ? (
        <div style={{ position: "absolute", left: x, top: y, width: w + 30, height: h + 120, opacity: wave }}>
          <Waving src={src} w={w} h={h} from={waveAt} />
          <div style={{ position: "absolute", left: w + 4, top: -26, width: 16, height: h + 140, borderRadius: 8, background: "linear-gradient(90deg, #5d5f4a, #c9cbb4 45%, #6b6d55)" }} />
          <div style={{ position: "absolute", left: w - 2, top: -44, width: 28, height: 28, borderRadius: 14, background: "radial-gradient(circle at 35% 35%, #f3e3a8, #b08a2a 70%)" }} />
        </div>
      ) : null}

      {/* the colours, as the site names them, with their codes */}
      <div style={{ position: "absolute", top: y + h + SWATCH_GAP, left: SIDE, right: SIDE, display: "flex", justifyContent: "center", gap: 46, direction: "rtl" }}>
        {f.colors.map((c, i) => {
          const at = colorsB.from + 10 + i * 9;
          const o = fade(frame, at, 8);
          if (o <= 0) return null;
          return (
            <div key={c.hex} style={{ display: "flex", alignItems: "center", gap: 18, opacity: o, transform: `translateY(${rise(frame, at, 24, 12)}px)` }}>
              <div style={{ width: 66, height: 66, borderRadius: 8, background: c.hex, boxShadow: `0 0 0 2px ${SHEET.ink}, 0 0 0 7px ${SHEET.paper}, 0 0 0 8.5px rgba(38,42,28,.35)` }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 32, color: SHEET.ink, lineHeight: 1.2 }}>{c.label}</span>
                <span style={{ fontFamily: VAZIR, fontWeight: 500, fontSize: 23, color: SHEET.ink2, direction: "ltr", textAlign: "right", letterSpacing: "0.06em" }}>{c.hex.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* the emblem's line of the drawing's legend */}
      {frame >= emblemB.from ? (
        <div style={{ position: "absolute", top: y + h + SWATCH_GAP + LEGEND_GAP, right: SIDE + 10, left: SIDE + 10, direction: "rtl", display: "flex", alignItems: "baseline", gap: 18, justifyContent: "center", opacity: Math.min(fade(frame, emblemB.from + 4, 10), leave(frame, sourceFrom, 10)), borderTop: `1.5px solid rgba(38,42,28,.3)`, paddingTop: 16 }}>
          <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 28, color: SHEET.olive }}>نشان</span>
          <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: f.symbols.length > 30 ? 30 : 36, color: SHEET.ink, textWrap: "balance" } as React.CSSProperties}>{f.symbols}</span>
        </div>
      ) : null}

      {/* the stamp: on the drawing's lower corner */}
      {/* the stamp: pressed on the drawing's lower corner, mostly on the paper */}
      <div style={{ position: "absolute", left: Math.max(24, x - (f.approx ? 236 : 196) * 0.5), top: y + h - (f.approx ? 236 : 196) * 0.42 }}>
        <Stamp text={stampText} color={stampColor} at={stampAt} size={f.approx ? 236 : 196} />
      </div>

      <Captions tl={tl} look={{ ink: SHEET.paper, now: "#e3ef9a", band: "rgba(38,42,28,.86)", border: "1.5px solid rgba(147,162,58,.5)" }} bottom={1440} />
      <SourceLine text={p.source} opacity={fade(frame, sourceFrom, 12)} color={SHEET.ink2} strong={SHEET.olive} />
    </Stage>
  );
};

/** The flag's tile for the profile grid: the drafting sheet, the frame of a flag with its dimension lines, the name and years. */
export const FlagTile: React.FC<{ title: string; mark?: string; kicker?: string; series: string }> = ({ title, mark, kicker, series }) => {
  const top = (1920 - 1080) / 2;
  return (
    <AbsoluteFill style={{ background: SHEET.paper, direction: "rtl" }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${SHEET.grid} 1px, transparent 1px), linear-gradient(90deg, ${SHEET.grid} 1px, transparent 1px), linear-gradient(${SHEET.grid2} 1.5px, transparent 1.5px), linear-gradient(90deg, ${SHEET.grid2} 1.5px, transparent 1.5px)`, backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px" }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <rect x={150} y={top + 330} width={780} height={420} fill="none" stroke={SHEET.ink} strokeWidth="3" />
        <path d={`M110 ${top + 540}H970M540 ${top + 300}V${top + 780}`} stroke={SHEET.olive} strokeWidth="2.4" strokeDasharray="26 8 4 8" />
        <path d={`M150 ${top + 286}H930M150 ${top + 276}V${top + 300}M930 ${top + 276}V${top + 300}`} stroke={SHEET.ink2} strokeWidth="2.4" fill="none" />
        <circle cx={540} cy={top + 540} r={150} fill="none" stroke={SHEET.olive} strokeWidth="2.4" strokeDasharray="6 7" />
      </svg>
      <div style={{ position: "absolute", top: top + 96, right: 116, left: 116, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 40, color: SHEET.olive }}>{kicker ?? seriesLine(series)}</span>
        <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 30, color: SHEET.ink2, direction: "ltr" }}>bidar.ahura.cloud</span>
      </div>
      <div style={{ position: "absolute", top: top + 360, height: 360, right: 190, left: 190, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 20, textAlign: "center" }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: title.length > 16 ? 82 : 104, lineHeight: 1.25, color: SHEET.ink, textWrap: "balance", background: "rgba(241,240,226,.85)", padding: "0 18px" } as React.CSSProperties}>{title}</div>
        {mark ? <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 50, color: SHEET.olive, background: "rgba(241,240,226,.85)", padding: "0 14px" }}>{mark}</div> : null}
      </div>
    </AbsoluteFill>
  );
};
