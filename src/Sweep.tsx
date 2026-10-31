// «تاریخِ ایران در یک دقیقه»: the atlas's fourteen periods before 1979, one
// after another, in about a minute. A year counter rolls like an odometer to
// each period's first year (through zero, where «پ.م» turns to «م»), the
// period's name is stamped in its own colour (the atlas's), its years and up to
// three capitals under it, and a line of five thousand years fills period by
// period, to scale, right to left. The close shows the whole line, coloured,
// with every name; the last frames roll the counter back to the first year and
// empty the line, so the end is the beginning. Every name, year, colour and
// capital is the site's (bidar lib/atlas/periods.ts, cities.ts).
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { DESIGN_BOTTOM, DESIGN_TOP, Mark, RAIL, SIDE, Sfx, SourceLine, VAZIR, W, clamped, ease, easeInOut, fade, faDigits, grow, leave, rise, slam } from "./kit";
import type { Base } from "./props";
import { Stage, beatAt } from "./Safe";

export type SweepPeriod = { id: string; name: string; years: string; start: number; tick: string; color: string; capitals: string[] };
export type SweepProps = Omit<Base, "format" | "hook"> & {
  format: "sweep";
  hook: string;
  sub: string;
  periods: SweepPeriod[];
  close: { q: string; a: string };
  /** where the line of time ends (a signed year): 1979 for the whole of it; an episode of part of it ends where its last period does (651 for the periods before Islam) */
  until?: number;
};

/** «≈۳۲۰۰ پ.م» as read on screen: «حدود ۳۲۰۰ پ.م» (a «≈» lands on the wrong side of a Persian figure) */
const about = (tick: string) => tick.replace(/^≈\s*/, "حدود ");

const INK = { deep: "#05070d", ink: "#f4f1ea", muted: "#a7adbb", line: "rgba(244,241,234,.16)" };
/** the line's span: the first period's first year to the end of the last (1979, or the episode's `until`) */
const END_ALL = 1979;

const Ground: React.FC<{ color: string; total: number }> = ({ color, total }) => {
  const frame = useCurrentFrame();
  const y = 38 + 4 * Math.sin(frame / 60);
  return (
    <AbsoluteFill style={{ background: INK.deep }}>
      <AbsoluteFill style={{ background: `radial-gradient(1000px 1100px at 50% ${y}%, ${color}55, ${color}18 45%, rgba(0,0,0,0) 75%)` }} />
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 6px)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,.55) 100%)", opacity: interpolate(frame, [0, total], [0.85, 1]) }} />
    </AbsoluteFill>
  );
};

/** One column of the odometer: the digits 0–9 on a strip, moved to `pos` (a digit and its fraction). */
const Column: React.FC<{ pos: number; h: number; color: string }> = ({ pos, h, color }) => {
  const p = ((pos % 10) + 10) % 10;
  return (
    <div style={{ position: "relative", width: h * 0.62, height: h, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, transform: `translateY(${-p * h}px)` }}>
        {[...Array(11).keys()].map((d) => (
          <div key={d} style={{ height: h, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: h * 0.92, lineHeight: 1, color }}>
            {faDigits(d % 10)}
          </div>
        ))}
      </div>
    </div>
  );
};

/** The year as an odometer: four columns, each turning with the value below it (the units spin, the thousands crawl). */
const Odometer: React.FC<{ value: number; h: number; color: string }> = ({ value, h, color }) => {
  const v = Math.abs(value);
  // each column's position: its digit, plus the fraction of the column below it as it rolls over (only near the turn)
  const cols = [1000, 100, 10, 1].map((place) => {
    if (place === 1) return v % 10;
    const whole = Math.floor(v / place);
    const carry = Math.max(0, (v % place) - (place - 1));
    return (whole % 10) + carry;
  });
  // no leading zeros: a column shows only once the value reaches it
  const from = v >= 1000 ? 0 : v >= 100 ? 1 : v >= 10 ? 2 : 3;
  return (
    <div style={{ display: "flex", direction: "ltr", gap: 2 }}>
      {cols.slice(from).map((pos, i) => (
        <Column key={i} pos={pos} h={h} color={color} />
      ))}
    </div>
  );
};

export const Sweep: React.FC<SweepProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const first = beatAt(tl, "start");
  const beats = p.periods.map((_, i) => beatAt(tl, `p${i + 1}`));
  const close = beatAt(tl, "end");
  const loopFrom = tl.total - 16;
  const now = beats.findLastIndex((b) => frame >= b.from - 2);
  const cur = p.periods[Math.max(0, now)];
  const START = p.periods[0].start;
  const END = Number.isFinite(p.until) && (p.until as number) > START ? (p.until as number) : END_ALL;
  // the year: rolled to each period's first year over 14 frames; at the close it holds the end, then rolls back to the start
  let year = START;
  if (now >= 0) {
    const b = beats[now];
    const prev = now > 0 ? p.periods[now - 1].start : START;
    year = interpolate(frame, [b.from - 2, b.from + 12], [prev, cur.start], { ...clamped, easing: easeInOut });
  }
  if (frame >= close.from - 2) year = interpolate(frame, [close.from - 2, close.from + 12], [p.periods[p.periods.length - 1].start, END], { ...clamped, easing: easeInOut });
  if (frame >= loopFrom) year = interpolate(frame, [loopFrom, tl.total - 2], [END, START], { ...clamped, easing: easeInOut });
  const bce = Math.round(year) < 0;
  const color = frame >= close.from - 2 && frame < loopFrom ? "#e8c56a" : now >= 0 ? cur.color : p.periods[0].color;
  // the line of time: right is the oldest; x of a year on the line
  const L0 = SIDE + 10;
  const L1 = W - SIDE - 10;
  const xOf = (y: number) => L1 - ((y - START) / (END - START)) * (L1 - L0);
  const filled = frame >= loopFrom ? interpolate(frame, [loopFrom, tl.total - 2], [END, START], clamped) : year;
  const lineY = DESIGN_TOP + 1120;
  // the counter sits under the title in the opening, then rises to the top while the periods run, and comes back down for the loop
  const counterY = frame >= loopFrom ? interpolate(frame, [loopFrom, loopFrom + 12], [200, 520], { ...clamped, easing: easeInOut }) : interpolate(frame, [beats[0].from - 4, beats[0].from + 10], [520, 200], { ...clamped, easing: easeInOut });
  const inClose = frame >= close.from - 2;
  return (
    <Stage ground={<Ground color={color} total={tl.total} />} tl={tl} music={p.music}>
      <Sfx at={0} name="rise" volume={0.26} />
      {beats.map((b, i) => (
        <React.Fragment key={i}>
          <Sfx at={b.from - 2} name="tick" volume={0.26} />
          <Sfx at={b.from + 10} name="hit" volume={i % 2 ? 0.3 : 0.38} />
        </React.Fragment>
      ))}
      <Sfx at={close.from} name="chime" volume={0.24} />
      <Sfx at={loopFrom} name="whoosh" volume={0.26} />

      <Mark color={INK.ink} sub={p.series} subColor={INK.muted} />

      {/* the opening's title, over the counter at its first year */}
      {frame < beats[0].from + 10 || frame >= loopFrom ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 170, left: SIDE, right: SIDE, textAlign: "center", direction: "rtl", opacity: frame >= loopFrom ? fade(frame, loopFrom, 12) : leave(frame, beats[0].from + 8, 10) }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 92, lineHeight: 1.25, whiteSpace: "nowrap", color: INK.ink, transform: `scale(${frame >= loopFrom ? 1 : interpolate(frame, [0, 40], [1.06, 1], { ...clamped, easing: ease })})` }}>{p.hook}</div>
          <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 64, color: p.periods[0].color, marginTop: 6 }}>{p.sub}</div>
        </div>
      ) : null}

      {/* the counter */}
      <div style={{ position: "absolute", top: DESIGN_TOP + counterY, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 26, direction: "rtl", transition: "none" }}>
        <Odometer value={year} h={200} color={INK.ink} />
        <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 70, color, paddingBottom: 26, minWidth: 120 }}>{bce ? "پ.م" : "م"}</div>
      </div>

      {/* the period: its name stamped in its colour, its years, its capitals */}
      {now >= 0 && !inClose ? (
        <div key={now} style={{ position: "absolute", top: DESIGN_TOP + 470, left: SIDE, right: RAIL - 40, direction: "rtl", textAlign: "center" }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: cur.name.length > 14 ? 104 : 136, lineHeight: 1.2, color, textShadow: "0 12px 40px rgba(0,0,0,.55)", transform: `scale(${slam(frame, beats[now].from + 8, 1.7)})`, opacity: fade(frame, beats[now].from + 8, 3) }}>{cur.name}</div>
          <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 68, color: INK.ink, marginTop: 18, opacity: fade(frame, beats[now].from + 14, 6), transform: `translateY(${rise(frame, beats[now].from + 14, 20, 10)}px)` }}>{cur.years}</div>
          {cur.capitals.length ? (
            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 26, flexWrap: "wrap", opacity: fade(frame, beats[now].from + 20, 6) }}>
              <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 40, color: INK.muted, paddingTop: 8 }}>پایتخت:</span>
              {cur.capitals.map((c, k) => (
                <span key={k} style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 44, color: INK.deep, background: color, borderRadius: 30, padding: "4px 24px 12px", transform: `scale(${slam(frame, beats[now].from + 20 + k * 3, 1.3)})` }}>
                  {c}
                </span>
              ))}
            </div>
          ) : null}
          <div style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 34, color: INK.muted, marginTop: 30 }}>
            {faDigits(now + 1)} از {faDigits(p.periods.length)}
          </div>
        </div>
      ) : null}

      {/* the close: the question over the whole coloured line, every name under it */}
      {inClose && frame < loopFrom + 10 ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 430, left: SIDE - 10, right: SIDE - 10, direction: "rtl", textAlign: "center", opacity: Math.min(fade(frame, close.from, 10), leave(frame, loopFrom + 8, 8)) }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 68, lineHeight: 1.3, color: INK.ink, whiteSpace: "nowrap" }}>{p.close.q}</div>
          <div style={{ display: "inline-block", marginTop: 18, padding: "12px 40px 18px", borderRadius: 40, background: "#e8c56a", color: INK.deep, fontFamily: VAZIR, fontWeight: 900, fontSize: 42, transform: `scale(${slam(frame, close.from + 12, 1.3)})` }}>{p.close.a}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px", marginTop: 26, direction: "rtl" }}>
            {p.periods.map((per, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 14px 8px", borderRadius: 14, background: "rgba(244,241,234,.06)", borderRight: `8px solid ${per.color}`, opacity: fade(frame, close.from + 8 + i * 2, 6), transform: `translateY(${rise(frame, close.from + 8 + i * 2, 16, 10)}px)` }}>
                <span style={{ flex: 1, textAlign: "right", fontFamily: VAZIR, fontWeight: 800, fontSize: 27, color: INK.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{per.name}</span>
                <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 23, color: per.color, whiteSpace: "nowrap" }}>{about(per.tick)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* the line of five thousand years, to scale */}
      <div style={{ position: "absolute", top: lineY, left: 0, right: 0, height: 260 }}>
        <div style={{ position: "absolute", top: 40, left: L0, width: L1 - L0, height: 26, borderRadius: 13, background: INK.line }} />
        {p.periods.map((per, i) => {
          const a = per.start;
          const b = i + 1 < p.periods.length ? p.periods[i + 1].start : END;
          const shown = Math.min(b, Math.max(a, filled));
          if (shown <= a) return null;
          const x1 = xOf(a);
          const x2 = xOf(shown);
          return <div key={i} style={{ position: "absolute", top: 40, left: x2, width: Math.max(2, x1 - x2), height: 26, background: per.color, borderRadius: i === 0 ? "0 13px 13px 0" : i === p.periods.length - 1 ? "13px 0 0 13px" : 0, boxShadow: i === now && !inClose ? `0 0 24px ${per.color}` : "none" }} />;
        })}
        {/* the cursor */}
        <div style={{ position: "absolute", top: 18, left: xOf(filled) - 3, width: 6, height: 70, borderRadius: 3, background: INK.ink, boxShadow: "0 0 16px rgba(255,255,255,.8)" }} />
        {/* the ends and zero */}
        {[
          [START, about(p.periods[0].tick)],
          // zero only when the line crosses it (an episode after Islam starts in the common era)
          ...(START < 0 && END > 0 ? [[0, "۰"]] : []),
          [END, `${faDigits(END)} م`],
        ].map(([y, label], k) => (
          <div key={k} style={{ position: "absolute", top: 86, left: xOf(Number(y)) - 120, width: 240, textAlign: "center", fontFamily: VAZIR, fontWeight: 700, fontSize: 28, color: INK.muted, direction: "rtl" }}>
            {label}
          </div>
        ))}
      </div>

      <SourceLine text={p.source} opacity={Math.min(fade(frame, close.from + 30, 12), leave(frame, loopFrom + 6, 8))} color="rgba(244,241,234,.7)" strong="#e8c56a" y={DESIGN_BOTTOM - 120} />
    </Stage>
  );
};
