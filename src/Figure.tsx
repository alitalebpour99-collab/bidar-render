// «چهره‌ها»: one person of Bidar's dictionary as a Swiss editorial poster, made
// of type, rules and one colour only: no face, no portrait, no picture of anyone
// (the owner's rule: the lane draws type, maps and lines). On warm paper with a
// visible grid: the name huge, the epithet, a disc in the colour of the person's
// era; a ruler of five thousand years (Elam to today, the atlas's periods on it)
// on which their life lights up and opens into a close-up; then the dictionary's
// line on them and their facts, each on a card that flips in; a saying of theirs
// to close when they have one. Every word is in the props.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { NASKH } from "./Book";
import { DESIGN_BOTTOM, DESIGN_TOP, FPS, H, Mark, RAIL, SIDE, Sfx, VAZIR, W, clamped, ease, fade, faDigits, grow, leave, rise, slam } from "./kit";
import type { FigureProps } from "./props";
import { Stage, beatAt } from "./Safe";
import { SourceBlock } from "./cite";

export const SWISS = { paper: "#ECE8DF", paper2: "#E2DDD2", ink: "#131313", ink2: "#3B3A37", grey: "#8B877E", faint: "rgba(19,19,19,.08)" };

/**
 * One accent colour per era, by the middle of the life: vermilion before the
 * common era, ultramarine for late antiquity, emerald for the Islamic middle
 * ages, saffron for the Safavid to Qajar centuries, magenta for the twentieth.
 * The renderer's choice of colour, not a statement of the post.
 */
export function accentOf(year: number): string {
  if (year < 0) return "#E0402A";
  if (year < 651) return "#2445CC";
  if (year < 1501) return "#0C8A5E";
  if (year < 1900) return "#DE9410";
  return "#D41E66";
}

const L = SIDE;
const R = W - SIDE;
const WIDTH = R - L;
/** The ruler's line and the close-up's, on the design frame. */
const RULER_Y = 852;
const ZOOM_Y = 968;
/** Where the text of the poster sits: the definition, the cards, the saying. */
const BODY = { top: 1040, bottom: DESIGN_BOTTOM - 150 };

/** Time runs right to left, as the page is read: the oldest at the right. */
const xOf = (year: number, from: number, to: number) => R - ((year - from) / (to - from)) * WIDTH;

const yearLabel = (y: number) => (y < 0 ? `${faDigits(-y)} پ.م` : y === 0 ? "میلاد" : `${faDigits(y)} م`);

const Ground: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: SWISS.paper }}>
      {/* the grain of an uncoated sheet */}
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(0,0,0,.018) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, rgba(0,0,0,.014) 0 1px, transparent 1px 4px)" }} />
      {/* the grid, twelve columns, drawn down from the top in the first second */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 13 }, (_, i) => {
          const x = 76 + (i * (W - 152)) / 12;
          return <line key={i} x1={x} x2={x} y1={0} y2={H * grow(frame, i * 1.2, 26)} stroke={SWISS.faint} strokeWidth={1} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** The ruler of five thousand years and the close-up of the life. */
const Ruler: React.FC<{ p: FigureProps; accent: string; at: number; lit: number }> = ({ p, accent, at, lit }) => {
  const frame = useCurrentFrame();
  const { from, to } = p.ruler;
  const line = grow(frame, at, 20);
  const life = { a: xOf(p.span.from, from, to), b: xOf(p.span.to, from, to) };
  const lifeW = Math.max(8, life.a - life.b);
  const lifeX = (life.a + life.b) / 2 - lifeW / 2;
  // the close-up: the life with a margin on each side, ticks every 10, 25, 50 or 100 years
  const len = p.span.to - p.span.from;
  const pad = Math.max(12, Math.round(len * 0.35));
  const z = { from: p.span.from - pad, to: p.span.to + pad };
  const zStep = [10, 25, 50, 100, 250].find((s) => (z.to - z.from) / s <= 8) ?? 500;
  const zTicks: number[] = [];
  for (let y = Math.ceil(z.from / zStep) * zStep; y <= z.to; y += zStep) if (y !== 0 && y <= 1979) zTicks.push(y);
  const open = grow(frame, lit + 10, 18);
  const zl = { a: xOf(p.span.from, z.from, z.to), b: xOf(p.span.to, z.from, z.to) };
  const ticks = [-3000, -2000, -1000, 0, 1000];
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
      {/* the atlas's periods above the line: one lane of grey segments, a hair apart, a later one over an earlier */}
      {p.eras.map((e, i) => {
        const a = xOf(Math.max(from, e.from), from, to);
        const b = xOf(Math.min(to, e.to), from, to);
        return <rect key={e.id} x={b + 1} y={RULER_Y - 24} width={Math.max(2, a - b - 2)} height={14} fill={SWISS.ink} opacity={(i % 2 ? 0.26 : 0.13) * fade(frame, at + 6 + i, 8)} />;
      })}
      <line x1={R} x2={R - WIDTH * line} y1={RULER_Y} y2={RULER_Y} stroke={SWISS.ink} strokeWidth={4} />
      {ticks.map((y) => {
        const x = xOf(y, from, to);
        return (
          <g key={y} opacity={fade(frame, at + 10, 10)}>
            <line x1={x} x2={x} y1={RULER_Y - 8} y2={RULER_Y + 12} stroke={SWISS.ink} strokeWidth={2} />
            <text x={x} y={RULER_Y + 46} textAnchor="middle" fontFamily={VAZIR} fontWeight={600} fontSize={22} fill={SWISS.grey}>{yearLabel(y)}</text>
          </g>
        );
      })}
      <text x={L} y={RULER_Y + 46} textAnchor="start" fontFamily={VAZIR} fontWeight={800} fontSize={22} fill={SWISS.ink} opacity={fade(frame, at + 12, 10)}>{p.ruler.end}</text>
      {/* the life, lit on the long line */}
      <rect x={lifeX} y={RULER_Y - 20 * slam(frame, lit, 1.6)} width={lifeW} height={40 * Math.min(1, slam(frame, lit, 1.6))} fill={accent} opacity={fade(frame, lit, 3)} />
      {/* and opened into a close-up below */}
      <path d={`M${lifeX} ${RULER_Y + 22} L${R - WIDTH * 0.04} ${ZOOM_Y - 22} L${L + WIDTH * 0.04} ${ZOOM_Y - 22} L${lifeX + lifeW} ${RULER_Y + 22} Z`} fill={accent} opacity={0.1 * open} />
      <line x1={R - WIDTH * 0.04} x2={R - WIDTH * 0.04 - WIDTH * 0.92 * open} y1={ZOOM_Y} y2={ZOOM_Y} stroke={SWISS.ink} strokeWidth={3} opacity={open} />
      {zTicks.map((y) => {
        const x = L + WIDTH * 0.04 + ((xOf(y, z.from, z.to) - L) / WIDTH) * WIDTH * 0.92;
        return (
          <g key={y} opacity={fade(frame, lit + 22, 8)}>
            <line x1={x} x2={x} y1={ZOOM_Y - 6} y2={ZOOM_Y + 8} stroke={SWISS.ink} strokeWidth={1.5} />
            <text x={x} y={ZOOM_Y + 36} textAnchor="middle" fontFamily={VAZIR} fontWeight={500} fontSize={20} fill={SWISS.grey}>{y < 0 ? `${faDigits(-y)} پ.م` : faDigits(y)}</text>
          </g>
        );
      })}
      {(() => {
        const a = L + WIDTH * 0.04 + ((zl.a - L) / WIDTH) * WIDTH * 0.92;
        const b = L + WIDTH * 0.04 + ((zl.b - L) / WIDTH) * WIDTH * 0.92;
        const g = grow(frame, lit + 16, 16);
        return <rect x={a - (a - b) * g} y={ZOOM_Y - 13} width={(a - b) * g} height={26} fill={accent} />;
      })()}
    </svg>
  );
};

/** Text that wipes in from the right as it is read (between `from` and `to`). */
const Read: React.FC<{ from: number; to: number; style: React.CSSProperties; children: React.ReactNode }> = ({ from, to, style, children }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from - 2, Math.max(from + 6, to - 6)], [0, 1], { ...clamped, easing: ease });
  return (
    <div style={{ position: "relative", ...style }}>
      <div style={{ opacity: 0.1 }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(-20% 0 -20% ${(1 - p) * 100}%)` }}>{children}</div>
    </div>
  );
};

/** A card that flips in on its top edge and away again. */
const Card: React.FC<{ from: number; to: number; last: boolean; children: React.ReactNode }> = ({ from, to, last, children }) => {
  const frame = useCurrentFrame();
  if (frame < from - 8 || (!last && frame > to + 8)) return null;
  const inA = interpolate(frame, [from - 8, from + 8], [-92, 0], { ...clamped, easing: ease });
  const outA = last ? 0 : interpolate(frame, [to - 6, to + 8], [0, 92], { ...clamped, easing: ease });
  const a = frame < to - 6 ? inA : outA;
  return (
    <div style={{ position: "absolute", left: L, right: RAIL, top: BODY.top, bottom: H - BODY.bottom, perspective: 1600 }}>
      <div style={{ position: "absolute", inset: 0, transformOrigin: a <= 0 ? "50% 0%" : "50% 100%", transform: `rotateX(${a}deg)`, backfaceVisibility: "hidden", opacity: interpolate(Math.abs(a), [70, 92], [1, 0], clamped) }}>{children}</div>
    </div>
  );
};

export const Figure: React.FC<FigureProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const mid = (p.span.from + p.span.to) / 2;
  const accent = accentOf(mid);
  const life = beatAt(tl, "life");
  const def = beatAt(tl, "def");
  const facts = p.facts.map((_, i) => beatAt(tl, `f${i + 1}`));
  const q = p.quote ? beatAt(tl, "q1") : null;
  const close = beatAt(tl, "end");
  const n = p.who.name.length;
  const nameSize = n <= 4 ? 280 : n <= 7 ? 220 : n <= 10 ? 172 : n <= 14 ? 138 : 116;
  const sourceFrom = tl.total - Math.round(2.6 * FPS);
  const sentences = p.facts.every((f) => !f.label);
  // the definition gives way to the first card, each card to the next, the last one to the saying
  const defEnd = facts[0]?.from ?? q?.from ?? close.from;
  return (
    <Stage ground={<Ground />} tl={tl} music={p.music}>
      <Sfx at={0} name="whoosh" volume={0.18} />
      <Sfx at={life.from} name="draw" volume={0.28} />
      <Sfx at={life.from + 10} name="pop" volume={0.3} />
      {facts.map((f, i) => (
        <Sfx key={i} at={f.from - 8} name="swish" volume={0.2} />
      ))}
      {q ? <Sfx at={q.from - 6} name="paper" volume={0.22} /> : null}

      {/* the disc of the era's colour, behind the name */}
      <div style={{ position: "absolute", left: L - 120, top: 210, width: 540, height: 540, borderRadius: 270, background: accent, transform: `scale(${interpolate(frame, [0, 14], [0.86, 1], { ...clamped, easing: ease })})`, opacity: 0.96 }} />

      <Mark color={SWISS.ink} sub={p.series} subColor={SWISS.ink2} />
      <div style={{ position: "absolute", top: DESIGN_TOP + 26, left: L, fontFamily: VAZIR, fontWeight: 900, fontSize: 40, color: SWISS.ink, direction: "rtl" }}>{p.kicker}</div>
      <div style={{ position: "absolute", top: 196, left: L, right: L, height: 10, background: SWISS.ink, transformOrigin: "100% 50%", transform: `scaleX(${grow(frame, 0, 16)})` }} />

      {/* the name, huge, readable from the first frame; the epithet under it */}
      <div style={{ position: "absolute", top: 236, left: L, right: L, direction: "rtl", textAlign: "right" }}>
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: nameSize, lineHeight: 1.08, letterSpacing: "-0.01em", color: SWISS.ink, textWrap: "balance", transform: `translateX(${-rise(frame, 0, 18, 14)}px)` } as React.CSSProperties}>{p.who.name}</div>
        <div style={{ fontFamily: VAZIR, fontWeight: 600, fontSize: 48, lineHeight: 1.4, color: SWISS.ink2, marginTop: 18, maxWidth: 760, marginRight: 0, opacity: fade(frame, 4, 10) }}>{p.who.epithet}</div>
      </div>

      {/* the years, big, in the era's colour, as the ruler lights them up */}
      <div style={{ position: "absolute", top: 676, right: L, direction: "rtl", fontFamily: VAZIR, fontWeight: 900, fontSize: 76, lineHeight: 1.2, color: accent, opacity: fade(frame, life.from, 6), transform: `scale(${slam(frame, life.from, 1.3)})`, transformOrigin: "100% 50%" }}>{p.who.life}</div>
      <Ruler p={p} accent={accent} at={8} lit={life.from + 8} />

      {/* the dictionary's line on them, read */}
      {frame < defEnd + 8 ? (
        <div style={{ position: "absolute", left: L, right: RAIL, top: BODY.top, direction: "rtl", opacity: Math.min(fade(frame, def.from - 8, 8), leave(frame, defEnd + 4, 10)) }}>
          <div style={{ height: 6, width: 120, background: accent, marginBottom: 26, opacity: fade(frame, def.from - 4, 6) }} />
          <Read from={def.from} to={def.to} style={{ fontFamily: VAZIR, fontWeight: 500, fontSize: p.def.length > 150 ? 42 : 46, lineHeight: 1.75, color: SWISS.ink }}>
            {p.def}
          </Read>
        </div>
      ) : null}

      {/* the facts, a card each */}
      {p.facts.map((f, i) => (
        <Card key={i} from={facts[i].from} to={facts[i + 1]?.from ?? q?.from ?? close.from + 600} last={i === p.facts.length - 1 && !q}>
          <div style={{ position: "absolute", inset: 0, background: SWISS.paper2, borderTop: `10px solid ${accent}`, padding: "34px 40px 30px", direction: "rtl", display: "flex", gap: 30 }}>
            <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 150, lineHeight: 0.9, color: accent, minWidth: 96 }}>{faDigits(i + 1)}</div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: sentences ? "flex-start" : "center", gap: 14 }}>
              {f.label ? <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 34, color: SWISS.ink2 }}>{f.label}</div> : null}
              <Read from={facts[i].from + 4} to={facts[i].to} style={{ fontFamily: VAZIR, fontWeight: f.label ? 800 : 600, fontSize: f.label ? (f.value.length > 40 ? 50 : 58) : f.value.length > 140 ? 38 : 42, lineHeight: f.label ? 1.45 : 1.72, color: SWISS.ink }}>
                {f.value}
              </Read>
            </div>
            {/* how far through the cards */}
            <div style={{ position: "absolute", left: 40, bottom: 34, display: "flex", gap: 8 }}>
              {p.facts.map((_, k) => (
                <span key={k} style={{ width: 18, height: 18, background: k <= i ? accent : "transparent", border: `2.5px solid ${k <= i ? accent : SWISS.grey}` }} />
              ))}
            </div>
          </div>
        </Card>
      ))}

      {/* a saying of theirs, to close */}
      {p.quote && q ? (
        <Card from={q.from} to={close.from + 600} last>
          <div style={{ position: "absolute", inset: 0, direction: "rtl", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, borderTop: `10px solid ${SWISS.ink}`, paddingTop: 26 }}>
            <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 130, lineHeight: 0.6, color: accent, height: 60 }}>«</div>
            {p.quote.lines.map((l, i) => (
              <Read key={i} from={beatAt(tl, `q${i + 1}`).from} to={beatAt(tl, `q${i + 1}`).to} style={{ fontFamily: NASKH, fontWeight: 700, fontSize: p.quote!.lines.join("").length > 70 ? 50 : 58, lineHeight: 1.8, color: SWISS.ink, textAlign: p.quote!.verse ? (i ? "left" : "right") : "right" }}>
                {l}
              </Read>
            ))}
            <div style={{ fontFamily: VAZIR, fontWeight: 500, fontSize: 26, color: SWISS.grey, direction: "ltr", textAlign: "right", opacity: fade(frame, q.from + 20, 10) }}>{p.quote.cite}</div>
          </div>
        </Card>
      ) : null}

      <SourceBlock text={p.source} font={VAZIR} color={SWISS.ink2} strong={SWISS.ink} style={{ position: "absolute", top: DESIGN_BOTTOM - 126, left: SIDE, right: RAIL, opacity: fade(frame, sourceFrom, 12) }} />
    </Stage>
  );
};
