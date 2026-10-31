// «درست یا غلط؟»: three sentences about Iran's past, each on an archive index
// card; three silent seconds to guess, then the rubber stamp «درست» or «غلط»
// and the site's own line of proof under the card, with its trust label. The
// score card asks how many the viewer got (a number to write in the comments),
// and the last frames fade back into the opening, so the Reel loops.
// Every sentence, verdict and proof is in the props, taken word for word from
// the site's pages (its doubts and its gifts; bidar lib/knowledge).
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { DESIGN_BOTTOM, DESIGN_TOP, FPS, Mark, RAIL, SIDE, Sfx, SourceLine, VAZIR, W, clamped, ease, fade, faDigits, grow, leave, rise, shake, slam } from "./kit";
import type { Base } from "./props";
import { Stage, beatAt } from "./Safe";

export type TFRound = { n: string; text: string; verdict: "right" | "wrong"; label: string; proof: string; tier: string; topic: string };
export type TrueFalseProps = Omit<Base, "format" | "hook"> & {
  format: "truefalse";
  hook: string;
  sub: string;
  rounds: TFRound[];
  score: { q: string; a: string; next: string };
};

export const DESK = {
  deep: "#06171a",
  desk: "#0d2a2f",
  desk2: "#12373d",
  card: "#f4ecd9",
  card2: "#e9dec4",
  rule: "#c9584c",
  blue: "#7fa7c9",
  ink: "#1d1a16",
  ink2: "#5a5046",
  cream: "#f4ecd9",
  muted: "#9fb8b5",
  gold: "#e2bd6b",
  right: "#1f9a63",
  wrong: "#cf3b2e",
};

const COLOR = { right: DESK.right, wrong: DESK.wrong };

/** The desk: dark teal felt under a lamp that drifts a little, and the grain of the felt. */
const Ground: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const x = 50 + 8 * Math.sin(frame / 70);
  const y = 34 + 5 * Math.cos(frame / 83);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1100px 1300px at ${x}% ${y}%, ${DESK.desk2}, ${DESK.desk} 45%, ${DESK.deep} 100%)` }}>
      <AbsoluteFill style={{ backgroundImage: "repeating-linear-gradient(35deg, rgba(255,255,255,.018) 0 2px, transparent 2px 7px), repeating-linear-gradient(-35deg, rgba(0,0,0,.05) 0 2px, transparent 2px 9px)", opacity: 0.9 }} />
      <AbsoluteFill style={{ background: "radial-gradient(closest-side at 50% 50%, rgba(0,0,0,0) 62%, rgba(0,0,0,.55) 100%)", opacity: interpolate(frame, [0, total], [0.85, 1]) }} />
    </AbsoluteFill>
  );
};

/** A rubber stamp: a double frame and the word, in ink with gaps, pressed at `at`. */
const Stamp: React.FC<{ word: string; color: string; at: number; size?: number; tilt?: number }> = ({ word, color, at, size = 1, tilt = -8 }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const k = slam(frame, at, 2.4);
  const o = interpolate(frame, [at, at + 3], [0, 0.92], clamped);
  return (
    <div style={{ transform: `rotate(${tilt}deg) scale(${k * size})`, opacity: o, display: "inline-block" }}>
      <div
        style={{
          padding: "10px 46px 22px",
          border: `9px solid ${color}`,
          borderRadius: 22,
          outline: `3px solid ${color}`,
          outlineOffset: 8,
          color,
          fontFamily: VAZIR,
          fontWeight: 900,
          fontSize: 132,
          lineHeight: 1.25,
          // the ink does not take everywhere: thin gaps run through the print
          WebkitMaskImage: "repeating-linear-gradient(115deg, #000 0 11px, rgba(0,0,0,.55) 11px 13px, #000 13px 23px), radial-gradient(circle at 30% 40%, #000 60%, rgba(0,0,0,.75) 100%)",
          WebkitMaskComposite: "source-in",
        }}
      >
        {word}
      </div>
    </div>
  );
};

/** A tick or a cross, drawn on. */
const Mark2: React.FC<{ kind: "right" | "wrong"; p: number; size: number; color: string }> = ({ kind, p, size, color }) => (
  <svg width={size} height={size} viewBox="0 0 40 40">
    {kind === "right" ? (
      <path d="M9 21 L17 29 L32 12" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
    ) : (
      <>
        <path d="M11 11 L29 29" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, p * 2)} />
        <path d="M29 11 L11 29" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.max(0, p * 2 - 1)} />
      </>
    )}
  </svg>
);

/** The opening: the title, the two stamps pressed one after the other, the line under them. */
const Opening: React.FC<{ p: TrueFalseProps; leaveAt: number; loop?: boolean }> = ({ p, leaveAt, loop }) => {
  const frame = useCurrentFrame();
  const out = loop ? 1 : leave(frame, leaveAt + 6, 10);
  const lift = loop ? 0 : interpolate(frame, [leaveAt - 4, leaveAt + 6], [0, -80], { ...clamped, easing: ease });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out, transform: `translateY(${lift}px)` }}>
      <div style={{ position: "absolute", top: DESIGN_TOP + 210, left: 0, right: 0, textAlign: "center", direction: "rtl", fontFamily: VAZIR, fontWeight: 900, fontSize: 150, lineHeight: 1.2, color: DESK.cream, transform: `scale(${loop ? 1 : interpolate(frame, [0, 40], [1.06, 1], { ...clamped, easing: ease })})` }}>
        {p.hook}
      </div>
      <div style={{ position: "absolute", top: DESIGN_TOP + 430, left: 0, right: 0, textAlign: "center", direction: "rtl", fontFamily: VAZIR, fontWeight: 700, fontSize: 54, color: DESK.muted }}>{p.sub}</div>
      <div style={{ position: "absolute", top: DESIGN_TOP + 610, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 70, direction: "rtl" }}>
        <Stamp word="درست" color={DESK.right} at={loop ? -20 : 0} size={0.9} tilt={-9} />
        <Stamp word="غلط" color={DESK.wrong} at={loop ? -20 : 9} size={0.9} tilt={7} />
      </div>
      {/* three empty cards waiting on the desk */}
      <div style={{ position: "absolute", top: DESIGN_TOP + 1010, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 34, direction: "rtl" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: 230, height: 150, borderRadius: 14, background: DESK.card, boxShadow: "0 18px 36px rgba(0,0,0,.45)", transform: `rotate(${[-4, 2, -1][i]}deg) translateY(${loop ? 0 : rise(frame, 10 + i * 4, 60, 16)}px)`, opacity: loop ? 1 : fade(frame, 10 + i * 4, 8), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: 72, color: DESK.rule }}>
            {faDigits(i + 1)}
          </div>
        ))}
      </div>
    </div>
  );
};

export const TrueFalse: React.FC<TrueFalseProps> = (p) => {
  const frame = useCurrentFrame();
  const tl = p.tl!;
  const start = beatAt(tl, "start");
  const rounds = p.rounds.map((_, i) => ({ s: beatAt(tl, `s${i + 1}`), c: beatAt(tl, `c${i + 1}`), v: beatAt(tl, `v${i + 1}`) }));
  const close = beatAt(tl, "end");
  const now = rounds.findLastIndex((r) => frame >= r.s.from - 4);
  const loopFrom = tl.total - 14;
  const sourceFrom = close.from + 30;
  return (
    <Stage ground={<Ground total={tl.total} />} tl={tl} music={p.music}>
      <Sfx at={0} name="stamp" volume={0.4} />
      <Sfx at={9} name="stamp" volume={0.34} />
      {rounds.map((r, i) => (
        <React.Fragment key={i}>
          <Sfx at={r.s.from - 4} name="paper" volume={0.36} />
          {[0, 1, 2].map((t) => (
            <Sfx key={t} at={r.c.from + t * FPS} name="tick" volume={0.24} />
          ))}
          <Sfx at={r.v.from - 2} name="stamp" volume={0.6} />
          <Sfx at={r.v.from + 8} name="rise" volume={0.18} />
          {i ? <Sfx at={r.s.from - 8} name="swish" volume={0.28} /> : null}
        </React.Fragment>
      ))}
      <Sfx at={close.from - 4} name="whoosh" volume={0.3} />
      <Sfx at={loopFrom} name="stamp" volume={0.3} />

      <Mark color={DESK.cream} sub={p.series} subColor={DESK.muted} />

      {frame < rounds[0].s.from + 10 ? <Opening p={p} leaveAt={rounds[0].s.from} /> : null}

      {/* the round's dots: empty, then a tick or a cross in the verdict's colour */}
      {frame >= rounds[0].s.from - 6 && frame < close.from + 20 ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 150, left: SIDE, right: SIDE, display: "flex", alignItems: "center", justifyContent: "space-between", direction: "rtl", opacity: Math.min(fade(frame, rounds[0].s.from - 6, 8), leave(frame, close.from + 20, 10)) }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 52, color: DESK.cream }}>{p.hook}</div>
          <div style={{ display: "flex", gap: 18 }}>
            {rounds.map((r, i) => {
              const done = frame >= r.v.from;
              const kind = p.rounds[i].verdict;
              return (
                <div key={i} style={{ width: 74, height: 74, borderRadius: 37, border: `4px solid ${done ? COLOR[kind] : "rgba(244,236,217,.35)"}`, background: done ? COLOR[kind] : i === now ? "rgba(244,236,217,.12)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${done ? slam(frame, r.v.from, 1.5) : 1})` }}>
                  {done ? <Mark2 kind={kind} p={grow(frame, r.v.from + 2, 10)} size={50} color={DESK.cream} /> : <span style={{ fontFamily: VAZIR, fontWeight: 800, fontSize: 34, color: DESK.muted }}>{faDigits(i + 1)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* the cards: one per sentence, in from the right, out to the left */}
      {p.rounds.map((r, i) => {
        const { s, c, v } = rounds[i];
        const next = rounds[i + 1]?.s.from ?? close.from;
        if (frame < s.from - 6 || frame > next + 12) return null;
        const inP = grow(frame, s.from - 6, 14);
        const outP = interpolate(frame, [next - 8, next + 8], [0, 1], { ...clamped, easing: ease });
        const x = (1 - inP) * 900 - outP * 1100;
        const rot = (1 - inP) * 9 - 1.6 + outP * -8;
        const [sx, sy] = shake(frame, v.from, 9);
        const size = r.text.length <= 34 ? 74 : r.text.length <= 56 ? 64 : 56;
        const counting = frame >= c.from && frame < v.from;
        const left = counting ? Math.max(1, 3 - Math.floor((frame - c.from) / FPS)) : 3;
        const ringP = interpolate(frame, [c.from, c.from + 3 * FPS], [1, 0], clamped);
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", top: DESIGN_TOP + 290, left: SIDE + 6, right: SIDE + 6, height: 640, transform: `translate(${x + sx}px, ${sy}px) rotate(${rot}deg)`, transformOrigin: "50% 60%" }}>
              {/* the index card */}
              <div style={{ position: "absolute", inset: 0, borderRadius: 26, background: `linear-gradient(180deg, ${DESK.card}, ${DESK.card2})`, boxShadow: "0 40px 80px rgba(0,0,0,.55), 0 2px 0 rgba(255,255,255,.6) inset", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 118, left: 0, right: 0, height: 4, background: DESK.rule, opacity: 0.75 }} />
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <div key={k} style={{ position: "absolute", top: 118 + k * 78, left: 36, right: 36, height: 2, background: DESK.blue, opacity: 0.28 }} />
                ))}
                <div style={{ position: "absolute", top: 34, right: 44, left: 44, display: "flex", justifyContent: "space-between", alignItems: "center", direction: "rtl", fontFamily: VAZIR }}>
                  <span style={{ fontWeight: 900, fontSize: 42, color: DESK.rule }}>جملهٔ {r.n} از {faDigits(p.rounds.length)}</span>
                  <span style={{ fontWeight: 700, fontSize: 34, color: DESK.ink2 }}>{r.topic}</span>
                </div>
                <div style={{ position: "absolute", top: 150, right: 56, left: 56, bottom: 120, display: "flex", alignItems: "center", direction: "rtl" }}>
                  <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: size, lineHeight: 1.42, color: DESK.ink, textWrap: "balance" } as React.CSSProperties}>{r.text}</div>
                </div>
                {/* three silent seconds: a ring in the card's corner */}
                {frame >= c.from - 4 && frame < v.from + 4 ? (
                  <div style={{ position: "absolute", bottom: 26, left: 34, width: 108, height: 108, opacity: Math.min(fade(frame, c.from - 4, 4), leave(frame, v.from + 4, 4)) }}>
                    <svg width={108} height={108} viewBox="0 0 108 108" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                      <circle cx={54} cy={54} r={44} fill="none" stroke="rgba(29,26,22,.12)" strokeWidth={10} />
                      <circle cx={54} cy={54} r={44} fill="none" stroke={DESK.rule} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={`${ringP} 1`} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: 54, color: DESK.ink }}>{faDigits(left)}</div>
                  </div>
                ) : null}
              </div>
              {/* the stamp, over the card's lower half */}
              <div style={{ position: "absolute", bottom: 40, right: 60, direction: "rtl" }}>
                <Stamp word={r.label} color={COLOR[r.verdict]} at={v.from - 2} size={0.95} tilt={r.verdict === "right" ? -7 : 6} />
              </div>
            </div>

            {/* the site's proof, under the card */}
            {frame >= v.from + 6 ? (
              <div style={{ position: "absolute", top: DESIGN_TOP + 975, left: SIDE + 6, right: RAIL - 30, direction: "rtl", opacity: Math.min(fade(frame, v.from + 6, 10), 1 - outP), transform: `translateY(${rise(frame, v.from + 6, 40, 16)}px) translateX(${-outP * 1100}px)` }}>
                <div style={{ borderRadius: 26, background: "rgba(6,23,26,.82)", border: `2px solid ${COLOR[r.verdict]}`, padding: "26px 34px 30px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 10 }}>
                    <span style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 40, color: DESK.gold }}>سند</span>
                    <span style={{ fontFamily: VAZIR, fontWeight: 700, fontSize: 28, color: DESK.deep, background: DESK.gold, borderRadius: 30, padding: "2px 18px 6px" }}>{r.tier}</span>
                  </div>
                  <div style={{ fontFamily: VAZIR, fontWeight: 600, fontSize: r.proof.length > 90 ? 38 : 42, lineHeight: 1.6, color: DESK.cream }}>{r.proof}</div>
                </div>
              </div>
            ) : null}
          </React.Fragment>
        );
      })}

      {/* the score: how many did you get? */}
      {frame >= close.from - 4 ? (
        <div style={{ position: "absolute", top: DESIGN_TOP + 280, left: SIDE, right: SIDE, direction: "rtl", textAlign: "center", opacity: Math.min(fade(frame, close.from - 4, 10), leave(frame, loopFrom + 6, 8)) }}>
          <div style={{ fontFamily: VAZIR, fontWeight: 900, fontSize: 96, lineHeight: 1.3, color: DESK.cream, transform: `translateY(${rise(frame, close.from - 4, 40, 16)}px)` }}>{p.score.q}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 30, marginTop: 50 }}>
            {[0, 1, 2, 3].map((n) => (
              <div key={n} style={{ width: 150, height: 150, borderRadius: 75, background: DESK.card, color: DESK.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: VAZIR, fontWeight: 900, fontSize: 92, boxShadow: "0 18px 40px rgba(0,0,0,.45)", transform: `scale(${slam(frame, close.from + 6 + n * 5, 1.6)})`, opacity: fade(frame, close.from + 6 + n * 5, 3) }}>
                {faDigits(n)}
              </div>
            ))}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 20, marginTop: 56, padding: "22px 44px 28px", borderRadius: 60, background: DESK.gold, color: DESK.deep, fontFamily: VAZIR, fontWeight: 900, fontSize: 50, transform: `scale(${slam(frame, close.from + 28, 1.3)})`, opacity: fade(frame, close.from + 28, 4) }}>
            <svg width={56} height={56} viewBox="0 0 40 40">
              <path d="M6 8 H34 A3 3 0 0 1 37 11 V26 A3 3 0 0 1 34 29 H18 L10 35 V29 H6 A3 3 0 0 1 3 26 V11 A3 3 0 0 1 6 8 Z" fill={DESK.deep} />
            </svg>
            {p.score.a}
          </div>
          {/* the three verdicts, small, for a look back */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 60, alignItems: "stretch" }}>
            {p.rounds.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, direction: "rtl", background: "rgba(244,236,217,.08)", borderRadius: 18, padding: "12px 22px 16px", opacity: fade(frame, close.from + 36 + i * 4, 8), transform: `translateY(${rise(frame, close.from + 36 + i * 4, 24, 12)}px)` }}>
                <span style={{ flex: "0 0 auto", fontFamily: VAZIR, fontWeight: 900, fontSize: 30, color: DESK.cream, background: COLOR[r.verdict], borderRadius: 12, padding: "2px 14px 6px" }}>{r.label}</span>
                <span style={{ fontFamily: VAZIR, fontWeight: 600, fontSize: 30, color: DESK.cream, textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 34, fontFamily: VAZIR, fontWeight: 700, fontSize: 36, color: DESK.muted, opacity: fade(frame, close.from + 52, 10) }}>{p.score.next}</div>
        </div>
      ) : null}

      <SourceLine text={p.source} opacity={Math.min(fade(frame, sourceFrom, 12), leave(frame, loopFrom + 6, 8))} color="rgba(244,236,217,.7)" strong={DESK.gold} y={DESIGN_BOTTOM - 150} />

      {/* the loop: the opening comes back over the last frames, so the Reel's end is its beginning */}
      {frame >= loopFrom ? (
        <div style={{ position: "absolute", inset: 0, opacity: fade(frame, loopFrom, 12) }}>
          <Opening p={p} leaveAt={start.to} loop />
        </div>
      ) : null}
    </Stage>
  );
};
