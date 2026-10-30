// «سخنِ ماندگار»: one sourced saying of a person of Bidar's dictionary, as an
// illuminated page. A lapis ground with the grain of paper and the gold flecks
// of lapis lazuli; a gilded tazhib frame (double rule, a band of lozenges,
// corner pieces, a cartouche at the head with the series' name) drawn on with
// the pen; the saying written word by word as the narrator reads it, a verse in
// Gulzar's Nastaliq (its two halves staggered like a chalipa), prose in the
// book's Naskh; at the end the speaker's name and years come down as a round
// cinnabar seal (مُهر) and the source line, in Naskh, closes the page.
// Kept light for GitHub's software GL: SVG strokes, gradients and text, no blur.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { NASKH } from "./Book";
import { GULZAR, H, Mark, RAIL, Sfx, VAZIR, W, clamped, ease, fade, grow, rise, slam } from "./kit";
import type { QuoteProps, Word } from "./props";
import { Stage, beatAt } from "./Safe";
import { SourceBlock } from "./cite";

export const ILLUM = {
  lapis: "#0d1d4c",
  lapis2: "#08133a",
  night: "#040a1e",
  gold: "#d8b35c",
  goldLight: "#f3d98f",
  goldDeep: "#9c7629",
  cream: "#f5e9c9",
  cream2: "#d6c9a5",
  cinnabar: "#b83c28",
  cinnabarDeep: "#7f2317",
};

/** The page's outer rule on the design frame; the inner rule sits INSET inside it. */
const F = { x: 72, y: 246, w: 936, h: 1290 };
const INSET = 30;
/** The seal's size on the design frame. */
const SEAL = 262;
const CX = W / 2;
/** The width the saying is set in, inside the inner rule. */
const TEXT_W = F.w - 2 * (INSET + 46);

/** A fixed scatter of flecks (pyrite in lapis), the same on every frame and every Reel. */
const FLECKS = (() => {
  let s = 97;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  return Array.from({ length: 90 }, () => ({ x: r() * W, y: r() * H, size: 0.6 + r() * 1.9, o: 0.12 + r() * 0.45, ph: r() * 6.28 }));
})();

const Ground: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, total], [42, 50]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1250px 1550px at 50% ${y}%, #16307a 0%, ${ILLUM.lapis} 36%, ${ILLUM.lapis2} 68%, ${ILLUM.night} 100%)` }}>
      {/* the grain of the paper: fine fibres and a faint laid line */}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(83deg, rgba(245,233,201,.028) 0 1px, transparent 1px 7px), repeating-linear-gradient(-71deg, rgba(245,233,201,.022) 0 1px, transparent 1px 11px), repeating-linear-gradient(0deg, rgba(0,0,0,.06) 0 1px, transparent 1px 4px)" }} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {FLECKS.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.size} fill={ILLUM.goldLight} opacity={f.o * (0.75 + 0.25 * Math.sin(frame * 0.06 + f.ph))} />
        ))}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 47%, rgba(4,10,30,0) 64%, rgba(2,5,16,.6) 100%)" }} />
    </AbsoluteFill>
  );
};

/** A rectangle drawn from the middle of its top edge down both sides at once, `p` of the way (0–1). */
const TwoWayRule: React.FC<{ x: number; y: number; w: number; h: number; p: number; width: number; stroke: string; opacity?: number }> = ({ x, y, w, h, p, width, stroke, opacity = 1 }) => {
  const right = `M${x + w / 2} ${y} H${x + w} V${y + h} H${x + w / 2}`;
  const left = `M${x + w / 2} ${y} H${x} V${y + h} H${x + w / 2}`;
  return (
    <g opacity={opacity}>
      {[right, left].map((d) => (
        <path key={d} d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="square" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
      ))}
    </g>
  );
};

/** A corner piece in its own frame (the corner at 0,0, the page toward +x, +y): two arcs, a palmette on the diagonal, two leaves along the edges. */
const CORNER = [
  "M74 0 A74 74 0 0 1 0 74",
  "M48 0 A48 48 0 0 1 0 48",
  "M0 0 C18 4 34 18 40 40 C18 34 4 18 0 0 Z",
  "M74 0 C88 8 104 10 122 6 C106 -2 90 -4 74 0 Z",
  "M0 74 C8 88 10 104 6 122 C-2 106 -4 90 0 74 Z",
];

const Corner: React.FC<{ x: number; y: number; sx: number; sy: number; p: number; fill: number }> = ({ x, y, sx, sy, p, fill }) => (
  <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
    {CORNER.map((d, i) => (
      <path key={i} d={d} fill={i >= 2 ? `rgba(216,179,92,${0.28 * fill})` : "none"} stroke="url(#ill-gold)" strokeWidth={2.4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
    ))}
    <circle cx={30} cy={30} r={4} fill={ILLUM.gold} opacity={fill} />
  </g>
);

/** The band between the two rules: a row of small lozenges, appearing from the head down both sides. */
function bandPoints(): { x: number; y: number; at: number }[] {
  const g = INSET / 2;
  const x0 = F.x + g;
  const y0 = F.y + g;
  const x1 = F.x + F.w - g;
  const y1 = F.y + F.h - g;
  const half = F.w / 2 - g + (F.h - 2 * g) + (F.w / 2 - g);
  const out: { x: number; y: number; at: number }[] = [];
  const step = 34;
  for (const side of [1, -1]) {
    for (let d = 0; d <= half; d += step) {
      // walk from the head's middle along one half of the frame
      let x: number;
      let y: number;
      const top = F.w / 2 - g;
      const down = F.h - 2 * g;
      if (d <= top) {
        x = CX + side * d;
        y = y0;
      } else if (d <= top + down) {
        x = side > 0 ? x1 : x0;
        y = y0 + (d - top);
      } else {
        x = (side > 0 ? x1 : x0) - side * (d - top - down);
        y = y1;
      }
      out.push({ x, y, at: d / half });
    }
  }
  return out;
}
const BAND = bandPoints();

/** The cartouche at the head of the page (a کتیبه with pointed ends), straddling the outer rule. */
const cartouche = (cx: number, cy: number, w: number, h: number) => {
  const a = w / 2;
  const b = h / 2;
  const k = a - b * 1.1;
  return `M${cx - a} ${cy} Q${cx - k - b * 0.25} ${cy - b} ${cx - k} ${cy - b} H${cx + k} Q${cx + k + b * 0.25} ${cy - b} ${cx + a} ${cy} Q${cx + k + b * 0.25} ${cy + b} ${cx + k} ${cy + b} H${cx - k} Q${cx - k - b * 0.25} ${cy + b} ${cx - a} ${cy} Z`;
};

const Frame: React.FC = () => {
  const frame = useCurrentFrame();
  const rule = grow(frame, 2, 44);
  const inner = grow(frame, 10, 46);
  const corners = grow(frame, 18, 40);
  const head = grow(frame, 0, 26);
  const headFill = fade(frame, 14, 14);
  const cw = 540;
  const ch = 118;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      <defs>
        <linearGradient id="ill-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ILLUM.goldLight} />
          <stop offset="0.5" stopColor={ILLUM.gold} />
          <stop offset="1" stopColor={ILLUM.goldDeep} />
        </linearGradient>
      </defs>
      {/* the double rule and the thin third one */}
      <TwoWayRule x={F.x} y={F.y} w={F.w} h={F.h} p={rule} width={5} stroke="url(#ill-gold)" />
      <TwoWayRule x={F.x + INSET} y={F.y + INSET} w={F.w - 2 * INSET} h={F.h - 2 * INSET} p={inner} width={2.2} stroke="url(#ill-gold)" />
      <TwoWayRule x={F.x + INSET + 9} y={F.y + INSET + 9} w={F.w - 2 * INSET - 18} h={F.h - 2 * INSET - 18} p={inner} width={1} stroke={ILLUM.gold} opacity={0.55} />
      {/* the band of lozenges, following the pen */}
      {BAND.map((b, i) => {
        const o = interpolate(rule, [b.at * 0.92, b.at * 0.92 + 0.08], [0, 1], clamped);
        return o > 0 ? <path key={i} d={`M${b.x} ${b.y - 6} L${b.x + 6} ${b.y} L${b.x} ${b.y + 6} L${b.x - 6} ${b.y} Z`} fill={ILLUM.gold} opacity={0.75 * o} /> : null;
      })}
      {/* the corner pieces, inside the inner rule */}
      <Corner x={F.x + INSET} y={F.y + INSET} sx={1} sy={1} p={corners} fill={fade(frame, 40, 16)} />
      <Corner x={F.x + F.w - INSET} y={F.y + INSET} sx={-1} sy={1} p={corners} fill={fade(frame, 40, 16)} />
      <Corner x={F.x + INSET} y={F.y + F.h - INSET} sx={1} sy={-1} p={corners} fill={fade(frame, 40, 16)} />
      <Corner x={F.x + F.w - INSET} y={F.y + F.h - INSET} sx={-1} sy={-1} p={corners} fill={fade(frame, 40, 16)} />
      {/* the cartouche at the head: lapis inside, a gold edge and an inner line */}
      <path d={cartouche(CX, F.y, cw, ch)} fill={ILLUM.lapis2} fillOpacity={headFill} stroke="url(#ill-gold)" strokeWidth={3.2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - head} />
      <path d={cartouche(CX, F.y, cw - 26, ch - 22)} fill="none" stroke={ILLUM.gold} strokeWidth={1.4} opacity={0.7 * headFill} />
      {[-1, 1].map((s) => (
        <circle key={s} cx={CX + s * (cw / 2 + 16)} cy={F.y} r={6} fill={ILLUM.gold} opacity={headFill} />
      ))}
      {/* a small rosette at the foot */}
      <g transform={`translate(${CX} ${F.y + F.h})`} opacity={fade(frame, 36, 14)}>
        <circle r={20} fill={ILLUM.lapis2} stroke={ILLUM.gold} strokeWidth={2.4} />
        <path d="M0 -12 L3.5 -3.5 L12 0 L3.5 3.5 L0 12 L-3.5 3.5 L-12 0 L-3.5 -3.5 Z" fill={ILLUM.gold} />
      </g>
    </svg>
  );
};

/** The round seal (مُهر): cinnabar, a double ring, the name and the years; stamped, with the unevenness of a stamp. */
const Seal: React.FC<{ name: string; life: string; at: number }> = ({ name, life, at }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const s = slam(frame, at, 2.1);
  const size = SEAL;
  const nameSize = name.length > 12 ? 34 : name.length > 8 ? 42 : 52;
  // the ink left uneven by the stamp: fixed light specks over the red
  const specks = Array.from({ length: 26 }, (_, i) => ({ a: i * 2.39996, r: 18 + ((i * 37) % 96), sz: 1.5 + (i % 4) }));
  return (
    <div style={{ width: size, height: size, position: "relative", transform: `rotate(-8deg) scale(${s})`, opacity: fade(frame, at, 2) }}>
      <svg width={size} height={size} viewBox="0 0 250 250" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="seal-ink" cx="0.45" cy="0.4" r="0.7">
            <stop offset="0" stopColor="#c9482f" />
            <stop offset="1" stopColor={ILLUM.cinnabarDeep} />
          </radialGradient>
        </defs>
        <circle cx="125" cy="125" r="118" fill="url(#seal-ink)" />
        <circle cx="125" cy="125" r="106" fill="none" stroke={ILLUM.cream} strokeWidth="3" opacity=".85" />
        <circle cx="125" cy="125" r="98" fill="none" stroke={ILLUM.cream} strokeWidth="1.2" opacity=".6" strokeDasharray="3 5" />
        {specks.map((p, i) => (
          <circle key={i} cx={125 + Math.cos(p.a) * p.r} cy={125 + Math.sin(p.a) * p.r} r={p.sz} fill={ILLUM.cream} opacity={0.1} />
        ))}
        {/* the edge of a stamp is never quite round */}
        <circle cx="125" cy="125" r="118" fill="none" stroke={ILLUM.cinnabarDeep} strokeWidth="5" strokeDasharray="22 4 9 6 30 3" opacity=".7" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", direction: "rtl", color: ILLUM.cream, textAlign: "center" }}>
        <div style={{ fontFamily: GULZAR, fontSize: nameSize, lineHeight: 1.5, maxWidth: 190 }}>{name}</div>
        <div style={{ width: 90, height: 2, background: ILLUM.cream, opacity: 0.6, margin: "2px 0 8px" }} />
        <div style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 21, direction: "rtl", whiteSpace: "nowrap" }}>{life}</div>
      </div>
    </div>
  );
};

type Placed = { text: string; from: number };

/** The words of each line with the frame each is written at: the narrator's own timing, else spread over the line's beat. */
function placeWords(lines: string[], words: Word[], beatOf: (id: string) => { from: number; to: number }): Placed[][] {
  return lines.map((line, k) => {
    const shown = line.split(/\s+/).filter(Boolean);
    const said = words.filter((w) => w.beat === `l${k + 1}`);
    if (said.length === shown.length) return shown.map((text, i) => ({ text, from: said[i].from }));
    const { from, to } = beatOf(`l${k + 1}`);
    const span = Math.max(1, to - from - 12);
    return shown.map((text, i) => ({ text, from: from + Math.round((span * i) / shown.length) }));
  });
}

/** A word inked in from its right edge (Persian is written right to left), gold while wet, cream when dry; before that a faint guide. */
const Inked: React.FC<{ w: Placed; style: React.CSSProperties }> = ({ w, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [w.from - 2, w.from + 7], [0, 1], { ...clamped, easing: ease });
  const wet = interpolate(frame, [w.from + 4, w.from + 26], [1, 0], clamped);
  return (
    <span style={{ position: "relative", display: "inline-block", ...style }}>
      <span style={{ opacity: 0.07 }}>{w.text}</span>
      <span style={{ position: "absolute", inset: 0, clipPath: `inset(-45% -12% -45% ${(1 - p) * 112 - 12}%)`, color: wet > 0.02 ? mixColor(ILLUM.goldLight, ILLUM.cream, 1 - wet) : ILLUM.cream, textShadow: `0 0 ${18 * wet}px rgba(243,217,143,${0.55 * wet}), 0 2px 6px rgba(0,0,0,.45)` }}>{w.text}</span>
    </span>
  );
};

/** Two hex colours mixed, t of the way from a to b. */
function mixColor(a: string, b: string, t: number): string {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${ca.map((v, i) => Math.round(v + (cb[i] - v) * t)).join(",")})`;
}

/** The type of a saying: a verse in Gulzar, its size from its longest half; prose in Naskh, its size from its length. */
function typeOf(p: QuoteProps) {
  if (p.verse) {
    const longest = Math.max(...p.lines.map((l) => l.length));
    return { family: GULZAR, weight: 400, size: Math.max(50, Math.min(100, Math.floor(TEXT_W / (Math.max(10, longest) * 0.35)))), lineHeight: 2.3 };
  }
  const n = p.lines.join(" ").length;
  return { family: NASKH, weight: 700, size: n <= 34 ? 86 : n <= 64 ? 74 : n <= 100 ? 64 : n <= 130 ? 57 : 52, lineHeight: 1.95 };
}

export const Quote: React.FC<QuoteProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const start = beatAt(tl, "start");
  const first = beatAt(tl, "l1");
  const rest = beatAt(tl, "rest");
  const seal = beatAt(tl, "seal");
  const t = typeOf(p);
  const placed = placeWords(p.lines, tl.words, (id) => beatAt(tl, id));
  // the name stands big in the middle while it is said, then goes up to the head of the page
  const up = interpolate(frame, [first.from - 10, first.from + 12], [0, 1], { ...clamped, easing: ease });
  const nameSize = p.who.name.length > 12 ? 104 : p.who.name.length > 7 ? 124 : 150;
  const stagger = p.verse && p.lines.length === 2 && Math.max(...p.lines.map((l) => l.length)) <= 30;
  const sealAt = seal.from + 3;
  return (
    <Stage ground={<Ground total={tl.total} />} tl={tl} music={p.music}>
      <Sfx at={0} name="draw" volume={0.22} />
      <Sfx at={first.from - 8} name="swish" volume={0.16} />
      <Sfx at={rest.from + 2} name="chime" volume={0.12} />
      <Sfx at={sealAt} name="stamp" volume={0.5} />

      <Mark color={ILLUM.gold} sub={p.series} subColor={ILLUM.cream2} />
      <Frame />
      <div style={{ position: "absolute", left: CX - 230, width: 460, top: F.y - 59, height: 118, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: GULZAR, fontSize: 52, lineHeight: 1, color: ILLUM.goldLight, direction: "rtl", opacity: fade(frame, 16, 12), paddingBottom: 12 }}>{p.kicker}</div>

      {/* who: big in the middle from the first frame, then the page's running head */}
      <div
        style={{
          position: "absolute",
          left: F.x + 60,
          right: F.x + 60,
          top: interpolate(up, [0, 1], [640, F.y + 74]),
          textAlign: "center",
          direction: "rtl",
          transform: `scale(${interpolate(up, [0, 1], [1, 0.56])}) translateY(${rise(frame, 0, 14, 14)}px)`,
          transformOrigin: "50% 0%",
        }}
      >
        <div style={{ fontFamily: GULZAR, fontSize: nameSize, lineHeight: 1.6, color: ILLUM.goldLight, textShadow: "0 3px 10px rgba(0,0,0,.5)" }}>{p.who.name}</div>
        <div style={{ fontFamily: VAZIR, fontWeight: 600, fontSize: 46, color: ILLUM.cream2, marginTop: 4, opacity: interpolate(up, [0, 1], [1, 0.95]) }}>{p.who.epithet}</div>
      </div>

      {/* the saying, written as it is read */}
      <div style={{ position: "absolute", left: F.x + INSET + 46, right: F.x + INSET + 46, top: 450, bottom: H - 1240, display: "flex", flexDirection: "column", justifyContent: "center", direction: "rtl", opacity: fade(frame, first.from - 14, 8) }}>
        {placed.map((ws, k) => (
          <div
            key={k}
            style={{
              fontFamily: t.family,
              fontWeight: t.weight,
              fontSize: t.size,
              lineHeight: t.lineHeight,
              color: ILLUM.cream,
              textAlign: stagger ? (k === 0 ? "right" : "left") : "center",
              textWrap: "balance",
              marginTop: k ? (p.verse ? 22 : 12) : 0,
              whiteSpace: p.verse ? "nowrap" : "normal",
              paddingInline: stagger ? 10 : 0,
            } as React.CSSProperties}
          >
            {ws.map((w, i) => (
              <React.Fragment key={i}>
                <Inked w={w} style={{}} />
                {i < ws.length - 1 ? " " : null}
              </React.Fragment>
            ))}
          </div>
        ))}
        {/* a gilded divider under the saying, when it is all written */}
        <svg width={420} height={24} viewBox="-210 -12 420 24" style={{ alignSelf: "center", marginTop: 26, overflow: "visible", opacity: fade(frame, rest.from, 10) }}>
          <path d={`M${-200 * grow(frame, rest.from, 20)} 0 H${200 * grow(frame, rest.from, 20)}`} stroke={ILLUM.gold} strokeWidth={2} />
          {[-1, 0, 1].map((k) => (
            <path key={k} d={`M${k * 40} -8 L${k * 40 + 8} 0 L${k * 40} 8 L${k * 40 - 8} 0 Z`} fill={ILLUM.gold} />
          ))}
        </svg>
      </div>

      {/* the seal, at the foot of the page on the left, where a colophon is sealed */}
      <div style={{ position: "absolute", left: F.x + INSET + 34, top: F.y + F.h - INSET - 34 - SEAL }}>
        <Seal name={p.who.name} life={p.who.life} at={sealAt} />
      </div>

      <div style={{ position: "absolute", left: F.x + INSET + 34 + SEAL + 34, right: RAIL + 10, top: F.y + F.h - INSET - 34 - SEAL, height: SEAL, display: "flex", flexDirection: "column", justifyContent: "center", opacity: fade(frame, seal.from + 10, 14), transform: `translateY(${(1 - fade(frame, seal.from + 10, 14)) * 12}px)` }}>
        <SourceBlock text={p.source} font={NASKH} size={29} color={ILLUM.cream2} strong={ILLUM.gold} />
      </div>
    </Stage>
  );
};
